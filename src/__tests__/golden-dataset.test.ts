/**
 * Unit Tests: Golden Dataset Pipeline (Slice 12)
 *
 * Tests for:
 *   - docs/20-golden-dataset-extraction.md §5 Extraction Rules, §7 Redaction, §14 Tests
 *   - packages/contracts-docs/05-expert-patch-contracts.md §6 Edit Tags
 *   - docs/19-disclosure-guard-policy.md §3 P0 Protected Fields
 *
 * Rules:
 *   - Candidate created from AI draft + expert patch (docs/20 §3, §5)
 *   - Cannot approve with training_rights == "not_allowed" (docs/20 §5)
 *   - Cannot approve before redaction_status == "redacted" | "not_required" (docs/20 §5)
 *   - Exact address redacted (docs/20 §7)
 *   - Tenant name redacted (docs/20 §7)
 *   - Unit rent generalized (docs/20 §7)
 *   - edit_tags required (min 1) for approval (docs/20 §6)
 *   - Protected fields cannot remain in approved candidate (docs/20 §5)
 *   - Rejected candidate is marked rejected (docs/20 §14)
 *   - Events emitted for create/redact/approve/reject (docs/20 §13)
 */
import { describe, it, expect } from "vitest";
import {
  createGoldenCandidate,
  redactCandidate,
  approveCandidate,
  rejectCandidate,
  buildGoldenCandidateEvent,
  type GoldenCandidateCreateInput,
  type GoldenCandidateRecord,
} from "@/domain/golden/golden-dataset-service";

// ─── Fixtures ──────────────────────────────────────────────────────────

const VALID_INPUT: GoldenCandidateCreateInput = {
  project_id: "proj_001",
  section_id: "sec_03",
  expert_patch_id: "patch_001",
  section_type: "income_noi_yield_analysis",
  ai_draft: "NOI는 약 X억원으로 추정되며 수익률이 보장됩니다.",
  expert_revision: "NOI는 가정 기반으로 약 X억원 수준으로 추정됩니다. 수익률은 시장 상황에 따라 달라질 수 있습니다.",
  edit_tags: ["overclaim_removed", "risk_balance_added"],
  issue_categories: ["overclaim", "risk_balance"],
  training_rights: "allowed_anonymized",
};

const PROTECTED_INPUT: GoldenCandidateCreateInput = {
  ...VALID_INPUT,
  ai_draft: "서울 성동구 성수동2가 123-45번지 스타벅스 임차인, 301호 월세 450만원",
  expert_revision: "성수권역 1층 F&B 임차인, 상층부 개별 호실 임대료 수준",
};

