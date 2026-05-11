# 01. System Boundaries

## 1. Purpose

This document defines the product, data, API, and responsibility boundaries between:

```text
1. JS Building SSoT MVP
2. JS Full IM Studio
3. @js-ssot/contracts
```

The most important principle is:

> MVP creates demand and Building SSoT Lite. Full IM Studio upgrades that into a professional Full IM production workflow.

---

## 2. Boundary Summary

| System | Primary Job | Must Not Do |
|---|---|---|
| JS Building SSoT MVP | Public radar, broker deal card, B-SSoT Lite, lead generation | Full IM drafting, expert patching, buyer-ready approval |
| JS Full IM Studio | Full B-SSoT, Full IM, expert workbench, gate review, export | Public lead generation, casual broker utility, uncontrolled sharing |
| @js-ssot/contracts | Shared schema, enums, policies, events | App-specific UI, route handlers, DB implementation |

---

## 3. MVP Responsibilities

The MVP app is responsible for:

```text
- Public “이 건물, 딜 될까?” report
- Broker “JS 1분 딜카드”
- Building SSoT Lite creation
- Building Signal Card
- Blind Teaser
- Buyer Intent Lite
- Buyer Memo Lite
- Owner Readiness Lite
- Expert Note request
- Full IM lead generation
- Handoff request creation
```

MVP outputs:

```text
building_ssot_lite
building_signal_card
document_object
buyer_intent_lite
owner_readiness_check
expert_note_request
full_im_handoff_payload
activity_event
```

MVP must remain optimized for:

```text
speed
mobile-first usage
low-friction input
broker copy/share workflow
public lead capture
```

---

## 4. MVP Must Not Do

The MVP must not implement:

```text
- Full IM section editor
- 18-section Full IM drafting
- expert assignment workflow
- expert patch submission
- full gate review console
- buyer-ready approval
- PDF/PPTX production pipeline
- Deal Room Q&A Pack production
- Golden IM Dataset extraction
- complex expert marketplace
- payment/settlement
```

If these features are requested in the MVP context, create a handoff to Full IM Studio.

---

## 5. Full IM Studio Responsibilities

Full IM Studio is responsible for:

```text
- Importing MVP handoff
- Upgrading Building SSoT Lite to Full Building SSoT
- Creating IM projects
- Running IM Readiness Check
- Creating 18-section Full IM outline
- Generating AI section drafts
- Managing section editor
- Assigning expert review tasks
- Capturing expert patches
- Running review gates
- Exporting Web/PDF/Markdown/PPTX-ready output
- Creating Deal Room Q&A Pack
- Creating Golden Dataset candidates
```

Full IM Studio outputs:

```text
building_ssot_full
im_project
im_section
im_section_version
expert_assignment
expert_patch
gate_review
export_job
qna_pack
evidence_index
golden_im_candidate
activity_event
```

---

## 6. Full IM Studio Must Not Do

Full IM Studio must not:

```text
- create public lead-gen pages unrelated to Full IM
- replace MVP’s public building radar
- replace MVP’s broker 1-minute deal card
- modify MVP source rows directly
- bypass handoff token validation
- expose source private fields without gate policy
- provide final legal/tax/loan/investment advice
```

---

## 7. Shared Contracts Responsibilities

`@js-ssot/contracts` is responsible for:

```text
- Zod schemas
- TypeScript types
- enums
- gate levels
- visibility states
- document types
- IM section types
- expert roles
- event names
- disclosure policy
- forbidden claims
- safe rewrite rules
- readiness rules
```

It must be framework-agnostic.

Allowed:

```text
Zod
TypeScript
pure functions
constant maps
policy helpers
```

Not allowed:

```text
Next.js imports
Supabase client imports
React components
route handlers
server actions
database queries
```

---

## 8. Data Boundary

### MVP Source Data

The MVP owns the original lightweight source objects:

```text
building_ssot_lite
building_signal_card
buyer_intent_lite
document_object
owner_readiness_check
```

### Full IM Studio Project Data

Full IM Studio owns professional production objects:

```text
building_ssot_full
im_project
im_section
expert_patch
gate_review
export_job
golden_im_candidate
```

### Handoff Rule

Full IM Studio may read MVP source data only through:

```text
handoff payload
approved API
approved import service
```

Full IM Studio must not mutate MVP source objects.

---

## 9. Identity Boundary

Shared identity should use:

```text
auth_user_id
profile_id
broker_profile_id
expert_profile_id
```

Full IM Studio should map imported handoff users to local project roles:

```text
created_by
project_owner
broker
im_editor
expert
reviewer
admin
```

---

## 10. Event Boundary

MVP events:

```text
full_im_requested
full_im_handoff_created
expert_note_requested
building_ssot_lite_created
blind_teaser_generated
```

Full IM Studio events:

```text
handoff_imported
im_project_created
im_readiness_checked
im_outline_generated
im_section_draft_generated
expert_patch_requested
expert_patch_submitted
gate_review_completed
buyer_ready_approved
im_exported
dealroom_qna_pack_generated
golden_candidate_created
```

Both apps must use shared event names from contracts.

---

## 11. Disclosure Boundary

MVP primarily handles:

```text
public_blind
public_signal
lead_capture
basic gate request
```

Full IM Studio handles:

```text
gate_restricted
buyer_ready
internal_only
private_truth
expert_review
dealroom_ready
```

Protected fields must remain protected across both systems:

```text
exact_address
tenant_name
unit_rent
seller_motivation
negotiation_memo
internal_broker_note
```

---

## 12. API Boundary

MVP may expose only the following bridge APIs:

```text
POST /api/full-im-handoffs
GET  /api/full-im-handoffs/:token
```

Full IM Studio may consume only the handoff payload and then create internal project objects.

It must not call arbitrary MVP internal APIs.

---

## 13. AI Boundary

MVP AI:

```text
short-form report
blind teaser
buyer memo
owner readiness
basic disclosure guard
```

Full IM Studio AI:

```text
Full B-SSoT upgrade
IM readiness
section planning
section drafting
financial commentary
risk boundary
expert patch routing
gate review support
Q&A pack
golden dataset extraction
```

---

## 14. Acceptance Criteria

The system boundary is accepted when:

```text
- MVP remains low-friction and mobile-first.
- Full IM Studio can handle professional workflows without changing MVP UX.
- Shared contracts are the only common code dependency.
- Handoff payload is the only app-to-app data bridge.
- Full IM Studio does not mutate MVP source records.
- Disclosure policy is identical across apps.
```
