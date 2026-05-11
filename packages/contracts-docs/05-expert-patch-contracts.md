# 05. Expert Patch Contracts

## 1. Purpose

This document defines shared contracts for expert assignments, expert patches, edit tags, and training rights.

The Expert Workbench must use these contracts.

---

## 2. Expert Roles

```ts
export const ExpertRoleSchema = z.enum([
  "cre_consultant",
  "broker",
  "legal_expert",
  "tax_accounting_expert",
  "valuation_expert",
  "architect_building_expert",
  "market_research_expert",
  "debt_financing_expert",
  "reviewer",
  "admin"
]);
```

---

## 3. Expert Assignment Status

```ts
export const ExpertAssignmentStatusSchema = z.enum([
  "assigned",
  "in_review",
  "submitted",
  "revision_requested",
  "approved",
  "cancelled"
]);
```

---

## 4. Expert Assignment Schema

```ts
export const ExpertAssignmentSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  section_id: z.string().optional(),

  expert_id: z.string(),
  expert_role: ExpertRoleSchema,

  assignment_type: z.enum([
    "section_patch",
    "risk_review",
    "financial_review",
    "legal_review",
    "valuation_review",
    "disclosure_review",
    "full_im_review"
  ]),

  status: ExpertAssignmentStatusSchema.default("assigned"),

  instructions: z.string().optional(),
  due_at: z.string().datetime().optional(),

  created_by: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional()
});
```

---

## 5. Patch Types

```ts
export const PatchTypeSchema = z.enum([
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
  "other"
]);
```

---

## 6. Edit Tags

```ts
export const EditTagSchema = z.enum([
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
  "section_restructured"
]);
```

---

## 7. Training Rights

```ts
export const TrainingRightsSchema = z.enum([
  "not_allowed",
  "allowed_anonymized",
  "allowed_internal_eval_only",
  "allowed_golden_dataset"
]);
```

---

## 8. Expert Patch Schema

```ts
export const ExpertPatchSchema = z.object({
  id: z.string(),

  assignment_id: z.string().optional(),
  project_id: z.string(),
  section_id: z.string().optional(),

  expert_id: z.string(),
  expert_role: ExpertRoleSchema,

  patch_type: PatchTypeSchema,

  before_text: z.string().optional(),
  after_text: z.string(),

  edit_tags: z.array(EditTagSchema).default([]),

  rationale: z.string().optional(),

  visibility_after_review: z.enum([
    "internal_only",
    "gate_restricted",
    "buyer_ready",
    "blocked"
  ]).default("internal_only"),

  requires_additional_review: z.boolean().default(false),

  training_rights: TrainingRightsSchema.default("not_allowed"),

  status: z.enum([
    "draft",
    "submitted",
    "reviewed",
    "approved",
    "rejected"
  ]).default("draft"),

  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional()
});
```

---

## 9. Expert Patch Rules

Every patch must include:

```text
project_id
expert_id
expert_role
patch_type
after_text
edit_tags
visibility_after_review
training_rights
```

If the patch changes generated text, it should include:

```text
before_text
after_text
edit_tags
rationale
```

---

## 10. Golden Dataset Candidate Link

Expert patches can become Golden Dataset candidates only if:

```text
training_rights != not_allowed
protected fields are redacted
edit_tags are present
reviewer approval exists
```

---

## 11. Acceptance Criteria

Expert patch contracts are accepted when:

```text
- Expert roles are standardized.
- Expert assignments can be tracked.
- Expert before/after edits can be captured.
- Edit reason tags are structured.
- Training rights are explicit.
- Golden dataset extraction can use patch data safely.
```
