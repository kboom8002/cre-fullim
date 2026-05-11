/**
 * Unit Tests: Deal Room Q&A Pack (Slice 11)
 *
 * Tests for:
 *   - docs/15-ai-agent-contracts.md §16 DealRoomQAPackAgent
 *   - docs/27-export-preview-spec.md §13 Deal Room Payload
 *   - docs/14-storage-and-evidence.md §12 Evidence Index
 *
 * Rules:
 *   - Q&A pack has at least one question per section (docs/15 §16)
 *   - each question has answer_status (docs/15 §16)
 *   - required_evidence is listed per question (docs/15 §16)
 *   - protected fields are NOT exposed in Q&A output (docs/15 §2 rule 5)
 *   - dealroom payload respects visibility (buyer_ready only) (docs/27 §13)
 *   - Evidence Index must NOT include private storage paths (docs/14 §12)
 *   - answer_status must be one of the allowed enum values (docs/15 §16)
 *   - AI cannot set buyer_ready status (docs/15 §2 rule 9)
 */
import { describe, it, expect } from "vitest";
import {
  generateQAPack,
  buildEvidenceIndex,
  buildDealRoomPayload,
  ANSWER_STATUS_VALUES,
  type QAPackInput,
  type EvidenceIndexInput,
  type DealRoomPayloadInput,
} from "@/domain/dealroom/qna-pack-service";

// ─── Fixtures ──────────────────────────────────────────────────────────

const QA_INPUT: QAPackInput = {
  project_id: "proj_001",
  sections: [
    {
      id: "sec_01",
      section_type: "executive_summary",
      title: "Executive Summary",
      markdown: "이 자산은 서울 성수권역에 위치한 복합 상업용 부동산입니다.",
      missing_data: [],
      status: "patched",
    },
    {
      id: "sec_02",
      section_type: "income_noi_yield_analysis",
      title: "수익 및 NOI 분석",
      markdown: "예상 NOI는 가정에 따라 달라질 수 있습니다.",
      missing_data: ["운영비 가정"],
      status: "patched",
    },
    {
      id: "sec_03",
      section_type: "debt_sensitivity_cash_flow",
      title: "부채 민감도 및 현금흐름",
      markdown: "대출 조건은 시장 상황에 따라 변동됩니다.",
      missing_data: [],
      status: "ai_draft",
    },
  ],
  building_ssot_full: {
    disclosure_gate: {
      protected_fields: ["exact_address", "tenant_name", "unit_rent"],
    },
  },
};

const EVIDENCE_INPUT: EvidenceIndexInput = {
  project_id: "proj_001",
  evidence: [
    {
      id: "ev_01",
      title: "임대차 현황표",
      evidence_type: "lease_summary",
      review_status: "reviewed",
      visibility: "buyer_ready",
      linked_sections: ["sec_01", "sec_02"],
      storage_path: "full-im-evidence-private/proj_001/lease_summary.pdf",
      contains_sensitive_data: false,
    },
    {
      id: "ev_02",
      title: "건물 등기부등본",
      evidence_type: "registry",
      review_status: "reviewed",
      visibility: "gate_restricted",
      linked_sections: ["sec_01"],
      storage_path: "full-im-evidence-private/proj_001/registry.pdf",
      contains_sensitive_data: false,
    },
    {
      id: "ev_03",
      title: "임대차 계약서 원본",
      evidence_type: "full_lease_contract",
      review_status: "needs_redaction",
      visibility: "private_truth",
      linked_sections: ["sec_02"],
      storage_path: "full-im-evidence-private/proj_001/lease_contract.pdf",
      contains_sensitive_data: true,
    },
  ],
};

