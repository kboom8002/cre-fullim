/**
 * Unit Tests: Gate Review Service (Slice 9)
 *
 * Tests for:
 *   - docs/26-gate-review-console-spec.md §13 Buyer-ready Approval Gate
 *   - docs/26 §15 Override Policy
 *   - docs/13-status-transition.md §12 Guard Conditions
 *   - docs/19-disclosure-guard-policy.md §9 P0 Disclosure Failures
 *   - docs/18-risk-boundary-policy.md §3 P0 severity blocks
 *
 * Rules:
 *   - P0 disclosure violation → buyer-ready BLOCKED (docs/26 §7, §13)
 *   - Missing required expert patch → buyer-ready BLOCKED (docs/26 §10)
 *   - broker role CANNOT approve buyer-ready (docs/03 user roles)
 *   - reviewer/admin CAN approve after gates pass (docs/26 §13)
 *   - override requires reason, reviewer_id, timestamp (docs/26 §15)
 *   - P0 disclosure issues cannot be overridden for external sharing (docs/26 §15)
 */
import { describe, it, expect } from "vitest";
import {
  runGateCheck,
  canApproveBuyerReady,
  buildGateOverride,
  type GateCheckInput,
  type BuyerReadyApprovalInput,
  type GateOverrideInput,
} from "@/domain/gate/gate-review-service";

// ─── Fixtures ──────────────────────────────────────────────────────────

const BASE_GATE_INPUT: GateCheckInput = {
  project_id: "proj_001",
  sections: [
    { id: "sec_01", section_type: "cover_confidentiality",   status: "buyer_ready",  requires_expert_patch: false, missing_data: [] },
    { id: "sec_02", section_type: "executive_summary",        status: "patched",      requires_expert_patch: false, missing_data: [] },
    { id: "sec_03", section_type: "income_noi_yield_analysis",status: "patched",      requires_expert_patch: false, missing_data: [] },
    { id: "sec_04", section_type: "debt_sensitivity_cash_flow",status:"patched",      requires_expert_patch: false, missing_data: [] },
  ],
  building_ssot_full: {
    disclosure_gate: { protected_fields: ["exact_address"] },
    lease_income: { rent_roll_confirmed: true, operating_expenses_confirmed: true },
    legal_registry: { registry_confirmed: true },
  },
  expert_patches: [
    { section_id: "sec_03", status: "submitted", visibility_after_review: "gate_restricted" },
    { section_id: "sec_04", status: "submitted", visibility_after_review: "gate_restricted" },
  ],
  section_markdown_samples: [],
  readiness_score: 85,
};

const WITH_P0_DISCLOSURE: GateCheckInput = {
  ...BASE_GATE_INPUT,
  section_markdown_samples: [
    { section_id: "sec_02", markdown: "서울 성동구 성수동2가 123-45번지에 위치합니다.", visibility: "public_blind" },
  ],
};

const WITH_MISSING_EXPERT_PATCH: GateCheckInput = {
  ...BASE_GATE_INPUT,
  sections: [
    ...BASE_GATE_INPUT.sections.slice(0, 2),
    { id: "sec_03", section_type: "income_noi_yield_analysis", status: "ai_draft", requires_expert_patch: true, missing_data: [] },
    { id: "sec_04", section_type: "debt_sensitivity_cash_flow", status: "ai_draft", requires_expert_patch: true, missing_data: [] },
  ],
  expert_patches: [], // no patches submitted
};

const ALL_PASS_INPUT: GateCheckInput = {
  ...BASE_GATE_INPUT,
  section_markdown_samples: [
    { section_id: "sec_02", markdown: "성수권역 소재 자산입니다. 상세 주소는 별도 제공됩니다.", visibility: "public_blind" },
  ],
};

// ─── 1. P0 Disclosure Gate ─────────────────────────────────────────────

describe("runGateCheck: disclosure gate", () => {
  it("returns disclosure gate blocked when P0 address is exposed", () => {
    const result = runGateCheck(WITH_P0_DISCLOSURE);
    const disclosure = result.gates.find(g => g.gate_type === "disclosure_gate");
    expect(disclosure).toBeDefined();
    expect(disclosure!.status).toBe("blocked");
  });

  it("P0 disclosure violation is in violations list", () => {
    const result = runGateCheck(WITH_P0_DISCLOSURE);
    const p0 = result.violations.find(v => v.severity === "p0" && v.gate_type === "disclosure_gate");
    expect(p0).toBeDefined();
  });

  it("overall_status is blocked when P0 disclosure exists", () => {
    const result = runGateCheck(WITH_P0_DISCLOSURE);
    expect(result.overall_status).toBe("blocked");
  });

  it("disclosure gate passes when no protected fields exposed", () => {
    const result = runGateCheck(ALL_PASS_INPUT);
    const disclosure = result.gates.find(g => g.gate_type === "disclosure_gate");
    expect(["pass", "revise"]).toContain(disclosure!.status);
  });
});

// ─── 2. Expert Scope Gate ─────────────────────────────────────────────

describe("runGateCheck: expert scope gate", () => {
  it("expert scope gate is blocked when required patch missing", () => {
    const result = runGateCheck(WITH_MISSING_EXPERT_PATCH);
    const expertGate = result.gates.find(g => g.gate_type === "expert_scope_gate");
    expect(expertGate).toBeDefined();
    expect(expertGate!.status).toBe("blocked");
  });

  it("violation includes missing expert patch info", () => {
    const result = runGateCheck(WITH_MISSING_EXPERT_PATCH);
    const v = result.violations.find(v => v.gate_type === "expert_scope_gate");
    expect(v).toBeDefined();
    expect(v!.message).toContain("expert");
  });

  it("expert scope gate passes when all patches submitted", () => {
    const result = runGateCheck(ALL_PASS_INPUT);
    const expertGate = result.gates.find(g => g.gate_type === "expert_scope_gate");
    expect(["pass", "revise"]).toContain(expertGate!.status);
  });
});

