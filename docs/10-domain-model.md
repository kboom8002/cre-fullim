# 10. Domain Model

## 1. Purpose

This document defines the core domain model for **JS Full IM Studio**.

Full IM Studio is not a generic document generator. It is a professional CRE deal document production system built around:

```text
Building SSoT Full
→ IM Project
→ IM Sections
→ AI Drafts
→ Expert Patches
→ Gate Reviews
→ Exports
→ Q&A Pack
→ Golden Dataset Candidates
```

---

## 2. Domain Model Overview

```text
handoff_source_snapshot
  └─ building_ssot_full
      └─ im_project
          ├─ im_sections
          │   ├─ im_section_versions
          │   ├─ expert_assignments
          │   ├─ expert_patches
          │   └─ gate_reviews
          ├─ evidence_files
          ├─ export_jobs
          ├─ dealroom_qna_packs
          ├─ golden_im_candidates
          ├─ activity_events
          └─ ai_runs
```

---

## 3. Core Entities

## 3.1 Handoff Source Snapshot

### Purpose

Stores an immutable snapshot of data imported from the MVP.

### Rules

```text
- created from handoff payload
- preserves source app/version/contracts version
- must not be edited as project truth
- used as provenance/audit layer
```

### Key Fields

```text
id
handoff_id
source_app
source_app_version
contracts_version
payload_version
source_building_ssot_lite_id
source_objects
import_status
warnings
imported_by
imported_at
```

---

## 3.2 Building SSoT Full

### Purpose

The professional building truth object used to generate Full IM.

### Key Layers

```text
asset_identity
physical_fact
legal_registry
lease_income
market_location
value_up_hypothesis
risk_unknown
buyer_fit
disclosure_gate
evidence_source
b2c_consumer_demand
space_environmental
tenant_operator_management
ai_answer_document_contract
```

### Status

```text
lite_imported
needs_data
im_lite_ready
full_im_draft_ready
buyer_ready_candidate
archived
```

### Rules

```text
- may be created from B-SSoT Lite import
- may be enriched by user uploads and expert patches
- must preserve source_refs and evidence_refs
- must classify private/protected fields
```

---

## 3.3 IM Project

### Purpose

Top-level production workspace for a Full IM.

### Project Types

```text
ai_self_authoring
ai_expert_review
expert_full_build
dealroom_ready_package
```

### Target Outputs

```text
external_snapshot
im_lite
buyer_ready_full_im
dealroom_ready_package
```

### Status

```text
intake
ssot_building
readiness_checked
outline_generated
ai_draft
expert_patch
gate_review
client_review
buyer_ready
exported
dealroom_published
archived
blocked
```

### Rules

```text
- every project must reference building_ssot_full
- project target_output controls required gates
- buyer_ready status requires gate approval
```

---

## 3.4 IM Section

### Purpose

Represents one section/page of the 18-section Full IM.

### Required Sections

```text
cover_confidentiality
executive_summary
investment_thesis_buyer_fit
property_fact_sheet
land_zoning_legal_constraints
location_access
micro_market_demand_story
building_condition_physical_review
rent_roll_lease_quality
income_noi_yield_analysis
debt_sensitivity_cash_flow
valuation_logic_comparables
value_add_repositioning_scenario
risk_factors_dd_checklist
deal_process_next_steps
dealroom_qna_starter
appendix_evidence_index
disclaimer_contact
```

### Status

```text
not_started
planned
ai_draft
needs_data
needs_expert_patch
patched
gate_review
buyer_ready
blocked
```

### Rules

```text
- each section must belong to an im_project
- each section must have section_type and section_order
- AI-generated sections must include source_refs
- high-risk sections require expert patch or reviewer override
```

---

## 3.5 IM Section Version

### Purpose

Tracks changes to section content over time.

### Version Sources

```text
ai_generated
user_edit
expert_patch
reviewer_edit
system_rewrite
imported
```

### Rules

```text
- do not overwrite important generated content without versioning
- expert patch should create a new version
- gate review should reference a section version
```

---

## 3.6 Expert Assignment

### Purpose

