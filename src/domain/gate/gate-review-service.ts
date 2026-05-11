/**
 * Gate Review Service (Slice 9)
 *
 * Implements:
 *   - docs/26-gate-review-console-spec.md §3 Gate Types, §13 Buyer-ready Approval Gate
 *   - docs/26 §15 Override Policy
 *   - docs/13-status-transition.md §12 Guard Conditions
 *   - docs/19-disclosure-guard-policy.md §9 P0 Disclosure
 *   - docs/18-risk-boundary-policy.md §4 Forbidden patterns
 *
 * Rules:
 *   - P0 disclosure → blocked (docs/26 §7)
 *   - Missing required expert patch → blocked (docs/26 §10)
 *   - Only reviewer/admin can approve buyer-ready (docs/26 §13)
 *   - P0 disclosure cannot be overridden for external sharing (docs/26 §15)
 *   - Override requires reason + risk_acknowledged (docs/26 §15)
 */

import { type MobileIMSection, type MobileIMLiteGateResult } from "../mobile-im/mobile-im-types";

// ─── Types ─────────────────────────────────────────────────────────────

export type GateType =
  | "data_gate"
  | "disclosure_gate"
  | "risk_gate"
  | "financial_consistency_gate"
  | "expert_scope_gate"
  | "design_quality_gate"
  | "training_rights_gate"
  | "buyer_ready_approval_gate";

export type GateStatus = "not_run" | "pass" | "revise" | "expert_required" | "blocked" | "internal_only";
export type ViolationSeverity = "p0" | "high" | "medium" | "low";

export interface GateResult {
  gate_type: GateType;
  status: GateStatus;
  violation_count: number;
  last_run?: string;
}

export interface GateViolation {
  gate_type: GateType;
  section_id?: string;
  severity: ViolationSeverity;
  issue_type: string;
  message: string;
  recommended_action: string;
  can_override: boolean;
}

export interface GateCheckInput {
  project_id: string;
  sections: {
    id: string;
    section_type: string;
    status: string;
    requires_expert_patch: boolean;
    missing_data: string[];
  }[];
  building_ssot_full: Record<string, unknown>;
  expert_patches: {
    section_id: string;
    status: string;
    visibility_after_review: string;
  }[];
  section_markdown_samples: {
    section_id: string;
    markdown: string;
    visibility: string;
  }[];
  readiness_score: number;
}

export interface GateCheckResult {
  project_id: string;
  overall_status: GateStatus;
  gates: GateResult[];
  violations: GateViolation[];
  has_p0_violation: boolean;
  buyer_ready_eligible: boolean;
  run_at: string;
}

// ─── Buyer-ready approval types ────────────────────────────────────────

export interface BuyerReadyApprovalInput {
  actor_role: string;
  gate_results: { gate_type: string; status: GateStatus }[];
  has_p0_violation: boolean;
  missing_required_patches: string[];
}

export interface BuyerReadyApprovalResult {
  can_approve: boolean;
  reason?: string;
  blocking_gates: string[];
}

// ─── Override types ────────────────────────────────────────────────────

export interface GateOverrideInput {
  reviewer_id: string;
  gate_type: string;
  section_id: string;
  reason: string;
  risk_acknowledged: boolean;
  is_p0_disclosure?: boolean;
}

export interface GateOverrideRecord {
  reviewer_id: string;
  gate_type: string;
  section_id: string;
  reason: string;
  risk_acknowledged: boolean;
  timestamp: string;
}

// ─── Roles that can approve buyer-ready ───────────────────────────────
const BUYER_READY_APPROVERS = new Set(["reviewer", "admin"]);

// ─── P0 disclosure patterns (docs/19 §3) ──────────────────────────────
const P0_ADDRESS_PATTERNS = [
  /[가-힣]+구\s+[가-힣]+동\s*\d+[-\d]*/,
  /[가-힣]+시\s+[가-힣]+구\s+[가-힣]+동/,
  /\d{1,4}-\d{1,4}\s*번지/,
];

const P0_TENANT_PATTERNS = [
  /스타벅스|CU\s|GS25|이마트|롯데마트|[가-힣A-Za-z0-9]+\s*(임차인|입점)/,
];

