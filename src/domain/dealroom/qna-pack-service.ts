/**
 * Deal Room Q&A Pack Service (Slice 11)
 *
 * Implements:
 *   - docs/15-ai-agent-contracts.md §16 DealRoomQAPackAgent
 *   - docs/27-export-preview-spec.md §13 Deal Room Payload
 *   - docs/14-storage-and-evidence.md §12 Evidence Index
 *
 * Rules:
 *   - Every section gets at least one question (docs/15 §16)
 *   - Protected fields (exact_address, tenant_name, unit_rent, ...) must NOT
 *     appear in question text or draft_answer (docs/15 §2 rule 5)
 *   - answer_status must be one of 4 enum values (docs/15 §16)
 *   - Evidence Index must NOT include storage_path (docs/14 §12)
 *   - Deal Room payload includes ONLY buyer_ready questions (docs/27 §13)
 *   - needs_owner_answer questions: draft_answer redacted from payload
 *   - Payload blocked unless project_status == "buyer_ready" (docs/27 §13)
 *   - AI cannot approve buyer-ready (docs/15 §2 rule 9)
 */

// ─── Constants ─────────────────────────────────────────────────────────

/** docs/15 §16 — QAPackAgentOutputSchema answer_status enum */
export const ANSWER_STATUS_VALUES = [
  "answer_ready",
  "needs_owner_answer",
  "needs_evidence",
  "expert_required",
] as const;

export type AnswerStatus = (typeof ANSWER_STATUS_VALUES)[number];

// Protected field patterns — must never appear in buyer output (docs/15 §2 rule 5)
const P0_PROTECTED_PATTERNS = [
  /[가-힣]+구\s+[가-힣]+동\s*\d+[-\d]*/,               // exact address
  /\d{1,4}-\d{1,4}\s*번지/,
  /스타벅스|CU\s|GS25|이마트|롯데마트/,                  // tenant names
  /[가-힣A-Za-z0-9]+\s*(임차인|입점)\s+[가-힣A-Za-z0-9]+/, // tenant ref
  /월세\s*\d+만\s*원|보증금\s*\d+억/,                    // unit rent
  /\d+호\s*[가-힣]*\s*\d+만\s*원/,
];

function redactProtectedContent(text: string): string {
  let safe = text;
  for (const pat of P0_PROTECTED_PATTERNS) {
    safe = safe.replace(pat, "[보호 필드 — 비공개]");
  }
  return safe;
}

// ─── Q&A Pack types ────────────────────────────────────────────────────

export interface QAPackSection {
  id: string;
  section_type: string;
  title: string;
  markdown: string;
  missing_data: string[];
  status: string;
}

export interface QAPackInput {
  project_id: string;
  sections: QAPackSection[];
  building_ssot_full: Record<string, unknown>;
}

export interface QAItem {
  section_id: string;
  section_type: string;
  question: string;
  answer_status: AnswerStatus;
  draft_answer?: string;
  required_evidence: string[];
  visibility: string;
  expert_required: boolean;
}

export interface QAPackResult {
  project_id: string;
  generated_at: string;
  questions: QAItem[];
  status: "draft"; // AI-generated packs always start as draft (docs/15 §2 rule 8)
}

// ─── Section-based question templates ─────────────────────────────────

