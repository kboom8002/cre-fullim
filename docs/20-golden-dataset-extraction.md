# 20. Golden Dataset Extraction

## 1. Purpose

This document defines how JS Full IM Studio extracts, redacts, reviews, and approves Golden Dataset candidates.

The Golden Dataset is a long-term AI moat. It captures the difference between:

```text
AI draft
→ expert patch
→ reviewer gate result
→ buyer/deal outcome
```

However, it must be legally and ethically safe.

---

## 2. Golden Dataset Principle

> No data becomes training data by default.

Training or fine-tuning use requires:

```text
explicit training_rights
redaction
reviewer/admin approval
audit trail
```

---

## 3. Candidate Sources

Golden candidates may come from:

```text
AI section draft + expert patch
AI draft + reviewer edit
risk boundary rewrite
disclosure guard rewrite
financial commentary correction
valuation logic correction
buyer Q&A improvement
gate review violation + final correction
```

---

## 4. Golden Candidate Object

```ts
export const GoldenIMCandidateSchema = z.object({
  id: z.string(),

  project_id: z.string(),
  section_id: z.string().optional(),
  expert_patch_id: z.string().optional(),
  gate_review_id: z.string().optional(),

  section_type: z.string().optional(),

  ai_draft: z.string(),
  expert_revision: z.string().optional(),
  reviewer_revision: z.string().optional(),

  edit_tags: z.array(z.string()).default([]),

  issue_categories: z.array(z.enum([
    "overclaim",
    "missing_evidence",
    "financial_assumption",
    "disclosure",
    "risk_balance",
    "legal_boundary",
    "tax_boundary",
    "valuation_logic",
    "style",
    "structure"
  ])).default([]),

  redaction_status: z.enum([
    "pending",
    "redacted",
    "failed",
    "not_required"
  ]).default("pending"),

  training_rights: z.enum([
    "not_allowed",
    "allowed_anonymized",
    "allowed_internal_eval_only",
    "allowed_golden_dataset"
  ]).default("not_allowed"),

  review_status: z.enum([
    "candidate",
    "review_pending",
    "approved",
    "rejected"
  ]).default("candidate"),

  metadata: z.record(z.string(), z.any()).default({}),

  created_at: z.string().datetime(),
  reviewed_at: z.string().datetime().optional()
});
```

---

## 5. Extraction Rules

A candidate may be created when:

```text
AI draft exists
expert or reviewer revision exists
edit_tags exist or can be inferred
source project is active
training_rights field exists
```

A candidate must not be approved if:

```text
training_rights = not_allowed
redaction_status is not redacted/not_required
protected fields remain
reviewer approval missing
```

---

## 6. Edit Tags

Required structured tags:

```text
overclaim_removed
risk_balance_added
evidence_needed
source_ref_added
legal_boundary_added
tax_boundary_added
financial_assumption_added
disclosure_issue_fixed
tenant_detail_redacted
unit_rent_redacted
buyer_fit_clarified
value_add_softened
wording_professionalized
section_restructured
```

---

## 7. Redaction Rules

Before approval, remove or generalize:

```text
exact address
tenant names
unit rent
owner names
buyer names
broker personal notes
negotiation memo
raw lease terms
contact information
unique transaction identifiers
```

Example:

```text
서울 성동구 성수동2가 123-45
→ 성수권역

스타벅스
→ 1층 F&B 임차인

301호 월세 450만 원
→ 상층부 개별 호실 임대료
```

---

## 8. Training Rights

### not_allowed

Cannot be used for training or eval.

### allowed_anonymized

Can be used after redaction.

### allowed_internal_eval_only

Can be used for internal evaluation tests but not model training.

### allowed_golden_dataset

Can be used for approved internal training/evaluation dataset after review.

---

## 9. Golden Dataset Review Workflow

```text
candidate created
→ redaction pending
→ redaction complete
→ reviewer review
→ approved or rejected
```

Reviewer must check:

```text
protected fields removed
training rights valid
edit tags meaningful
before/after pair useful
domain category clear
quality sufficient
```

---

## 10. Candidate Quality Criteria

Good candidate:

```text
clear AI error or weakness
clear expert improvement
specific edit tags
safe redaction
reusable lesson
domain-specific value
```

Bad candidate:

```text
too generic
no expert improvement
contains private facts
unclear rights
unclear edit reason
too short to learn from
```

---

## 11. Dataset Categories

Organize approved candidates by:

```text
section_type
issue_category
expert_role
risk_level
asset_type
document_type
language_style
```

---

## 12. API Requirements

```text
POST /api/golden-im-candidates
POST /api/golden-im-candidates/:id/redact
POST /api/golden-im-candidates/:id/approve
POST /api/golden-im-candidates/:id/reject
GET  /api/admin/golden-im-candidates
```

---

## 13. Events

Required events:

```text
golden_candidate_created
golden_candidate_redacted
golden_candidate_approved
golden_candidate_rejected
```

---

## 14. Tests

Required tests:

```text
candidate cannot be approved with training_rights not_allowed
candidate cannot be approved before redaction
exact address is redacted
tenant name is redacted
unit rent is generalized
approved candidate has edit_tags
rejected candidate is not exported
```

---

## 15. Acceptance Criteria

Golden Dataset extraction is accepted when:

```text
- candidate object is defined.
- training rights are explicit.
- redaction workflow is mandatory.
- reviewer approval is required.
- protected fields are removed.
- useful edit tags are captured.
- dataset can support future fine-tuning/evaluation safely.
```