const P0_UNIT_RENT_PATTERNS = [
  /월세\s*\d+만\s*원|보증금\s*\d+억|\d+호\s*[가-힣]*\s*\d+만\s*원/,
];

// ─── Risk boundary patterns (docs/18 §4) ──────────────────────────────
const P0_RISK_PATTERNS = [
  /매수\s*를?\s*추천|수익률\s*(이|은|가)?\s*보장|NOI\s*(가|이)?\s*확정|대출\s*(이)?\s*가능합니다|금리\s*(가|이)?\s*확정/,
];

// ─── runGateCheck ──────────────────────────────────────────────────────

export function runGateCheck(input: GateCheckInput): GateCheckResult {
  const violations: GateViolation[] = [];
  const gateStatuses: Record<GateType, GateStatus> = {
    data_gate: "pass",
    disclosure_gate: "pass",
    risk_gate: "pass",
    financial_consistency_gate: "pass",
    expert_scope_gate: "pass",
    design_quality_gate: "pass",
    training_rights_gate: "pass",
    buyer_ready_approval_gate: "not_run",
  };

  // ── Data Gate ─────────────────────────────────────────────────────
  const ssot = input.building_ssot_full;
  const leaseIncome = (ssot.lease_income ?? {}) as Record<string, unknown>;
  const legalRegistry = (ssot.legal_registry ?? {}) as Record<string, unknown>;

  if (!leaseIncome.rent_roll_confirmed) {
    violations.push({
      gate_type: "data_gate", severity: "high", issue_type: "missing_rent_roll",
      message: "임대차 현황(Rent Roll)이 확인되지 않았습니다.",
      recommended_action: "임대차계약서 또는 임대현황표를 업로드하고 검토하세요.",
      can_override: true,
    });
    gateStatuses.data_gate = "revise";
  }

  if (!leaseIncome.operating_expenses_confirmed) {
    violations.push({
      gate_type: "data_gate", severity: "high", issue_type: "missing_opex",
      message: "운영비 가정이 확인되지 않았습니다.",
      recommended_action: "운영비 항목(관리비, 수선비, 보험료 등)을 입력하거나 전문가 패치를 요청하세요.",
      can_override: true,
    });
    if (gateStatuses.data_gate !== "blocked") gateStatuses.data_gate = "revise";
  }

  if (!legalRegistry.registry_confirmed) {
    violations.push({
      gate_type: "data_gate", severity: "medium", issue_type: "missing_registry",
      message: "등기부등본이 확인되지 않았습니다.",
      recommended_action: "등기부등본을 첨부하세요.",
      can_override: true,
    });
  }

  // ── Disclosure Gate ──────────────────────────────────────────────
  const disclosureGate = (ssot.disclosure_gate ?? {}) as Record<string, unknown>;
  const protectedFields = (disclosureGate.protected_fields as string[]) ?? [];

  for (const sample of input.section_markdown_samples) {
    const isExternalOutput = sample.visibility === "public_blind" || sample.visibility === "public";

    if (isExternalOutput || protectedFields.includes("exact_address")) {
      for (const pat of P0_ADDRESS_PATTERNS) {
        if (pat.test(sample.markdown)) {
          violations.push({
            gate_type: "disclosure_gate",
            section_id: sample.section_id,
            severity: "p0",
            issue_type: "exact_address_exposed",
            message: "정확한 주소가 외부 공개 섹션에 노출되어 있습니다.",
            recommended_action: "지역 신호(area_signal)로 대체하세요.",
            can_override: false, // P0 disclosure cannot be overridden
          });
          gateStatuses.disclosure_gate = "blocked";
          break;
        }
      }
    }

    for (const pat of P0_TENANT_PATTERNS) {
      if (pat.test(sample.markdown) && isExternalOutput) {
        violations.push({
          gate_type: "disclosure_gate",
          section_id: sample.section_id,
          severity: "p0",
          issue_type: "tenant_name_exposed",
          message: "임차인 이름이 외부 공개 섹션에 노출되어 있습니다.",
          recommended_action: "임차인 업종 정보로 대체하세요.",
          can_override: false,
        });
        gateStatuses.disclosure_gate = "blocked";
        break;
      }
    }

    for (const pat of P0_UNIT_RENT_PATTERNS) {
      if (pat.test(sample.markdown) && isExternalOutput) {
        violations.push({
          gate_type: "disclosure_gate",
          section_id: sample.section_id,
          severity: "p0",
          issue_type: "unit_rent_exposed",
          message: "호실별 임대료가 외부 공개 섹션에 노출되어 있습니다.",
          recommended_action: "임대수익 요약 정보로 대체하세요.",
          can_override: false,
        });
        gateStatuses.disclosure_gate = "blocked";
        break;
      }
    }

    // Risk Gate — P0 risk pattern check
    for (const pat of P0_RISK_PATTERNS) {
      if (pat.test(sample.markdown)) {
        violations.push({
          gate_type: "risk_gate",
          section_id: sample.section_id,
          severity: "p0",
          issue_type: "forbidden_financial_claim",
          message: "허용되지 않는 투자 권유 또는 확정 표현이 포함되어 있습니다.",
          recommended_action: "Risk Boundary 안전 표현으로 대체하세요.",
          can_override: false,
        });
        gateStatuses.risk_gate = "blocked";
        break;
      }
    }
  }

  // ── Expert Scope Gate ────────────────────────────────────────────
  const patchedSectionIds = new Set(
    input.expert_patches
      .filter(p => p.status === "submitted" || p.status === "approved")
      .map(p => p.section_id),
  );

  for (const section of input.sections) {
    if (section.requires_expert_patch && !patchedSectionIds.has(section.id)) {
      violations.push({
        gate_type: "expert_scope_gate",
        section_id: section.id,
        severity: "high",
        issue_type: "missing_expert_patch",
        message: `섹션 '${section.section_type}'에 expert patch가 필요합니다. 전문가 검토를 요청하세요.`,
        recommended_action: "전문가 검토를 요청하거나 override reason을 입력하세요.",
        can_override: true,
      });
      gateStatuses.expert_scope_gate = "blocked";
    }
  }

  // ── Financial Consistency Gate ───────────────────────────────────
  if (input.readiness_score < 60) {
    violations.push({
      gate_type: "financial_consistency_gate",
      severity: "high",
      issue_type: "low_readiness_score",
      message: `Readiness 점수(${input.readiness_score})가 60 미만입니다. 재무 일관성을 확인하세요.`,
      recommended_action: "누락된 재무 데이터를 보완하세요.",
      can_override: true,
    });
    gateStatuses.financial_consistency_gate = "revise";
  }

  // ── Design Quality Gate ──────────────────────────────────────────
  const hasDisclaimer = input.sections.some(s => s.section_type === "cover_confidentiality" && s.status !== "planned");
  if (!hasDisclaimer) {
    violations.push({
      gate_type: "design_quality_gate",
      severity: "high",
      issue_type: "missing_disclaimer",
      message: "면책 조항(Cover/Confidentiality) 섹션이 없습니다.",
      recommended_action: "Cover 섹션을 생성하고 면책 문구를 추가하세요.",
      can_override: false,
    });
    gateStatuses.design_quality_gate = "revise";
  }

  // ── Overall status ───────────────────────────────────────────────
  const allStatuses = Object.values(gateStatuses).filter(s => s !== "not_run");
  const hasP0 = violations.some(v => v.severity === "p0");
  const hasBlocked = allStatuses.some(s => s === "blocked");
  const hasRevise = allStatuses.some(s => s === "revise");

  let overallStatus: GateStatus = "pass";
  if (hasBlocked || hasP0) overallStatus = "blocked";
  else if (hasRevise) overallStatus = "revise";

  const buyerReadyEligible = overallStatus === "pass" && !hasP0;

  // Build gate results array
  const gates: GateResult[] = (Object.entries(gateStatuses) as [GateType, GateStatus][]).map(([gate_type, status]) => ({
    gate_type,
    status,
    violation_count: violations.filter(v => v.gate_type === gate_type).length,
    last_run: new Date().toISOString(),
  }));

  return {
    project_id: input.project_id,
    overall_status: overallStatus,
    gates,
    violations,
    has_p0_violation: hasP0,
    buyer_ready_eligible: buyerReadyEligible,
    run_at: new Date().toISOString(),
  };
}

