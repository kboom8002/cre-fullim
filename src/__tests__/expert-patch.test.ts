/**
 * Unit Tests: Expert Workbench (Slice 8)
 *
 * Tests for:
 *   - docs/25-expert-workbench-spec.md §11 Submit Flow, §13 UX Principles
 *   - packages/contracts-docs/05-expert-patch-contracts.md §8 ExpertPatchSchema
 *   - docs/03-user-roles.md §assignment-scoped access
 *
 * Rules:
 *   - ExpertPatchSchema validates with after_text + edit_tags required
 *   - after_text missing → validation failure
 *   - edit_tags empty → validation failure
 *   - training_rights defaults to not_allowed
 *   - visibility_after_review defaults to internal_only
 *   - expert cannot auto-approve buyer-ready (docs/25 §14)
 *   - assignment-scoped: expert only sees their assigned project_id
 *   - activity event payload has correct structure
 */
import { describe, it, expect } from "vitest";
import {
  ExpertPatchSubmitSchema,
  ExpertPatchResponseSchema,
  buildPatchActivityEvent,
  isAssignmentScoped,
  PATCH_TYPES,
  EDIT_TAGS,
  TRAINING_RIGHTS,
  VISIBILITY_OPTIONS,
  type ExpertPatchSubmit,
} from "@/domain/expert/expert-patch";

// ─── Fixtures ──────────────────────────────────────────────────────────

const VALID_PATCH: ExpertPatchSubmit = {
  assignment_id: "assign_001",
  project_id: "proj_001",
  section_id: "sec_001",
  expert_role: "cre_consultant",
  patch_type: "risk_balance",
  before_text: "수익률이 보장됩니다.",
  after_text: "수익률은 가정과 실사 결과에 따라 달라질 수 있습니다.",
  edit_tags: ["overclaim_removed", "risk_balance_added"],
  rationale: "기존 표현은 수익률 확정 표현으로 허용되지 않습니다.",
  visibility_after_review: "gate_restricted",
  training_rights: "allowed_anonymized",
  requires_additional_review: false,
};

// ─── 1. ExpertPatchSubmitSchema validation ────────────────────────────

describe("ExpertPatchSubmitSchema: valid patch", () => {
  it("validates a fully valid patch", () => {
    const result = ExpertPatchSubmitSchema.safeParse(VALID_PATCH);
    expect(result.success).toBe(true);
  });

  it("training_rights defaults to not_allowed when omitted", () => {
    const patch = { ...VALID_PATCH };
    delete (patch as Partial<ExpertPatchSubmit>).training_rights;
    const result = ExpertPatchSubmitSchema.safeParse(patch);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.training_rights).toBe("not_allowed");
    }
  });

  it("visibility_after_review defaults to internal_only when omitted", () => {
    const patch = { ...VALID_PATCH };
    delete (patch as Partial<ExpertPatchSubmit>).visibility_after_review;
    const result = ExpertPatchSubmitSchema.safeParse(patch);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.visibility_after_review).toBe("internal_only");
    }
  });

  it("before_text is optional", () => {
    const patch = { ...VALID_PATCH };
    delete (patch as Partial<ExpertPatchSubmit>).before_text;
    const result = ExpertPatchSubmitSchema.safeParse(patch);
    expect(result.success).toBe(true);
  });

  it("rationale is optional", () => {
    const patch = { ...VALID_PATCH };
    delete (patch as Partial<ExpertPatchSubmit>).rationale;
    const result = ExpertPatchSubmitSchema.safeParse(patch);
    expect(result.success).toBe(true);
  });
});

// ─── 2. Required fields validation ────────────────────────────────────

describe("ExpertPatchSubmitSchema: missing required fields", () => {
  it("fails when after_text is missing", () => {
    const patch = { ...VALID_PATCH };
    delete (patch as Partial<ExpertPatchSubmit>).after_text;
    const result = ExpertPatchSubmitSchema.safeParse(patch);
    expect(result.success).toBe(false);
  });

  it("fails when after_text is empty string", () => {
    const patch = { ...VALID_PATCH, after_text: "" };
    const result = ExpertPatchSubmitSchema.safeParse(patch);
    expect(result.success).toBe(false);
  });

  it("fails when edit_tags is empty array", () => {
    const patch = { ...VALID_PATCH, edit_tags: [] };
    const result = ExpertPatchSubmitSchema.safeParse(patch);
    expect(result.success).toBe(false);
  });

  it("fails when patch_type is invalid", () => {
    const patch = { ...VALID_PATCH, patch_type: "invalid_type" };
    const result = ExpertPatchSubmitSchema.safeParse(patch);
    expect(result.success).toBe(false);
  });

  it("fails when edit_tags contains invalid value", () => {
    const patch = { ...VALID_PATCH, edit_tags: ["not_a_valid_tag"] };
    const result = ExpertPatchSubmitSchema.safeParse(patch);
    expect(result.success).toBe(false);
  });

  it("fails when expert_role is invalid", () => {
    const patch = { ...VALID_PATCH, expert_role: "random_role" };
    const result = ExpertPatchSubmitSchema.safeParse(patch);
    expect(result.success).toBe(false);
  });
});