// Helper to make a candidate record
function makeCandidate(overrides: Partial<GoldenCandidateRecord> = {}): GoldenCandidateRecord {
  return {
    id: "cand_001",
    project_id: "proj_001",
    section_id: "sec_03",
    expert_patch_id: "patch_001",
    section_type: "income_noi_yield_analysis",
    ai_draft: "NOI는 수익률이 보장됩니다.",
    expert_revision: "NOI는 가정 기반 추정입니다.",
    edit_tags: ["overclaim_removed"],
    issue_categories: ["overclaim"],
    training_rights: "allowed_anonymized",
    redaction_status: "redacted",
    review_status: "review_pending",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ─── 1. createGoldenCandidate ─────────────────────────────────────────

describe("createGoldenCandidate", () => {
  it("creates candidate with status candidate", () => {
    const result = createGoldenCandidate(VALID_INPUT);
    expect(result.review_status).toBe("candidate");
  });

  it("creates candidate with redaction_status pending", () => {
    const result = createGoldenCandidate(VALID_INPUT);
    expect(result.redaction_status).toBe("pending");
  });

  it("candidate has project_id, section_id, expert_patch_id", () => {
    const result = createGoldenCandidate(VALID_INPUT);
    expect(result.project_id).toBe("proj_001");
    expect(result.section_id).toBe("sec_03");
    expect(result.expert_patch_id).toBe("patch_001");
  });

  it("candidate has ai_draft and expert_revision", () => {
    const result = createGoldenCandidate(VALID_INPUT);
    expect(result.ai_draft).toBeTruthy();
    expect(result.expert_revision).toBeTruthy();
  });

  it("candidate has edit_tags from input", () => {
    const result = createGoldenCandidate(VALID_INPUT);
    expect(result.edit_tags).toContain("overclaim_removed");
  });

  it("fails when ai_draft is empty", () => {
    expect(() => createGoldenCandidate({ ...VALID_INPUT, ai_draft: "" }))
      .toThrow("ai_draft");
  });

  it("fails when edit_tags is empty", () => {
    expect(() => createGoldenCandidate({ ...VALID_INPUT, edit_tags: [] }))
      .toThrow("edit_tags");
  });

  it("training_rights defaults to not_allowed when omitted", () => {
    const input = { ...VALID_INPUT };
    delete (input as Partial<GoldenCandidateCreateInput>).training_rights;
    const result = createGoldenCandidate(input);
    expect(result.training_rights).toBe("not_allowed");
  });
});

// ─── 2. redactCandidate ───────────────────────────────────────────────

describe("redactCandidate: exact address", () => {
  it("redacts exact address from ai_draft", () => {
    const candidate = makeCandidate({
      ai_draft: "서울 성동구 성수동2가 123-45번지에 위치한 자산입니다.",
      redaction_status: "pending",
    });
    const result = redactCandidate(candidate);
    expect(result.ai_draft_redacted).not.toContain("123-45번지");
    expect(result.ai_draft_redacted).not.toContain("성수동2가");
  });

  it("replaces exact address with area_signal", () => {
    const candidate = makeCandidate({
      ai_draft: "성동구 성수동2가 123-45번지 소재입니다.",
      redaction_status: "pending",
    });
    const result = redactCandidate(candidate);
    expect(result.ai_draft_redacted).toContain("[권역]");
  });
});

describe("redactCandidate: tenant name", () => {
  it("redacts tenant name", () => {
    const candidate = makeCandidate({
      ai_draft: "스타벅스가 1층에 입점해 있습니다.",
      redaction_status: "pending",
    });
    const result = redactCandidate(candidate);
    expect(result.ai_draft_redacted).not.toContain("스타벅스");
  });

  it("replaces tenant name with generic role", () => {
    const candidate = makeCandidate({
      ai_draft: "1층 스타벅스 매장이 입점 중입니다.",
      redaction_status: "pending",
    });
    const result = redactCandidate(candidate);
    expect(result.ai_draft_redacted).toContain("[F&B 임차인]");
  });
});

describe("redactCandidate: unit rent", () => {
  it("redacts unit rent from ai_draft", () => {
    const candidate = makeCandidate({
      ai_draft: "301호 월세 450만원 조건으로 임대 중입니다.",
      redaction_status: "pending",
    });
    const result = redactCandidate(candidate);
    expect(result.ai_draft_redacted).not.toContain("450만원");
    expect(result.ai_draft_redacted).not.toContain("301호");
  });

  it("sets redaction_status to redacted", () => {
    const candidate = makeCandidate({ redaction_status: "pending" });
    const result = redactCandidate(candidate);
    expect(result.redaction_status).toBe("redacted");
  });

  it("adds tenant_detail_redacted and unit_rent_redacted to edit_tags if redacted", () => {
    const candidate = makeCandidate({
      ai_draft: "스타벅스 월세 300만원",
      edit_tags: ["overclaim_removed"],
      redaction_status: "pending",
    });
    const result = redactCandidate(candidate);
    expect(result.edit_tags).toContain("tenant_detail_redacted");
    expect(result.edit_tags).toContain("unit_rent_redacted");
  });
});

// ─── 3. approveCandidate ──────────────────────────────────────────────

describe("approveCandidate", () => {
  it("succeeds when all conditions met", () => {
    const candidate = makeCandidate({ training_rights: "allowed_anonymized", redaction_status: "redacted" });
    const result = approveCandidate(candidate, "reviewer_001");
    expect(result.review_status).toBe("approved");
    expect(result.reviewed_at).toBeTruthy();
  });

  it("fails when training_rights is not_allowed", () => {
    const candidate = makeCandidate({ training_rights: "not_allowed", redaction_status: "redacted" });
    expect(() => approveCandidate(candidate, "reviewer_001")).toThrow("training_rights");
  });

  it("fails when redaction_status is pending", () => {
    const candidate = makeCandidate({ training_rights: "allowed_anonymized", redaction_status: "pending" });
    expect(() => approveCandidate(candidate, "reviewer_001")).toThrow("redaction");
  });

  it("fails when redaction_status is failed", () => {
    const candidate = makeCandidate({ training_rights: "allowed_anonymized", redaction_status: "failed" });
    expect(() => approveCandidate(candidate, "reviewer_001")).toThrow("redaction");
  });

  it("fails when edit_tags is empty", () => {
    const candidate = makeCandidate({ training_rights: "allowed_anonymized", redaction_status: "redacted", edit_tags: [] });
    expect(() => approveCandidate(candidate, "reviewer_001")).toThrow("edit_tags");
  });

  it("passes with redaction_status not_required", () => {
    const candidate = makeCandidate({ training_rights: "allowed_internal_eval_only", redaction_status: "not_required" });
    const result = approveCandidate(candidate, "reviewer_001");
    expect(result.review_status).toBe("approved");
  });
});

// ─── 4. rejectCandidate ───────────────────────────────────────────────

describe("rejectCandidate", () => {
  it("sets review_status to rejected", () => {
    const candidate = makeCandidate();
    const result = rejectCandidate(candidate, "reviewer_001", "품질 부족");
    expect(result.review_status).toBe("rejected");
  });

  it("rejected candidate has reviewed_at", () => {
    const candidate = makeCandidate();
    const result = rejectCandidate(candidate, "reviewer_001", "테스트 기준 미충족");
    expect(result.reviewed_at).toBeTruthy();
  });
});

// ─── 5. buildGoldenCandidateEvent ────────────────────────────────────

describe("buildGoldenCandidateEvent", () => {
  it("builds golden_candidate_created event", () => {
    const evt = buildGoldenCandidateEvent({ event_type: "golden_candidate_created", candidate_id: "cand_001", project_id: "proj_001", section_type: "income_noi_yield_analysis", training_rights: "allowed_anonymized" });
    expect(evt.event_type).toBe("golden_candidate_created");
    expect(evt.entity_id).toBe("cand_001");
  });

  it("event metadata does NOT include ai_draft or expert_revision content", () => {
    const evt = buildGoldenCandidateEvent({ event_type: "golden_candidate_approved", candidate_id: "cand_001", project_id: "proj_001", section_type: "income_noi_yield_analysis", training_rights: "allowed_anonymized" });
    expect(evt.metadata).not.toHaveProperty("ai_draft");
    expect(evt.metadata).not.toHaveProperty("expert_revision");
  });

  it("event metadata includes training_rights", () => {
    const evt = buildGoldenCandidateEvent({ event_type: "golden_candidate_approved", candidate_id: "cand_001", project_id: "proj_001", section_type: "income_noi_yield_analysis", training_rights: "allowed_golden_dataset" });
    expect(evt.metadata.training_rights).toBe("allowed_golden_dataset");
  });
});