// ─── 3. canApproveBuyerReady ──────────────────────────────────────────

describe("canApproveBuyerReady", () => {
  it("reviewer can approve when all gates pass", () => {
    const input: BuyerReadyApprovalInput = {
      actor_role: "reviewer",
      gate_results: [
        { gate_type: "disclosure_gate", status: "pass" },
        { gate_type: "risk_gate", status: "pass" },
        { gate_type: "data_gate", status: "pass" },
        { gate_type: "expert_scope_gate", status: "pass" },
        { gate_type: "financial_consistency_gate", status: "pass" },
        { gate_type: "design_quality_gate", status: "pass" },
      ],
      has_p0_violation: false,
      missing_required_patches: [],
    };
    const result = canApproveBuyerReady(input);
    expect(result.can_approve).toBe(true);
  });

  it("broker CANNOT approve buyer-ready (role restriction)", () => {
    const input: BuyerReadyApprovalInput = {
      actor_role: "broker",
      gate_results: [
        { gate_type: "disclosure_gate", status: "pass" },
        { gate_type: "risk_gate", status: "pass" },
        { gate_type: "data_gate", status: "pass" },
        { gate_type: "expert_scope_gate", status: "pass" },
        { gate_type: "financial_consistency_gate", status: "pass" },
        { gate_type: "design_quality_gate", status: "pass" },
      ],
      has_p0_violation: false,
      missing_required_patches: [],
    };
    const result = canApproveBuyerReady(input);
    expect(result.can_approve).toBe(false);
    expect(result.reason).toContain("reviewer");
  });

  it("P0 disclosure violation blocks buyer-ready regardless of role", () => {
    const input: BuyerReadyApprovalInput = {
      actor_role: "reviewer",
      gate_results: [{ gate_type: "disclosure_gate", status: "blocked" }],
      has_p0_violation: true,
      missing_required_patches: [],
    };
    const result = canApproveBuyerReady(input);
    expect(result.can_approve).toBe(false);
    expect(result.reason).toContain("P0");
  });

  it("missing required expert patch blocks buyer-ready", () => {
    const input: BuyerReadyApprovalInput = {
      actor_role: "reviewer",
      gate_results: [
        { gate_type: "disclosure_gate", status: "pass" },
        { gate_type: "expert_scope_gate", status: "blocked" },
      ],
      has_p0_violation: false,
      missing_required_patches: ["income_noi_yield_analysis"],
    };
    const result = canApproveBuyerReady(input);
    expect(result.can_approve).toBe(false);
    expect(result.blocking_gates).toContain("expert_scope_gate");
  });

  it("any blocked gate prevents approval", () => {
    const input: BuyerReadyApprovalInput = {
      actor_role: "reviewer",
      gate_results: [
        { gate_type: "disclosure_gate", status: "pass" },
        { gate_type: "risk_gate", status: "blocked" },
        { gate_type: "data_gate", status: "pass" },
      ],
      has_p0_violation: false,
      missing_required_patches: [],
    };
    const result = canApproveBuyerReady(input);
    expect(result.can_approve).toBe(false);
  });

  it("admin can also approve buyer-ready", () => {
    const input: BuyerReadyApprovalInput = {
      actor_role: "admin",
      gate_results: [
        { gate_type: "disclosure_gate", status: "pass" },
        { gate_type: "risk_gate", status: "pass" },
        { gate_type: "data_gate", status: "pass" },
        { gate_type: "expert_scope_gate", status: "pass" },
        { gate_type: "financial_consistency_gate", status: "pass" },
        { gate_type: "design_quality_gate", status: "pass" },
      ],
      has_p0_violation: false,
      missing_required_patches: [],
    };
    const result = canApproveBuyerReady(input);
    expect(result.can_approve).toBe(true);
  });
});

// ─── 4. buildGateOverride ─────────────────────────────────────────────

describe("buildGateOverride", () => {
  it("valid override has required fields", () => {
    const input: GateOverrideInput = {
      reviewer_id: "reviewer_001",
      gate_type: "financial_consistency_gate",
      section_id: "sec_03",
      reason: "CRE 전문가 검토 완료, 운영비 가정 서면 확인됨",
      risk_acknowledged: true,
    };
    const override = buildGateOverride(input);
    expect(override.reviewer_id).toBe("reviewer_001");
    expect(override.reason.length).toBeGreaterThan(0);
    expect(override.timestamp).toBeDefined();
    expect(override.risk_acknowledged).toBe(true);
  });

  it("override fails when reason is empty", () => {
    expect(() => buildGateOverride({
      reviewer_id: "reviewer_001",
      gate_type: "financial_consistency_gate",
      section_id: "sec_03",
      reason: "",
      risk_acknowledged: true,
    })).toThrow("reason is required");
  });

  it("P0 disclosure override is rejected (cannot override P0 disclosure)", () => {
    expect(() => buildGateOverride({
      reviewer_id: "reviewer_001",
      gate_type: "disclosure_gate",
      section_id: "sec_02",
      reason: "강제 처리",
      risk_acknowledged: true,
      is_p0_disclosure: true,
    })).toThrow("P0");
  });

  it("override without risk_acknowledged fails", () => {
    expect(() => buildGateOverride({
      reviewer_id: "reviewer_001",
      gate_type: "data_gate",
      section_id: "sec_01",
      reason: "데이터 확인 완료",
      risk_acknowledged: false,
    })).toThrow("risk_acknowledged");
  });
});