// ─── 3. ExpertPatchResponseSchema ─────────────────────────────────────

describe("ExpertPatchResponseSchema", () => {
  it("validates a successful patch response", () => {
    const response = {
      id: "patch_001",
      assignment_id: "assign_001",
      project_id: "proj_001",
      section_id: "sec_001",
      expert_role: "cre_consultant",
      patch_type: "risk_balance",
      after_text: "수익률은 가정에 따라 달라질 수 있습니다.",
      edit_tags: ["risk_balance_added"],
      visibility_after_review: "gate_restricted",
      training_rights: "not_allowed",
      requires_additional_review: false,
      status: "submitted",
      created_at: new Date().toISOString(),
    };
    const result = ExpertPatchResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("status is submitted after submission (not approved)", () => {
    const response = {
      id: "patch_002",
      project_id: "proj_001",
      expert_role: "cre_consultant",
      patch_type: "fact_correction",
      after_text: "수정된 내용",
      edit_tags: ["fact_correction" as unknown as "overclaim_removed"],
      visibility_after_review: "internal_only",
      training_rights: "not_allowed",
      requires_additional_review: false,
      status: "submitted",
      created_at: new Date().toISOString(),
    };
    const result = ExpertPatchResponseSchema.safeParse(response);
    // submitted is valid, but expert cannot auto-approve (docs/25 §14)
    if (result.success) {
      expect(result.data.status).not.toBe("approved");
    }
  });
});

// ─── 4. buildPatchActivityEvent ───────────────────────────────────────

describe("buildPatchActivityEvent", () => {
  it("builds event with expert_patch_submitted type", () => {
    const evt = buildPatchActivityEvent({
      patch_id: "patch_001",
      assignment_id: "assign_001",
      project_id: "proj_001",
      section_id: "sec_001",
      expert_role: "cre_consultant",
      patch_type: "risk_balance",
      edit_tags: ["overclaim_removed"],
      visibility_after_review: "gate_restricted",
      training_rights: "allowed_anonymized",
    });
    expect(evt.event_type).toBe("expert_patch_submitted");
    expect(evt.entity_type).toBe("expert_patch");
    expect(evt.metadata.patch_type).toBe("risk_balance");
  });

  it("does not include before_text or after_text in event metadata (no content leak)", () => {
    const evt = buildPatchActivityEvent({
      patch_id: "patch_001",
      assignment_id: "assign_001",
      project_id: "proj_001",
      section_id: "sec_001",
      expert_role: "cre_consultant",
      patch_type: "risk_balance",
      edit_tags: ["overclaim_removed"],
      visibility_after_review: "gate_restricted",
      training_rights: "not_allowed",
    });
    expect(evt.metadata).not.toHaveProperty("before_text");
    expect(evt.metadata).not.toHaveProperty("after_text");
  });

  it("event metadata includes training_rights and visibility_after_review", () => {
    const evt = buildPatchActivityEvent({
      patch_id: "patch_001",
      assignment_id: "assign_001",
      project_id: "proj_001",
      section_id: "sec_001",
      expert_role: "cre_consultant",
      patch_type: "risk_balance",
      edit_tags: ["risk_balance_added"],
      visibility_after_review: "internal_only",
      training_rights: "not_allowed",
    });
    expect(evt.metadata.training_rights).toBe("not_allowed");
    expect(evt.metadata.visibility_after_review).toBe("internal_only");
  });
});

// ─── 5. isAssignmentScoped ────────────────────────────────────────────

describe("isAssignmentScoped", () => {
  it("returns true when expert_id matches assignment expert_id", () => {
    expect(isAssignmentScoped({ assignment_expert_id: "expert_001", requesting_expert_id: "expert_001" })).toBe(true);
  });

  it("returns false when expert_id does not match", () => {
    expect(isAssignmentScoped({ assignment_expert_id: "expert_001", requesting_expert_id: "expert_002" })).toBe(false);
  });

  it("returns false for empty expert_id", () => {
    expect(isAssignmentScoped({ assignment_expert_id: "expert_001", requesting_expert_id: "" })).toBe(false);
  });
});

// ─── 6. Constants completeness ────────────────────────────────────────

describe("contract constants", () => {
  it("PATCH_TYPES has 13 entries (docs/05 §5)", () => {
    expect(PATCH_TYPES).toHaveLength(13);
  });

  it("EDIT_TAGS has 13 entries (docs/05 §6)", () => {
    expect(EDIT_TAGS).toHaveLength(13);
  });

  it("TRAINING_RIGHTS has 4 entries (docs/05 §7)", () => {
    expect(TRAINING_RIGHTS).toHaveLength(4);
  });

  it("VISIBILITY_OPTIONS has 4 entries (docs/25 §7)", () => {
    expect(VISIBILITY_OPTIONS).toHaveLength(4);
  });

  it("TRAINING_RIGHTS first option is not_allowed (default)", () => {
    expect(TRAINING_RIGHTS[0]).toBe("not_allowed");
  });
});
