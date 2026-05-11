# 13. Status Transition

## 1. Purpose

This document defines state machines for JS Full IM Studio.

State transitions must be explicit. AI-pair coding agents must not update status fields arbitrarily.

---

## 2. IM Project Status Machine

```text
intake
→ ssot_building
→ readiness_checked
→ outline_generated
→ ai_draft
→ expert_patch
→ gate_review
→ client_review
→ buyer_ready
→ exported
→ dealroom_published
→ archived
```

Blocking states:

```text
blocked
```

---

## 3. IM Project Transitions

| From | To | Trigger | Required |
|---|---|---|---|
| intake | ssot_building | create/import B-SSoT Full | building_ssot_full_id |
| ssot_building | readiness_checked | readiness check | readiness result |
| readiness_checked | outline_generated | generate outline | 18 sections |
| outline_generated | ai_draft | generate section drafts | at least one AI draft |
| ai_draft | expert_patch | request expert patch | assignment |
| expert_patch | gate_review | submit required patches | patch completed |
| gate_review | client_review | gates pass/revise | reviewer action |
| client_review | buyer_ready | buyer-ready approval | required gates pass |
| buyer_ready | exported | export completed | export job |
| exported | dealroom_published | publish payload | qna/evidence package |
| any | archived | archive | admin/project owner |
| any | blocked | severe violation | reviewer/admin |

---

## 4. IM Section Status Machine

```text
not_started
→ planned
→ ai_draft
→ needs_data
→ needs_expert_patch
→ patched
→ gate_review
→ buyer_ready
```

Blocking state:

```text
blocked
```

Alternative paths:

```text
planned → needs_data
ai_draft → needs_expert_patch
ai_draft → gate_review
patched → gate_review
gate_review → needs_data
gate_review → needs_expert_patch
gate_review → buyer_ready
```

---

## 5. Expert Assignment Status Machine

```text
assigned
→ in_review
→ submitted
→ approved
```

Alternative:

```text
submitted → revision_requested → in_review
assigned → cancelled
```

---

## 6. Expert Patch Status Machine

```text
draft
→ submitted
→ reviewed
→ approved
```

Alternative:

```text
submitted → rejected
reviewed → rejected
```

---

## 7. Gate Review Status

```text
pass
revise
expert_required
blocked
internal_only
```

### Meaning

| Status | Meaning |
|---|---|
| pass | target can proceed |
| revise | changes required |
| expert_required | expert patch needed |
| blocked | cannot proceed |
| internal_only | can remain internal but not buyer-ready |

---

## 8. Export Job Status

```text
queued
→ processing
→ completed
```

Alternative:

```text
queued → blocked
processing → failed
failed → queued
```

---

## 9. Golden Candidate Status

```text
candidate
→ redaction_pending
→ redacted
→ review_pending
→ approved
```

Alternative:

```text
candidate → rejected
redaction_pending → rejected
review_pending → rejected
```

---

## 10. Transition Service Requirement

Status changes should be handled by service functions:

```text
transitionProjectStatus()
transitionSectionStatus()
transitionExpertAssignmentStatus()
transitionGateReviewStatus()
transitionExportJobStatus()
```

Do not update status directly in UI components.

---

## 11. Transition Event Requirements

Every major transition must emit activity_event.

Examples:

```text
im_project_status_changed
im_section_status_changed
expert_assignment_status_changed
gate_review_completed
buyer_ready_approved
export_job_completed
```

Metadata should include:

```text
from_status
to_status
reason
actor_role
```

Do not include protected field values.

---

## 12. Guard Conditions

### Buyer-ready Approval Guard

Requires:

```text
- Data Gate pass
- Disclosure Gate pass
- Risk Gate pass
- Financial Consistency Gate pass or reviewer override
- required expert patches completed or reviewer override
- disclaimer present
- no P0 disclosure violation
```

### Export Guard

For buyer-ready export:

```text
project.status == buyer_ready
```

For draft export:

```text
draft watermark required
disclaimer required
```

### Golden Candidate Approval Guard

Requires:

```text
redaction_status == redacted
training_rights != not_allowed
reviewer approval
```

---

## 13. Invalid Transitions

Examples:

```text
intake → buyer_ready
ai_draft → exported
needs_expert_patch → buyer_ready without patch/override
gate_review blocked → exported
draft expert_patch → approved without submitted/reviewed
```

Invalid transitions should throw structured errors.

---

## 14. Acceptance Criteria

Status transition policy is accepted when:

```text
- core entity state machines are explicit.
- buyer-ready approval guard is defined.
- export guard is defined.
- golden candidate guard is defined.
- status changes emit events.
- direct arbitrary status mutation is prohibited.
```