const SECTION_QUESTIONS: Partial<Record<string, { question: string; required_evidence: string[] }>> = {
  cover_confidentiality:     { question: "본 자료의 기밀 조건과 배포 제한 사항은 무엇입니까?", required_evidence: [] },
  executive_summary:         { question: "이 자산의 핵심 투자 포인트는 무엇입니까?", required_evidence: ["lease_summary"] },
  property_fact_sheet:       { question: "건물의 주요 물리적 특성과 등기 현황은 어떻게 됩니까?", required_evidence: ["registry", "building_register"] },
  location_access:           { question: "자산의 위치 접근성과 광역 시장 환경은 어떻습니까?", required_evidence: [] },
  building_condition_physical_review: { question: "건물의 물리적 상태와 최근 수선 이력은 어떻게 됩니까?", required_evidence: ["repair_history", "floor_plan"] },
  land_use_zoning:           { question: "토지 용도 및 건축 규제 현황은 어떻게 됩니까?", required_evidence: ["land_use_plan"] },
  tenant_lease_structure:    { question: "임차인 구성과 임대차 계약 구조는 어떻게 됩니까?", required_evidence: ["lease_summary"] },
  rent_roll_lease_quality:   { question: "현재 임대 현황과 임대차 품질은 어떻게 평가됩니까?", required_evidence: ["rent_roll", "lease_summary"] },
  income_noi_yield_analysis: { question: "예상 순영업이익(NOI)과 수익률은 어느 수준입니까?", required_evidence: ["rent_roll", "lease_summary"] },
  debt_sensitivity_cash_flow:{ question: "대출 조건에 따른 현금흐름 민감도 분석 결과는 어떻습니까?", required_evidence: [] },
  valuation_logic_comparables:{ question: "유사 사례와 비교한 자산 가치 추정 논리는 무엇입니까?", required_evidence: ["market_comp", "rent_comp"] },
  value_add_repositioning:   { question: "밸류애드 또는 용도 변경 가능성이 있습니까?", required_evidence: [] },
  market_context_submarket:  { question: "해당 권역의 시장 동향과 공실률 현황은 어떻습니까?", required_evidence: ["market_comp"] },
  legal_title_encumbrances:  { question: "법적 권리 관계와 담보 현황은 어떻게 됩니까?", required_evidence: ["registry"] },
  tax_assessment_charges:    { question: "재산세 및 세금 관련 고려 사항은 무엇입니까?", required_evidence: [] },
  risk_factors_dd_checklist: { question: "주요 리스크 요인과 실사 체크리스트는 무엇입니까?", required_evidence: [] },
  transaction_structure:     { question: "거래 구조와 매각 조건은 어떻게 됩니까?", required_evidence: [] },
  disclaimer_contact:        { question: "면책 조항과 담당자 연락처는 어떻게 됩니까?", required_evidence: [] },
};

// ─── generateQAPack ───────────────────────────────────────────────────

/**
 * Generates Q&A pack from IM sections.
 * All outputs are draft (docs/15 §2 rule 8).
 * Protected fields are redacted from draft_answer (docs/15 §2 rule 5).
 */
export function generateQAPack(input: QAPackInput): QAPackResult {
  const questions: QAItem[] = [];

  for (const section of input.sections) {
    const template = SECTION_QUESTIONS[section.section_type];

    // Determine answer_status
    let answer_status: AnswerStatus = "answer_ready";
    let draft_answer: string | undefined;

    if (section.missing_data.length > 0) {
      answer_status = "needs_evidence";
    } else if (section.status === "ai_draft") {
      answer_status = "answer_ready";
    }

    // Generate draft answer from section markdown (redact protected fields)
    if (section.markdown && answer_status === "answer_ready") {
      const safe = redactProtectedContent(section.markdown);
      // Truncate to max 200 chars for Q&A context
      draft_answer = safe.length > 200 ? safe.slice(0, 197) + "…" : safe;
    }

    questions.push({
      section_id: section.id,
      section_type: section.section_type,
      question: template?.question ?? `${section.title}에 대해 설명해주세요.`,
      answer_status,
      draft_answer,
      required_evidence: template?.required_evidence ?? [],
      visibility: "buyer_ready",
      expert_required: section.status === "needs_expert_patch",
    });
  }

  return {
    project_id: input.project_id,
    generated_at: new Date().toISOString(),
    questions,
    status: "draft",
  };
}

// ─── Evidence Index types ──────────────────────────────────────────────

export interface EvidenceIndexItem {
  id: string;
  title: string;
  evidence_type: string;
  review_status: string;
  visibility: string;
  linked_sections?: string[];
  available_to_buyer: boolean;
  notes?: string;
  // storage_path intentionally OMITTED (docs/14 §12)
}

export interface EvidenceIndexInput {
  project_id: string;
  evidence: {
    id: string;
    title: string;
    evidence_type: string;
    review_status: string;
    visibility: string;
    linked_sections?: string[];
    storage_path?: string; // internal only — never included in output
    contains_sensitive_data: boolean;
  }[];
}