const DEALROOM_INPUT: DealRoomPayloadInput = {
  project_id: "proj_001",
  project_status: "buyer_ready",
  qna_pack_id: "qna_001",
  questions: [
    {
      question: "현재 임대수익은 얼마입니까?",
      answer_status: "answer_ready",
      draft_answer: "연 임대수익은 약 X억원 수준으로 추정됩니다.",
      required_evidence: ["lease_summary"],
      visibility: "buyer_ready",
      expert_required: false,
    },
  ],
  evidence_index: [
    {
      id: "ev_01",
      title: "임대차 현황표",
      evidence_type: "lease_summary",
      review_status: "reviewed",
      visibility: "buyer_ready",
      available_to_buyer: true,
    },
  ],
};

// ─── 1. generateQAPack ────────────────────────────────────────────────

describe("generateQAPack: basic structure", () => {
  it("returns questions array", () => {
    const pack = generateQAPack(QA_INPUT);
    expect(Array.isArray(pack.questions)).toBe(true);
  });

  it("has at least one question per section", () => {
    const pack = generateQAPack(QA_INPUT);
    expect(pack.questions.length).toBeGreaterThanOrEqual(QA_INPUT.sections.length);
  });

  it("each question has answer_status field", () => {
    const pack = generateQAPack(QA_INPUT);
    for (const q of pack.questions) {
      expect(q).toHaveProperty("answer_status");
    }
  });

  it("answer_status is one of allowed values", () => {
    const pack = generateQAPack(QA_INPUT);
    for (const q of pack.questions) {
      expect(ANSWER_STATUS_VALUES).toContain(q.answer_status);
    }
  });

  it("each question has required_evidence list", () => {
    const pack = generateQAPack(QA_INPUT);
    for (const q of pack.questions) {
      expect(Array.isArray(q.required_evidence)).toBe(true);
    }
  });

  it("each question has visibility field", () => {
    const pack = generateQAPack(QA_INPUT);
    for (const q of pack.questions) {
      expect(q).toHaveProperty("visibility");
    }
  });

  it("pack has project_id and generated_at", () => {
    const pack = generateQAPack(QA_INPUT);
    expect(pack.project_id).toBe("proj_001");
    expect(pack.generated_at).toBeTruthy();
  });
});

describe("generateQAPack: protected fields not exposed", () => {
  const PROTECTED_QA_INPUT: QAPackInput = {
    ...QA_INPUT,
    sections: [
      {
        id: "sec_poison",
        section_type: "executive_summary",
        title: "요약",
        markdown: "서울 성동구 성수동2가 123-45번지에 위치합니다. 임차인 스타벅스, 월세 300만원.",
        missing_data: [],
        status: "ai_draft",
      },
    ],
  };

  it("protected field values are not in question text", () => {
    const pack = generateQAPack(PROTECTED_QA_INPUT);
    const allText = pack.questions.map(q => q.question + (q.draft_answer ?? "")).join(" ");
    // draft_answer should NOT expose exact address / tenant name / unit rent
    expect(allText).not.toContain("스타벅스");
    expect(allText).not.toContain("123-45번지");
    expect(allText).not.toContain("300만원");
  });

  it("missing_data question sets answer_status to needs_evidence", () => {
    const pack = generateQAPack(QA_INPUT);
    const noi = pack.questions.find(q => q.section_type === "income_noi_yield_analysis");
    if (noi) {
      expect(noi.answer_status).toBe("needs_evidence");
    }
  });
});

// ─── 2. buildEvidenceIndex ────────────────────────────────────────────

describe("buildEvidenceIndex", () => {
  it("returns evidence array", () => {
    const idx = buildEvidenceIndex(EVIDENCE_INPUT);
    expect(Array.isArray(idx.items)).toBe(true);
  });

  it("does NOT include private storage paths (docs/14 §12)", () => {
    const idx = buildEvidenceIndex(EVIDENCE_INPUT);
    for (const item of idx.items) {
      expect(item).not.toHaveProperty("storage_path");
    }
  });

  it("private_truth evidence is NOT available_to_buyer", () => {
    const idx = buildEvidenceIndex(EVIDENCE_INPUT);
    const privateItem = idx.items.find(i => i.id === "ev_03");
    expect(privateItem?.available_to_buyer).toBe(false);
  });

  it("buyer_ready evidence IS available_to_buyer", () => {
    const idx = buildEvidenceIndex(EVIDENCE_INPUT);
    const buyerItem = idx.items.find(i => i.id === "ev_01");
    expect(buyerItem?.available_to_buyer).toBe(true);
  });

  it("each item has required fields", () => {
    const idx = buildEvidenceIndex(EVIDENCE_INPUT);
    for (const item of idx.items) {
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("evidence_type");
      expect(item).toHaveProperty("review_status");
      expect(item).toHaveProperty("visibility");
      expect(item).toHaveProperty("available_to_buyer");
    }
  });

  it("index has project_id", () => {
    const idx = buildEvidenceIndex(EVIDENCE_INPUT);
    expect(idx.project_id).toBe("proj_001");
  });
});

