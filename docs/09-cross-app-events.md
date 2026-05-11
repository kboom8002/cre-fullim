# 09. Cross-app Events

## 1. Purpose

This document defines the event contract between JS Building SSoT MVP and JS Full IM Studio.

Events must support:

```text
- integration audit
- funnel analytics
- expert workflow tracking
- gate review tracking
- golden dataset pipeline
```

---

## 2. Event Principle

> Every important state transition across apps must emit a structured event.

Events should be safe for analytics and should not contain protected raw data.

---

## 3. MVP Events Related to Full IM

```text
full_im_requested
full_im_handoff_created
full_im_handoff_revoked
full_im_handoff_expired
full_im_handoff_failed
```

### Example

```json
{
  "event_name": "full_im_handoff_created",
  "actor_role": "broker",
  "entity_type": "handoff",
  "entity_id": "handoff_001",
  "metadata": {
    "source_building_ssot_lite_id": "bsl_001",
    "requested_output": "buyer_ready_full_im",
    "package_intent": "ai_expert_review"
  }
}
```

Do not include:

```text
exact address
tenant names
unit rent
seller motivation
negotiation memo
```

---

## 4. Full IM Studio Import Events

```text
handoff_import_started
handoff_imported
handoff_import_failed
handoff_permission_denied
handoff_contract_mismatch
bssot_full_created
im_project_created
im_readiness_check_queued
```

---

## 5. Full IM Production Events

```text
im_readiness_checked
im_outline_generated
im_section_draft_generated
im_section_updated
im_section_status_changed
expert_patch_requested
expert_assignment_created
expert_patch_submitted
expert_patch_approved
gate_review_started
gate_review_completed
buyer_ready_approved
buyer_ready_blocked
im_export_requested
im_exported
dealroom_qna_pack_generated
golden_candidate_created
```

---

## 6. Safety Events

```text
disclosure_redaction_applied
disclosure_violation_blocked
forbidden_claim_blocked
ai_schema_validation_failed
financial_consistency_issue_detected
export_blocked_by_gate
```

Safety events are important for both product quality and model improvement.

---

## 7. Event Metadata Rules

Allowed metadata:

```text
source_app
contracts_version
payload_version
requested_output
package_intent
project_id
section_type
document_type
gate_type
status
readiness_score
expert_role
patch_type
export_type
violation_count
```

Forbidden metadata:

```text
exact address
tenant name
unit rent
owner contact
buyer contact
seller motivation
negotiation memo
full lease text
raw evidence file content
```

---

## 8. Cross-app Funnel

The funnel from MVP to Full IM Studio should be measurable:

```text
full_im_requested
→ full_im_handoff_created
→ handoff_imported
→ im_project_created
→ im_readiness_checked
→ im_outline_generated
→ im_section_draft_generated
→ expert_patch_requested
→ gate_review_completed
→ buyer_ready_approved
→ im_exported
```

---

## 9. Event Storage

If using shared Supabase:

```text
activity_events can be shared with app/source_app field
```

If using separate Supabase projects:

```text
each app stores local event
optionally sync summary event to analytics warehouse
```

Recommended for early version:

```text
shared activity_events table with strict RLS and metadata privacy
```

---

## 10. Event Schema

```ts
export const CrossAppActivityEventSchema = z.object({
  id: z.string(),
  source_app: z.enum(["js-building-ssot-mvp", "js-full-im-studio"]),
  actor_id: z.string().optional(),
  actor_role: z.string(),
  event_name: z.string(),
  entity_type: z.string(),
  entity_id: z.string().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  occurred_at: z.string().datetime()
});
```

---

## 11. Acceptance Criteria

Cross-app events are accepted when:

```text
- MVP and Full IM Studio event names are standardized.
- Handoff funnel can be measured.
- event metadata privacy rules are explicit.
- safety events are captured.
- Full IM production lifecycle is auditable.
```
