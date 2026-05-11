/**
 * Draft Guardrails — RiskBoundary + DisclosureGuard + helpers
 *
 * Pure domain services. No I/O.
 *
 * Implements:
 *   - docs/15-ai-agent-contracts.md §11 RiskBoundaryAgent, §12 DisclosureGuardAgent
 *   - docs/18-risk-boundary-policy.md §4 Forbidden patterns, §5 Safe rewrites
 *   - docs/19-disclosure-guard-policy.md §9 P0 failures, §3 Protected fields
 *   - docs/17-financial-analysis-guardrails.md §5 NOI, §7 Debt guardrails
 */

// ─── RiskBoundary Types ───────────────────────────────────────────────

export type RiskSeverity = "low" | "medium" | "high" | "p0";
export type RiskStatus = "pass" | "revise" | "blocked";

export interface RiskIssue {
  issue_type: string;
  severity: RiskSeverity;
  original_text?: string;
  recommended_text?: string;
  message: string;
}

export interface RiskBoundaryResult {
  status: RiskStatus;
  issues: RiskIssue[];
  safe_text?: string;
}

// ─── DisclosureGuard Types ────────────────────────────────────────────

export type DisclosureStatus = "pass" | "redacted" | "blocked";
export type GateLevel = "G0" | "G1" | "G2" | "G3" | "G4" | "G5";

export interface DisclosureGuardInput {
  text: string;
  target_visibility: string;
  gate_level?: GateLevel;
  protected_fields_available: string[];
  output_type: "blind_teaser" | "external_snapshot" | "im_lite" | "full_im" | "qna_pack" | "evidence_index" | "dealroom_payload";
}

export interface DisclosureViolation {
  field: string;
  severity: RiskSeverity;
  message: string;
  recommended_action: string;
}

export interface DisclosureGuardResult {
  status: DisclosureStatus;
  safe_text: string;
  redacted_fields: string[];
  violations: DisclosureViolation[];
}

// ─── AiRunRecord Types ────────────────────────────────────────────────

export interface AiRunRecord {
  project_id: string;
  section_id?: string;
  run_type: string;
  prompt_version: string;
  model: string;
  status: "started" | "completed" | "failed";
  latency_ms: number;
  error?: string;
  input_ref: Record<string, unknown>;
  output_ref: Record<string, unknown>;
  created_at: string;
}

// ─── BuildDraftOutput types ───────────────────────────────────────────

export interface DraftOutputInput {
  section_type: string;
  title: string;
  markdown: string;
  source_refs: Record<string, unknown>[];
  evidence_refs: Record<string, unknown>[];
  missing_data: string[];
  requires_expert_patch: boolean;
  confidence: "confirmed" | "inferred" | "needs_evidence" | "expert_required" | "unknown";
  risk_level: "low" | "medium" | "high" | "blocked";
}

// ─── Forbidden pattern table (docs/18 §4) ────────────────────────────

interface ForbiddenPattern {
  pattern: RegExp;
  issue_type: string;
  severity: RiskSeverity;
  message: string;
  recommended_text: string;
}