Assigns a section/project review task to an expert.

### Assignment Types

```text
section_patch
risk_review
financial_review
legal_review
valuation_review
disclosure_review
full_im_review
```

### Status

```text
assigned
in_review
submitted
revision_requested
approved
cancelled
```

---

## 3.7 Expert Patch

### Purpose

Captures expert before/after edits and rationale.

### Required Data

```text
project_id
section_id
expert_id
expert_role
patch_type
after_text
edit_tags
visibility_after_review
training_rights
status
```

### Rules

```text
- before_text should be stored when patch modifies existing text
- edit_tags are mandatory for Golden Dataset candidates
- patch cannot directly approve buyer-ready status
```

---

## 3.8 Gate Review

### Purpose

Runs quality, disclosure, risk, financial consistency, expert-scope, and buyer-ready review.

### Gate Types

```text
data_gate
disclosure_gate
risk_gate
financial_consistency_gate
expert_scope_gate
design_quality_gate
training_rights_gate
buyer_ready_approval_gate
```

### Status

```text
pass
revise
expert_required
blocked
internal_only
```

### Rules

```text
- any P0 disclosure violation blocks buyer-ready approval
- financial inconsistency blocks export
- missing required expert patch blocks buyer-ready approval unless reviewer override is logged
```

---

## 3.9 Evidence File

### Purpose

Stores or references evidence used to support IM claims.

### Evidence Types

```text
building_register
registry
land_use_plan
lease_summary
rent_roll
photo
floor_plan
repair_history
market_comp
rent_comp
expert_memo
other
```

### Visibility

```text
private_truth
internal_only
gate_restricted
buyer_ready
public_blind
blocked
```

---

## 3.10 Export Job

### Purpose

Tracks export requests and output files.

### Export Types

```text
web_im
pdf
markdown
pptx
dealroom_payload
```

### Status

```text
queued
processing
completed
failed
blocked
```

### Rules

```text
- buyer-ready exports require gate approval
- draft exports must be clearly watermarked or labeled as draft
- disclaimer must be included in all exports
```

---

## 3.11 Deal Room Q&A Pack

### Purpose

Generates expected buyer questions and answer readiness.

### Includes

```text
question
answer_status
draft_answer
required_evidence
visibility
owner_broker_answer_needed
expert_required
```

---

## 3.12 Golden IM Candidate

### Purpose

Stores candidate training/evaluation examples from AI draft + expert patch + gate outcome.

### Must Include

```text
source_section_id
ai_draft
expert_revision
edit_tags
redaction_status
training_rights
review_status
```

### Rules

```text
- cannot be used for training unless training_rights allow
- must pass redaction
- must be approved before golden dataset inclusion
```

---

## 4. Relationship Rules

## 4.1 Handoff to Project

```text
handoff_source_snapshot
→ building_ssot_full
→ im_project
```

## 4.2 Project to Section

```text
im_project
→ 18 planned im_sections
→ section drafts/versions
```

## 4.3 Section to Expert Patch

```text
im_section
→ expert_assignment
→ expert_patch
→ im_section_version
```

## 4.4 Gate Review

```text
im_project or im_section
→ gate_review
→ pass/revise/blocked
```

## 4.5 Export

```text
buyer_ready im_project
→ export_job
→ output_uri
```

---

## 5. Domain Invariants

These must always hold:

```text
- im_project must reference building_ssot_full.
- im_section must reference im_project.
- AI draft cannot be buyer_ready by default.
- buyer_ready project requires gate pass.
- export_job cannot be completed if required gate is blocked.
- protected fields cannot appear in lower-visibility outputs.
- expert_patch does not erase previous section version.
- golden_candidate requires redaction status and training rights.
- every important mutation emits activity_event.
```

---

## 6. Acceptance Criteria

The domain model is accepted when:

```text
- all core entities are defined.
- lifecycle from handoff to export is represented.
- expert workflow is first-class.
- gate review is first-class.
- evidence and source refs are represented.
- golden dataset pipeline has a domain object.
- AI-pair coding agents can implement DB/API from this model.
```
