/**
 * Expert Patch Domain (Slice 8)
 *
 * Implements:
 *   - packages/contracts-docs/05-expert-patch-contracts.md §2-§9
 *   - docs/25-expert-workbench-spec.md §6 Form, §11 Submit Flow
 *
 * Rules:
 *   - after_text: required, non-empty (§9)
 *   - edit_tags: required, min 1 (§9)
 *   - training_rights: default "not_allowed" (§7 §8)
 *   - visibility_after_review: default "internal_only" (§7)
 *   - Expert selection of visibility ≠ final approval (§7)
 *   - Activity event must NOT include before_text/after_text content (no data leak)
 */
import { z } from "zod";

// ─── Constants (docs/05 §2, §5-§7) ────────────────────────────────────

export const EXPERT_ROLES = [
  "cre_consultant",
  "broker",
  "legal_expert",
  "tax_accounting_expert",
  "valuation_expert",
  "architect_building_expert",
  "market_research_expert",
  "debt_financing_expert",
  "reviewer",
  "admin",
] as const;

export const PATCH_TYPES = [
  "fact_correction",
  "risk_balance",
  "overclaim_removal",
  "financial_assumption_fix",
  "legal_boundary_fix",
  "tax_boundary_fix",
  "valuation_logic_fix",
  "lease_quality_note",
  "building_condition_note",
  "market_context_addition",
  "disclosure_redaction",
  "buyer_message_improvement",
  "style_edit",
  // "other" omitted to keep count at 13 matching spec §5
] as const;

// Add "other" as 13th
const PATCH_TYPES_WITH_OTHER = [...PATCH_TYPES, "other"] as const;

export const EDIT_TAGS = [
  "overclaim_removed",
  "risk_balance_added",
  "evidence_needed",
  "source_ref_added",
  "legal_boundary_added",
  "tax_boundary_added",
  "financial_assumption_added",
  "disclosure_issue_fixed",
  "tenant_detail_redacted",
  "unit_rent_redacted",
  "buyer_fit_clarified",
  "value_add_softened",
  "wording_professionalized",
] as const;

export const TRAINING_RIGHTS = [
  "not_allowed",
  "allowed_anonymized",
  "allowed_internal_eval_only",
  "allowed_golden_dataset",
] as const;

export const VISIBILITY_OPTIONS = [
  "internal_only",
  "gate_restricted",
  "buyer_ready",
  "blocked",
] as const;

// ─── Zod Schemas ───────────────────────────────────────────────────────

const ExpertRoleSchema = z.enum([...EXPERT_ROLES] as [string, ...string[]]);
const PatchTypeSchema = z.enum([...PATCH_TYPES_WITH_OTHER] as [string, ...string[]]);
const EditTagSchema = z.enum([...EDIT_TAGS] as [string, ...string[]]);
const TrainingRightsSchema = z.enum([...TRAINING_RIGHTS] as [string, ...string[]]).default("not_allowed");
const VisibilitySchema = z.enum([...VISIBILITY_OPTIONS] as [string, ...string[]]).default("internal_only");

/**
 * ExpertPatchSubmitSchema — validates incoming patch submission.
 * after_text and edit_tags are required (docs/25 §11, docs/05 §9).
 */
export const ExpertPatchSubmitSchema = z.object({
  assignment_id: z.string().optional(),
  project_id: z.string().min(1),
  section_id: z.string().optional(),
  expert_role: ExpertRoleSchema,
  patch_type: PatchTypeSchema,
  before_text: z.string().optional(),
  /** Required — docs/05 §9 */
  after_text: z.string().min(1, "after_text is required"),
  /** Required — at least 1 tag — docs/05 §9 */
  edit_tags: z.array(EditTagSchema).min(1, "At least one edit_tag is required"),
  rationale: z.string().optional(),
  visibility_after_review: VisibilitySchema,
  training_rights: TrainingRightsSchema,
  requires_additional_review: z.boolean().default(false),
  suggested_missing_evidence: z.array(z.string()).optional(),
  reviewer_note: z.string().optional(),
});

export type ExpertPatchSubmit = z.input<typeof ExpertPatchSubmitSchema>;
export type ExpertPatchSubmitParsed = z.infer<typeof ExpertPatchSubmitSchema>;

/**
 * ExpertPatchResponseSchema — shape of the created expert_patch row.
 */
export const ExpertPatchResponseSchema = z.object({
  id: z.string(),
  assignment_id: z.string().optional(),
  project_id: z.string(),
  section_id: z.string().optional(),
  expert_role: ExpertRoleSchema,
  patch_type: PatchTypeSchema,
  before_text: z.string().optional(),
  after_text: z.string(),
  edit_tags: z.array(EditTagSchema),
  rationale: z.string().optional(),
  visibility_after_review: VisibilitySchema,
  training_rights: TrainingRightsSchema,
  requires_additional_review: z.boolean(),
  /** Always "submitted" after initial submission — expert cannot approve (docs/25 §14) */
  status: z.enum(["draft", "submitted", "reviewed", "approved", "rejected"]),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export type ExpertPatchResponse = z.infer<typeof ExpertPatchResponseSchema>;

// ─── buildPatchActivityEvent ───────────────────────────────────────────

export interface PatchActivityEventInput {
  patch_id: string;
  assignment_id?: string;
  project_id: string;
  section_id?: string;
  expert_role: string;
  patch_type: string;
  edit_tags: string[];
  visibility_after_review: string;
  training_rights: string;
}

export interface PatchActivityEvent {
  event_type: string;
  entity_type: string;
  entity_id: string;
  source_app: string;
  metadata: Record<string, unknown>;
}

/**
 * Builds activity event for expert_patch_submitted.
 * Does NOT include before_text or after_text to avoid content leakage.
 * (docs/13 §11 — metadata must not include protected field values)
 */
export function buildPatchActivityEvent(input: PatchActivityEventInput): PatchActivityEvent {
  return {
    event_type: "expert_patch_submitted",
    entity_type: "expert_patch",
    entity_id: input.patch_id,
    source_app: "js-full-im-studio",
    metadata: {
      assignment_id: input.assignment_id,
      project_id: input.project_id,
      section_id: input.section_id,
      expert_role: input.expert_role,
      patch_type: input.patch_type,
      edit_tags: input.edit_tags,
      edit_tags_count: input.edit_tags.length,
      visibility_after_review: input.visibility_after_review,
      training_rights: input.training_rights,
      // Intentionally omit: before_text, after_text, rationale (content data)
    },
  };
}

// ─── isAssignmentScoped ────────────────────────────────────────────────

/**
 * Checks if the requesting expert matches the assignment's expert.
 * Enforces assignment-scoped access (docs/25 §13).
 */
export function isAssignmentScoped(input: {
  assignment_expert_id: string;
  requesting_expert_id: string;
}): boolean {
  if (!input.requesting_expert_id) return false;
  return input.assignment_expert_id === input.requesting_expert_id;
}
