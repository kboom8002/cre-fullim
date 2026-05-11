# 33. Demo Scenarios

## 1. Purpose

This document defines demo scenarios for JS Full IM Studio.

Each demo should be testable and useful for product validation.

---

# Demo A. MVP Handoff Import

## Given

```text
MVP has Building SSoT Lite and Blind Teaser.
User clicks “Full IM 제작 가능 여부 확인”.
```

## When

```text
Full IM Studio receives handoff token.
```

## Then

```text
safe preview appears
user confirms import
building_ssot_full is created
im_project is created
dashboard opens
```

## Expected Events

```text
handoff_import_started
handoff_imported
bssot_full_created
im_project_created
```

---

# Demo B. IM Readiness Check

## Given

```text
Imported project exists.
```

## When

```text
User clicks Run Readiness.
```

## Then

```text
readiness score appears
available outputs appear
blocked outputs appear
missing data appears
required expert patches appear
```

## Expected Events

```text
im_readiness_checked
```

---

# Demo C. 18-section Outline

## Given

```text
Readiness check completed.
```

## When

```text
User clicks Generate Outline.
```

## Then

```text
18 Full IM sections are created in correct order.
Section statuses reflect missing data and expert requirements.
```

## Expected Events

```text
im_outline_generated
```

---

# Demo D. AI Section Draft

## Given

```text
Section planner completed.
Executive Summary section exists.
```

## When

```text
User clicks Generate AI Draft.
```

## Then

```text
section draft appears
status is ai_draft
source refs are shown
missing data is shown
risk/disclosure panel is updated
```

## Expected Events

```text
im_section_draft_generated
```

---

# Demo E. Financial Guardrail

## Given

```text
NOI section draft contains “대출 가능합니다” or “수익률 보장”.
```

## When

```text
Risk/Financial guardrail runs.
```

## Then

```text
unsafe claim is blocked or rewritten
financial consistency issue is shown
buyer-ready approval is blocked
```

## Expected Events

```text
forbidden_claim_blocked
financial_consistency_issue_detected
```

---

# Demo F. Expert Patch

## Given

```text
NOI section requires CRE consultant review.
```

## When

```text
Broker requests Expert Patch.
Expert opens assignment and submits patch.
```

## Then

```text
expert_patch is created
edit_tags are stored
section status changes to patched or needs review
```

## Expected Events

```text
expert_patch_requested
expert_assignment_created
expert_patch_submitted
```

---

# Demo G. Disclosure Gate

## Given

```text
Draft contains tenant name in buyer-facing output.
```

## When

```text
Disclosure Gate runs.
```

## Then

```text
P0 violation appears
buyer-ready approval is blocked
recommended redaction is shown
```

## Expected Events

```text
disclosure_violation_blocked
gate_review_completed
buyer_ready_blocked
```

---

# Demo H. Buyer-ready Approval

## Given

```text
All required gates pass.
Required expert patches completed.
Disclaimer included.
```

## When

```text
Reviewer clicks Approve Buyer-ready.
```

## Then

```text
project status becomes buyer_ready
export becomes available
```

## Expected Events

```text
buyer_ready_approved
```

---

# Demo I. Export

## Given

```text
Project is buyer_ready.
```

## When

```text
User exports Markdown/PDF/Web IM.
```

## Then

```text
export job created
output generated
disclaimer included
export status completed
```

## Expected Events

```text
im_export_requested
im_exported
```

---

# Demo J. Golden Dataset Candidate

## Given

```text
AI draft exists.
Expert patch exists.
Training rights allowed_anonymized.
```

## When

```text
System creates candidate and redacts protected fields.
Reviewer approves.
```

## Then

```text
golden candidate status becomes approved
protected fields removed
```

## Expected Events

```text
golden_candidate_created
golden_candidate_redacted
golden_candidate_approved
```

---

## 11. Acceptance Criteria

Demo scenarios are accepted when:

```text
- each P0 workflow has a scenario.
- each scenario has Given/When/Then.
- expected events are listed.
- scenarios can become Playwright or API tests.
```
