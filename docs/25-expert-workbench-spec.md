# 25. Expert Workbench Spec

## 1. Purpose

The Expert Workbench allows external or internal experts to review assigned sections and submit structured patches.

Experts should not need to understand the entire platform. They should see:

```text
what they need to review
why it matters
the AI draft
the relevant evidence
the risk/disclosure context
the patch input form
```

---

## 2. Routes

```text
/expert
/expert/assignments
/expert/assignments/[assignmentId]
```

---

## 3. Expert Assignment List

### Content

Each assignment card shows:

```text
project title
section title
expert role
assignment type
priority
status
due date
risk level
short instruction
```

### Filters

```text
assigned
in_review
submitted
revision_requested
approved
due_soon
high_priority
```

### Primary CTA

```text
[검토 시작]
```

---

## 4. Expert Workbench Layout

### Desktop Layout

```text
Top Bar:
- assignment status
- section title
- expert role
- due date
- submit button

Left Panel:
- AI draft / current section
- highlighted risky parts
- before text

Right Panel:
- relevant B-SSoT facts
- linked evidence
- reviewer/broker instructions
- risk/disclosure notes

Bottom Panel:
- expert patch editor
- edit tags
- visibility after review
- training rights
- submit patch
```

---

## 5. Assignment Context

The expert must see:

```text
why this section was assigned
what type of review is expected
what output the project targets
what gate is blocking progress
what evidence is available
what evidence is missing
```

Example:

```text
검토 요청 사유:
NOI와 Cap Rate 표현에 운영비 가정이 부족합니다.
매수자 공유 전 수익성 표현의 안전성과 정확성을 검토해주세요.
```

---

## 6. Expert Patch Form

Required fields:

```text
patch_type
after_text
edit_tags
visibility_after_review
training_rights
rationale
requires_additional_review
```

Optional:

```text
before_text
suggested_missing_evidence
reviewer_note
```

### Patch Types

```text
fact_correction
risk_balance
overclaim_removal
financial_assumption_fix
legal_boundary_fix
tax_boundary_fix
valuation_logic_fix
lease_quality_note
building_condition_note
market_context_addition
disclosure_redaction
buyer_message_improvement
style_edit
other
```

### Edit Tags

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

## 7. Visibility After Review

Expert selects one:

```text
internal_only
gate_restricted
buyer_ready
blocked
```

Guidance:

```text
internal_only: useful internally, not for buyer
gate_restricted: can be shared after gate
buyer_ready: suitable for buyer-facing IM after reviewer approval
blocked: should not be used externally
```

Expert selection does not equal final approval.

---

## 8. Training Rights

Expert must select one:

```text
not_allowed
allowed_anonymized
allowed_internal_eval_only
allowed_golden_dataset
```

Default:

```text
not_allowed
```

UI copy:

```text
이 수정 내용은 기본적으로 AI 학습에 사용되지 않습니다.
비식별 처리 후 내부 품질 개선에 사용할 수 있는지 선택해주세요.
```

---

## 9. Evidence Panel

Expert can view only assignment-scoped evidence.

Evidence item shows:

```text
title
type
review status
visibility
linked section
download/view permission
```

If evidence is restricted:

```text
이 자료는 현재 권한으로 원문 열람이 제한되어 있습니다.
요약 정보만 표시됩니다.
```

---

## 10. Risk / Disclosure Panel

Shows issues detected before expert review:

```text
forbidden claims
missing assumptions
protected fields
financial consistency issues
legal/tax boundary issues
```

Expert can mark:

```text
resolved
needs reviewer
needs owner/broker answer
additional evidence needed
```

---

## 11. Submit Flow

```text
fill patch
select edit tags
select visibility
select training rights
submit
→ validation
→ create expert_patch
→ update assignment status
→ create activity_event
→ optionally create golden candidate
```

Validation:

```text
after_text required
edit_tags required
visibility required
training_rights required
rationale recommended for high-risk patch
```

---

## 12. Revision Request Flow

Reviewer can request revision.

Expert sees:

```text
revision note
required changes
previous patch
reopen editor
```

---

## 13. Expert UX Principles

```text
assignment-scoped
minimal context but enough evidence
structured patch not freeform only
safe visibility decision
training rights explicit
```

---

## 14. Acceptance Criteria

Expert Workbench is accepted when:

```text
- expert can see assigned work only.
- AI draft and relevant evidence are visible.
- expert can submit structured patch.
- edit tags are required.
- visibility and training rights are captured.
- patch submission creates activity_event.
- expert cannot approve buyer-ready final output.
```