const FORBIDDEN_PATTERNS: ForbiddenPattern[] = [
  // P0 Investment recommendation
  {
    pattern: /매수\s*(를)?\s*추천|투자\s*가치가\s*높|안전한\s*투자처|우량\s*매물|확실한\s*투자|강력히\s*추천/,
    issue_type: "investment_recommendation",
    severity: "p0",
    message: "투자 추천 또는 확정적 투자 가치 표현은 허용되지 않습니다.",
    recommended_text: "투자 적합 여부는 별도 실사와 전문가 검토를 통해 판단해야 합니다.",
  },
  // P0 Financial certainty
  {
    pattern: /수익률\s*(이|이|은|가)?\s*보장|NOI\s*(가|이)?\s*확정|현금흐름\s*(이|을)?\s*보장|Cap\s*Rate\s*(가|이)?\s*안정/,
    issue_type: "financial_certainty",
    severity: "p0",
    message: "수익률/NOI/현금흐름 보장 표현은 허용되지 않습니다.",
    recommended_text: "수익률은 가정과 실사 결과에 따라 달라질 수 있습니다.",
  },
  // P0 Loan certainty
  {
    pattern: /대출\s*(이|이)?\s*가능합니다|LTV\s*\d+%\s*가능|금리\s*(가|이)?\s*확정|DSCR\s*(이|가)?\s*충분|대출\s*승인/,
    issue_type: "loan_certainty",
    severity: "p0",
    message: "대출 가능 확정 표현은 허용되지 않습니다.",
    recommended_text: "대출 가능성과 조건은 금융기관 심사, 담보평가, 차주 신용도, 시장금리에 따라 달라질 수 있습니다.",
  },
  // P0 Legal certainty
  {
    pattern: /법적\s*문제\s*(없음|없습니다)|위반건축물\s*문제\s*없/,
    issue_type: "legal_certainty",
    severity: "p0",
    message: "법적 문제 없음 확정 표현은 허용되지 않습니다.",
    recommended_text: "법적 사항은 별도 법률 전문가 검토가 필요합니다.",
  },
  // High: Valuation certainty
  {
    pattern: /적정\s*가격|저평가|시장가보다\s*저렴|가격\s*상승\s*확실/,
    issue_type: "valuation_certainty",
    severity: "high",
    message: "가치평가 확정 표현은 허용되지 않습니다.",
    recommended_text: "주변 사례와 보정 기준을 함께 검토해야 합니다.",
  },
  // High: Value-add certainty
  {
    pattern: /리모델링하면\s*임대료\s*상승|공실\s*쉽게\s*해소|MD\s*개선으로\s*가치\s*상승/,
    issue_type: "value_add_certainty",
    severity: "high",
    message: "가치상승 확정 표현은 허용되지 않습니다.",
    recommended_text: "리모델링 및 가치상승 가능성은 공사비, 공실기간, 주변 임대사례 확인이 필요합니다.",
  },
  // High: Tax certainty
  {
    pattern: /세금상\s*유리|절세\s*가능|세금\s*(이)?\s*없/,
    issue_type: "tax_certainty",
    severity: "high",
    message: "세무상 확정 표현은 허용되지 않습니다.",
    recommended_text: "세무 사항은 전문 세무사 검토가 필요합니다.",
  },
  // High: Permit certainty
  {
    pattern: /용도변경\s*가능|증축\s*가능/,
    issue_type: "permit_certainty",
    severity: "high",
    message: "허가 가능 확정 표현은 허용되지 않습니다.",
    recommended_text: "용도변경 및 증축 가능 여부는 관할 관청 확인이 필요합니다.",
  },
];

// ─── runRiskBoundaryCheck ─────────────────────────────────────────────

export function runRiskBoundaryCheck(
  text: string,
  sectionType: string,
): RiskBoundaryResult {
  const issues: RiskIssue[] = [];

  for (const fp of FORBIDDEN_PATTERNS) {
    const match = text.match(fp.pattern);
    if (match) {
      issues.push({
        issue_type: fp.issue_type,
        severity: fp.severity,
        original_text: match[0],
        recommended_text: fp.recommended_text,
        message: fp.message,
      });
    }
  }

  const hasP0 = issues.some((i) => i.severity === "p0");
  const hasHigh = issues.some((i) => i.severity === "high");

  const status: RiskStatus = hasP0 ? "blocked" : hasHigh ? "revise" : "pass";

  // Build safe_text by replacing matched patterns with recommendations
  let safeText = text;
  for (const fp of FORBIDDEN_PATTERNS) {
    if (fp.pattern.test(safeText)) {
      safeText = safeText.replace(fp.pattern, fp.recommended_text);
    }
  }

  return { status, issues, safe_text: safeText };
}

// ─── Protected field detectors (docs/19 §3) ──────────────────────────

interface ProtectedFieldDetector {
  field: string;
  patterns: RegExp[];
  publicBlocked: boolean; // always blocked in public/blind
  replacement: string;
}

const PROTECTED_FIELD_DETECTORS: ProtectedFieldDetector[] = [
  {
    field: "exact_address",
    // Korean address patterns: 구/동/번지
    patterns: [
      /[가-힣]+구\s+[가-힣]+동\s*\d+[-\d]*/,
      /[가-힣]+시\s+[가-힣]+구\s+[가-힣]+동/,
    ],
    publicBlocked: true,
    replacement: "[지역 신호로 대체됨]",
  },
  {
    field: "tenant_name",
    // Common tenant name patterns: company + 임차인/입점
    patterns: [
      /[가-힣A-Za-z0-9]+\s*(임차인|입점|세입자)/,
      /스타벅스|CU|GS25|이마트|롯데마트/,
    ],
    publicBlocked: true,
    replacement: "[임차인 업종 정보로 대체됨]",
  },
  {
    field: "unit_rent",
    // 월세/보증금 + 숫자
    patterns: [
      /월세\s*\d+만\s*원/,
      /보증금\s*\d+억/,
      /\d+호\s*[가-힣]*\s*\d+만\s*원/,
    ],
    publicBlocked: true,
    replacement: "[임대수익 존재, 상세 내용 비공개]",
  },
  {
    field: "seller_motivation",
    patterns: [/상속\s*문제로|급매|이혼\s*매물|자금\s*압박/],
    publicBlocked: true,
    replacement: "[매도자 사정 비공개]",
  },
  {
    field: "negotiation_memo",
    patterns: [/\d+억까지\s*가능|협상가|네고\s*가능/],
    publicBlocked: true,
    replacement: "[내부 협상 메모 비공개]",
  },
];