// ─── canApproveBuyerReady ──────────────────────────────────────────────

export function canApproveBuyerReady(input: BuyerReadyApprovalInput): BuyerReadyApprovalResult {
  // 1. Role check — only reviewer/admin
  if (!BUYER_READY_APPROVERS.has(input.actor_role)) {
    return {
      can_approve: false,
      reason: `Buyer-ready 승인은 reviewer 또는 admin만 가능합니다. 현재 역할: ${input.actor_role}`,
      blocking_gates: [],
    };
  }

  // 2. P0 violation check
  if (input.has_p0_violation) {
    return {
      can_approve: false,
      reason: "P0 공시 위반 또는 리스크 표현이 있어 Buyer-ready 승인이 차단되었습니다.",
      blocking_gates: ["disclosure_gate"],
    };
  }

  // 3. Check for blocked gates
  const blockedGates = input.gate_results
    .filter(g => g.status === "blocked")
    .map(g => g.gate_type);

  if (blockedGates.length > 0) {
    return {
      can_approve: false,
      reason: `다음 Gate가 차단 상태입니다: ${blockedGates.join(", ")}`,
      blocking_gates: blockedGates,
    };
  }

  // 4. Missing expert patches
  if (input.missing_required_patches.length > 0) {
    return {
      can_approve: false,
      reason: `다음 섹션의 전문가 패치가 필요합니다: ${input.missing_required_patches.join(", ")}`,
      blocking_gates: ["expert_scope_gate"],
    };
  }

  return { can_approve: true, blocking_gates: [] };
}

