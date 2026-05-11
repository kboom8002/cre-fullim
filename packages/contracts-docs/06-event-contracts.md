# 06. Event Contracts

## 1. Purpose

This document defines shared event names and activity event contracts for MVP, Full IM Studio, and future Deal Room systems.

The event system is the foundation for:

```text
- analytics
- audit
- learning loop
- Golden Dataset pipeline
- commercial funnel measurement
```

---

## 2. Activity Event Schema

```ts
export const ActivityEventSchema = z.object({
  id: z.string(),

  actor_id: z.string().optional(),
  actor_role: z.enum([
    "anonymous",
    "public_user",
    "broker",
    "owner",
    "buyer",
    "expert",
    "reviewer",
    "admin",
    "system"
  ]),

  event_name: z.string(),

  entity_type: z.enum([
    "building_ssot_lite",
    "building_ssot_full",
    "building_signal_card",
    "buyer_intent_lite",
    "document_object",
    "im_project",
    "im_section",
    "expert_patch",
    "gate_review",
    "export_job",
    "handoff",
    "golden_candidate"
  ]),

  entity_id: z.string().optional(),

  metadata: z.record(z.string(), z.any()).default({}),

  occurred_at: z.string().datetime()
});
```

---

## 3. MVP Event Names

```ts
export const MVPEventName = {
  ADDRESS_SUBMITTED: "address_submitted",
  BROKER_MEMO_SUBMITTED: "broker_memo_submitted",
  BUILDING_SSOT_LITE_CREATED: "building_ssot_lite_created",
  BUILDING_SIGNAL_CARD_CREATED: "building_signal_card_created",
  DEAL_CURIOSITY_REPORT_GENERATED: "deal_curiosity_report_generated",
  BLIND_TEASER_GENERATED: "blind_teaser_generated",
  BUYER_INTENT_CREATED: "buyer_intent_created",
  BUYER_MEMO_GENERATED: "buyer_memo_generated",
  OWNER_READINESS_CHECKED: "owner_readiness_checked",
  EXPERT_NOTE_REQUESTED: "expert_note_requested",
  FULL_IM_REQUESTED: "full_im_requested",
  FULL_IM_HANDOFF_CREATED: "full_im_handoff_created",
  DOCUMENT_SHARED: "document_shared"
} as const;
```

---

## 4. Full IM Studio Event Names

```ts
export const FullIMEventName = {
  HANDOFF_IMPORTED: "handoff_imported",
  IM_PROJECT_CREATED: "im_project_created",
  BSSOT_FULL_CREATED: "bssot_full_created",
  IM_READINESS_CHECKED: "im_readiness_checked",
  IM_OUTLINE_GENERATED: "im_outline_generated",
  IM_SECTION_DRAFT_GENERATED: "im_section_draft_generated",
  IM_SECTION_UPDATED: "im_section_updated",
  EXPERT_PATCH_REQUESTED: "expert_patch_requested",
  EXPERT_ASSIGNMENT_CREATED: "expert_assignment_created",
  EXPERT_PATCH_SUBMITTED: "expert_patch_submitted",
  GATE_REVIEW_STARTED: "gate_review_started",
  GATE_REVIEW_COMPLETED: "gate_review_completed",
  BUYER_READY_APPROVED: "buyer_ready_approved",
  IM_EXPORTED: "im_exported",
  DEALROOM_QNA_PACK_GENERATED: "dealroom_qna_pack_generated",
  DEALROOM_PUBLISHED: "dealroom_published",
  GOLDEN_CANDIDATE_CREATED: "golden_candidate_created",
  GOLDEN_CANDIDATE_APPROVED: "golden_candidate_approved"
} as const;
```

---

## 5. Safety Event Names

```ts
export const SafetyEventName = {
  DISCLOSURE_REDACTION_APPLIED: "disclosure_redaction_applied",
  DISCLOSURE_VIOLATION_BLOCKED: "disclosure_violation_blocked",
  FORBIDDEN_CLAIM_BLOCKED: "forbidden_claim_blocked",
  AI_SCHEMA_VALIDATION_FAILED: "ai_schema_validation_failed",
  GATE_BLOCKED_BUYER_READY: "gate_blocked_buyer_ready",
  EXPORT_BLOCKED_BY_GATE: "export_blocked_by_gate"
} as const;
```

---

## 6. Event Metadata Rules

Event metadata may include:

```text
document_type
gate_level
visibility
status
section_type
expert_role
patch_type
export_type
readiness_score
violation_count
```

Event metadata must not include:

```text
exact address
tenant name
unit-level rent
owner contact
buyer contact
seller motivation
negotiation memo
raw evidence file content
```

---

## 7. Event Coverage Requirements

Every important mutation must emit an event.

Required mutations:

```text
- building created
- signal created
- document generated
- handoff created/imported
- im project created
- readiness checked
- outline generated
- section draft generated
- expert assignment created
- expert patch submitted
- gate review completed
- export completed
- golden candidate created
```

---

## 8. Acceptance Criteria

Event contracts are accepted when:

```text
- MVP and Full IM Studio share event names.
- Safety events are standardized.
- Metadata privacy rules are explicit.
- Event names can support analytics and audit.
- Golden Dataset pipeline can trace document evolution safely.
```