// ─── runDisclosureGuard ───────────────────────────────────────────────

export function runDisclosureGuard(input: DisclosureGuardInput): DisclosureGuardResult {
  const { text, target_visibility, gate_level, protected_fields_available, output_type } = input;

  const isPublicOutput =
    target_visibility === "public" ||
    target_visibility === "public_blind" ||
    output_type === "blind_teaser" ||
    output_type === "external_snapshot";

  const gateNum = gate_level ? parseInt(gate_level.replace("G", ""), 10) : 0;

  const violations: DisclosureViolation[] = [];
  const redactedFields: string[] = [];
  let safeText = text;

  for (const detector of PROTECTED_FIELD_DETECTORS) {
    // Only check if field is in protected list OR always-check for public outputs
    const isRelevant =
      protected_fields_available.includes(detector.field) || isPublicOutput;

    if (!isRelevant) continue;

    for (const pattern of detector.patterns) {
      if (pattern.test(text)) {
        // Determine if blocked based on gate level
        const isBlocked = detector.publicBlocked && (isPublicOutput || gateNum < 4);

        violations.push({
          field: detector.field,
          severity: isBlocked ? "p0" : "high",
          message: `보호 필드 '${detector.field}'가 ${target_visibility} 출력에 포함되었습니다.`,
          recommended_action: `해당 정보를 제거하거나 일반적인 표현으로 대체하세요.`,
        });

        if (!redactedFields.includes(detector.field)) {
          redactedFields.push(detector.field);
        }

        // Redact in safe_text
        safeText = safeText.replace(pattern, detector.replacement);
        break;
      }
    }
  }

  const hasP0 = violations.some((v) => v.severity === "p0");
  const status: DisclosureStatus = hasP0 ? "blocked" : redactedFields.length > 0 ? "redacted" : "pass";

  return { status, safe_text: safeText, redacted_fields: redactedFields, violations };
}

// ─── buildDraftOutput ─────────────────────────────────────────────────

/** Docs/18 §8 standard boundary note — required in all outputs */
const STANDARD_BOUNDARY_NOTE =
  "본 자료는 제공자료와 공개정보를 바탕으로 한 예비 검토 자료이며, 투자 권유, 감정평가, " +
  "법률·세무·대출 가능성 판단을 목적으로 하지 않습니다. " +
  "실제 거래 여부는 별도 실사와 전문가 검토를 통해 판단해야 합니다.";

export function buildDraftOutput(input: DraftOutputInput) {
  return {
    section_type: input.section_type,
    title: input.title,
    markdown: input.markdown,
    content_json: {},
    confidence: input.confidence,
    risk_level: input.risk_level,
    source_refs: input.source_refs,
    evidence_refs: input.evidence_refs,
    missing_data: input.missing_data,
    requires_expert_patch: input.requires_expert_patch,
    boundary_note: STANDARD_BOUNDARY_NOTE,
    // AI draft status is ALWAYS "ai_draft" — docs/15 §2 rule 9
    status: "ai_draft" as const,
  };
}

// ─── createAiRunRecord ────────────────────────────────────────────────

export function createAiRunRecord(input: {
  project_id: string;
  section_id?: string;
  run_type: string;
  prompt_version: string;
  model: string;
  status: "started" | "completed" | "failed";
  latency_ms: number;
  error?: string;
  input_summary?: Record<string, unknown>;
  output_summary?: Record<string, unknown>;
}): AiRunRecord {
  return {
    project_id: input.project_id,
    section_id: input.section_id,
    run_type: input.run_type,
    prompt_version: input.prompt_version,
    model: input.model,
    status: input.status,
    latency_ms: input.latency_ms,
    error: input.error,
    // input_ref and output_ref store non-PII summaries for audit (docs/15 §2 rule 7)
    input_ref: input.input_summary ?? { section_type: "unknown", source_refs_count: 0 },
    output_ref: input.output_summary ?? { status: input.status, has_output: input.status === "completed" },
    created_at: new Date().toISOString(),
  };
}