export interface EvidenceIndexResult {
  project_id: string;
  generated_at: string;
  items: EvidenceIndexItem[];
}

// ─── buildEvidenceIndex ────────────────────────────────────────────────

/**
 * Builds buyer-facing Evidence Index.
 * MUST NOT include storage_path (docs/14 §12).
 * private_truth evidence → available_to_buyer: false.
 */
export function buildEvidenceIndex(input: EvidenceIndexInput): EvidenceIndexResult {
  const BUYER_VISIBLE = new Set(["buyer_ready", "gate_restricted", "public_blind"]);

  const items: EvidenceIndexItem[] = input.evidence.map(ev => ({
    id: ev.id,
    title: ev.title,
    evidence_type: ev.evidence_type,
    review_status: ev.review_status,
    visibility: ev.visibility,
    linked_sections: ev.linked_sections,
    available_to_buyer: BUYER_VISIBLE.has(ev.visibility) && !ev.contains_sensitive_data,
    // storage_path intentionally omitted — docs/14 §12
  }));

  return {
    project_id: input.project_id,
    generated_at: new Date().toISOString(),
    items,
  };
}

// ─── Deal Room Payload types ───────────────────────────────────────────

export interface DealRoomPayloadItem {
  question: string;
  answer_status: AnswerStatus;
  draft_answer?: string;
  required_evidence: string[];
  visibility: string;
  expert_required: boolean;
}

export interface DealRoomEvidenceItem {
  id: string;
  title: string;
  evidence_type: string;
  review_status: string;
  visibility: string;
  available_to_buyer: boolean;
}

export interface DealRoomPayloadInput {
  project_id: string;
  project_status: string;
  qna_pack_id: string;
  questions: DealRoomPayloadItem[];
  evidence_index: DealRoomEvidenceItem[];
}

export interface DealRoomPayload {
  project_id: string;
  qna_pack_id: string;
  payload_version: string;
  generated_at: string;
  questions: DealRoomPayloadItem[];
  evidence_index: DealRoomEvidenceItem[];
  disclaimer: string;
}

const DEALROOM_DISCLAIMER =
  "본 Deal Room 패키지는 적격 매수 후보자에게만 제공되며, " +
  "투자 권유, 법률·세무·대출 자문을 포함하지 않습니다. " +
  "최종 거래 판단은 별도 실사와 전문가 검토를 통해 이루어져야 합니다.";

// ─── buildDealRoomPayload ──────────────────────────────────────────────

/**
 * Builds Deal Room payload JSON.
 * Blocked unless project_status == "buyer_ready" (docs/27 §13).
 * Filters to buyer_ready visibility questions only.
 * Redacts draft_answer for needs_owner_answer questions.
 * Excludes private_truth from evidence index.
 */
export function buildDealRoomPayload(input: DealRoomPayloadInput): DealRoomPayload {
  // Guard: only buyer_ready projects (docs/27 §13)
  if (input.project_status !== "buyer_ready") {
    throw new Error(
      `Deal Room payload는 buyer_ready 상태에서만 생성 가능합니다. ` +
      `현재 상태: ${input.project_status}`,
    );
  }

  // Filter: only buyer_ready visibility questions
  const filteredQuestions = input.questions
    .filter(q => q.visibility === "buyer_ready")
    .map(q => ({
      ...q,
      // Redact draft_answer for questions needing owner answer
      draft_answer: q.answer_status === "needs_owner_answer" ? undefined : q.draft_answer,
    }));

  // Filter: exclude private_truth from evidence index
  const filteredEvidence = input.evidence_index.filter(
    e => e.visibility !== "private_truth" && e.visibility !== "blocked",
  );

  return {
    project_id: input.project_id,
    qna_pack_id: input.qna_pack_id,
    payload_version: "1.0",
    generated_at: new Date().toISOString(),
    questions: filteredQuestions,
    evidence_index: filteredEvidence,
    disclaimer: DEALROOM_DISCLAIMER,
  };
}