// ─── 3. buildDealRoomPayload ──────────────────────────────────────────

describe("buildDealRoomPayload", () => {
  it("payload has project_id", () => {
    const payload = buildDealRoomPayload(DEALROOM_INPUT);
    expect(payload.project_id).toBe("proj_001");
  });

  it("payload respects buyer_ready visibility — only buyer_ready questions included", () => {
    const inputWithMixed: DealRoomPayloadInput = {
      ...DEALROOM_INPUT,
      questions: [
        { ...DEALROOM_INPUT.questions[0], visibility: "buyer_ready" },
        { ...DEALROOM_INPUT.questions[0], question: "내부 메모", visibility: "internal_only" },
      ],
    };
    const payload = buildDealRoomPayload(inputWithMixed);
    expect(payload.questions.every(q => q.visibility === "buyer_ready")).toBe(true);
  });

  it("payload does NOT include draft_answer for needs_owner_answer questions", () => {
    const input: DealRoomPayloadInput = {
      ...DEALROOM_INPUT,
      questions: [{
        question: "매도 사유는 무엇입니까?",
        answer_status: "needs_owner_answer",
        draft_answer: "매도자 개인 사정으로 인한 처분입니다.",
        required_evidence: [],
        visibility: "buyer_ready",
        expert_required: false,
      }],
    };
    const payload = buildDealRoomPayload(input);
    const q = payload.questions[0];
    // needs_owner_answer: draft_answer should be redacted/omitted from payload
    expect(q.draft_answer).toBeUndefined();
  });

  it("payload has generated_at and payload_version", () => {
    const payload = buildDealRoomPayload(DEALROOM_INPUT);
    expect(payload.generated_at).toBeTruthy();
    expect(payload.payload_version).toBeTruthy();
  });

  it("payload is blocked when project_status is not buyer_ready", () => {
    const input: DealRoomPayloadInput = { ...DEALROOM_INPUT, project_status: "ai_draft" };
    expect(() => buildDealRoomPayload(input)).toThrow("buyer_ready");
  });

  it("evidence index in payload excludes private_truth items", () => {
    const inputWithPrivate: DealRoomPayloadInput = {
      ...DEALROOM_INPUT,
      evidence_index: [
        ...DEALROOM_INPUT.evidence_index,
        { id: "ev_private", title: "임대차계약서", evidence_type: "full_lease_contract", review_status: "needs_redaction", visibility: "private_truth", available_to_buyer: false },
      ],
    };
    const payload = buildDealRoomPayload(inputWithPrivate);
    const hasPrivate = payload.evidence_index.some(e => e.visibility === "private_truth");
    expect(hasPrivate).toBe(false);
  });
});

// ─── 4. ANSWER_STATUS_VALUES constant ────────────────────────────────

describe("ANSWER_STATUS_VALUES", () => {
  it("has 4 values matching docs/15 §16", () => {
    expect(ANSWER_STATUS_VALUES).toHaveLength(4);
  });

  it("contains answer_ready", () => {
    expect(ANSWER_STATUS_VALUES).toContain("answer_ready");
  });

  it("contains needs_owner_answer", () => {
    expect(ANSWER_STATUS_VALUES).toContain("needs_owner_answer");
  });
});