// ─── buildGateOverride ────────────────────────────────────────────────

export function buildGateOverride(input: GateOverrideInput): GateOverrideRecord {
  // P0 disclosure cannot be overridden (docs/26 §15)
  if (input.is_p0_disclosure) {
    throw new Error("P0 공시 위반은 외부 공유 목적으로 override할 수 없습니다.");
  }

  if (!input.reason || !input.reason.trim()) {
    throw new Error("Override reason is required (docs/26 §15)");
  }

  if (!input.risk_acknowledged) {
    throw new Error("Override requires risk_acknowledged = true (docs/26 §15)");
  }

  return {
    reviewer_id: input.reviewer_id,
    gate_type: input.gate_type,
    section_id: input.section_id,
    reason: input.reason.trim(),
    risk_acknowledged: input.risk_acknowledged,
    timestamp: new Date().toISOString(),
  };
}

// ─── Mobile IM Lite Gate ──────────────────────────────────────────────

export function runMobileIMLiteGate(
  sections: MobileIMSection[],
  bssotLite: Record<string, unknown>
): MobileIMLiteGateResult {
  let disclosure_status: "pass" | "redacted" | "blocked" = "pass";
  let risk_status: "pass" | "revise" | "blocked" = "pass";
  const redacted_fields: string[] = [];
  const risk_issues: { severity: string; message: string }[] = [];

  const disclosureGate = (bssotLite.disclosure_gate ?? {}) as Record<string, unknown>;
  const protectedFields = (disclosureGate.protected_fields as string[]) ?? [];

  if (protectedFields.includes("exact_address")) {
    redacted_fields.push("정확한 주소");
  }

  for (const section of sections) {
    // Disclosure Gate checks
    if (protectedFields.includes("exact_address")) {
      for (const pat of P0_ADDRESS_PATTERNS) {
        if (pat.test(section.markdown)) {
          disclosure_status = "blocked";
        }
      }
    }

    for (const pat of P0_TENANT_PATTERNS) {
      if (pat.test(section.markdown)) {
        disclosure_status = "blocked";
      }
    }

    for (const pat of P0_UNIT_RENT_PATTERNS) {
      if (pat.test(section.markdown)) {
        disclosure_status = "blocked";
      }
    }

    // Risk Gate checks
    for (const pat of P0_RISK_PATTERNS) {
      if (pat.test(section.markdown)) {
        risk_status = "blocked";
        risk_issues.push({
          severity: "p0",
          message: "수익률 확정 또는 투자 권유 문구가 발견되었습니다."
        });
      }
    }
  }

  if (disclosure_status === "pass" && protectedFields.length > 0) {
    disclosure_status = "redacted";
  }

  return {
    disclosure_status,
    risk_status,
    redacted_fields,
    risk_issues
  };
}
