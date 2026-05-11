# 02. Document Contracts

## 1. Purpose

This document defines shared document contracts used across the MVP and Full IM Studio.

All generated outputs must be represented as document objects or section objects with source references, visibility, status, and boundary notes.

---

## 2. Document Types

```ts
export const DocumentTypeSchema = z.enum([
  "deal_curiosity_report",
  "blind_teaser",
  "building_signal_card",
  "buyer_fit_memo",
  "owner_prep_memo",
  "missing_data_checklist",
  "gate_request_note",

  "external_snapshot",
  "im_lite",
  "full_im",
  "full_im_section",
  "internal_broker_note",
  "dealroom_qna_pack",
  "evidence_index",
  "export_pdf",
  "export_markdown",
  "export_pptx"
]);
```

---

## 3. Document Status

```ts
export const DocumentStatusSchema = z.enum([
  "draft",
  "disclosure_checked",
  "broker_reviewed",
  "expert_reviewed",
  "gate_review",
  "approved_internal",
  "buyer_ready",
  "shared_external",
  "blocked",
  "archived"
]);
```

---

## 4. Visibility

```ts
export const VisibilitySchema = z.enum([
  "public",
  "public_blind",
  "registered_interest",
  "qualified_summary",
  "gate_restricted",
  "internal_only",
  "private_truth",
  "blocked"
]);
```

---

## 5. Document Object

```ts
export const DocumentObjectSchema = z.object({
  id: z.string(),

  source_type: z.enum([
    "building_ssot_lite",
    "building_ssot_full",
    "building_signal_card",
    "buyer_intent_lite",
    "owner_readiness_check",
    "im_project",
    "im_section",
    "expert_patch"
  ]),

  source_id: z.string(),

  document_type: DocumentTypeSchema,
  visibility: VisibilitySchema,
  status: DocumentStatusSchema.default("draft"),

  title: z.string(),
  summary: z.string().optional(),

  body_json: z.record(z.string(), z.any()).default({}),
  markdown: z.string().optional(),

  boundary_note: z.string().optional(),
  source_refs: z.array(z.any()).default([]),
  redacted_fields: z.array(z.string()).default([]),

  model_version: z.string().optional(),
  prompt_version: z.string().optional(),

  created_by: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional()
});
```

---

## 6. Required Boundary Notes

Boundary notes are required for these document types:

```text
deal_curiosity_report
blind_teaser
buyer_fit_memo
external_snapshot
im_lite
full_im
full_im_section
dealroom_qna_pack
```

Minimum boundary note:

```text
본 자료는 제공자료와 공개정보를 바탕으로 한 예비 검토 자료이며, 투자 권유, 감정평가, 법률·세무·대출 가능성 판단을 목적으로 하지 않습니다. 실제 거래 여부는 별도 실사와 전문가 검토를 통해 판단해야 합니다.
```

---

## 7. Document Object Rules

Every document must have:

```text
source_type
source_id
document_type
visibility
status
source_refs
created_at
```

AI-generated documents must default to:

```text
status = draft
```

Public/blind documents must pass:

```text
DisclosurePolicy
RiskBoundaryPolicy
ForbiddenClaimsCheck
```

---

## 8. Full IM Section Document Contract

Full IM sections are also document-like but require additional structure.

```ts
export const FullIMSectionDocumentSchema = DocumentObjectSchema.extend({
  document_type: z.literal("full_im_section"),
  section_type: z.string(),
  section_order: z.number(),
  confidence: z.enum(["confirmed", "inferred", "needs_evidence", "expert_required", "unknown"]),
  risk_level: z.enum(["low", "medium", "high", "blocked"]),
  requires_expert_patch: z.boolean().default(false),
  required_evidence: z.array(z.string()).default([]),
});
```

---

## 9. Validation Helpers

The contracts package should expose pure helpers:

```ts
assertDocumentHasSourceRefs(document)
assertPublicDocumentHasBoundaryNote(document)
assertDocumentVisibilityAllowed(document, gateLevel)
assertNoProtectedFields(document)
```

These helpers must not call databases or AI providers.

---

## 10. Acceptance Criteria

Document contracts are accepted when:

```text
- Every generated output can be represented as DocumentObject.
- AI-generated documents default to draft.
- Public/blind documents require boundary notes.
- Document visibility is standardized.
- Full IM sections can be treated as document objects with extra metadata.
```
