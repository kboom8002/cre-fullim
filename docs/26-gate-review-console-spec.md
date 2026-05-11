# 26. Gate Review Console Spec

## 1. Purpose

The Gate Review Console allows reviewers/admins to decide whether a Full IM project or section can move toward buyer-ready output.

AI can assist gate review, but only reviewer/admin can approve buyer-ready status.

---

## 2. Route

```text
/im-projects/[projectId]/gate-review
/reviewer/gate-reviews
/reviewer/gate-reviews/[reviewId]
```

---

## 3. Gate Types

```text
Data Gate
Disclosure Gate
Risk Gate
Financial Consistency Gate
Expert Scope Gate
Design Quality Gate
Training Rights Gate
Buyer-ready Approval Gate
```

---

## 4. Gate Review Overview

The main console should show:

```text
project status
target output
readiness score
section progress
gate cards
blocking issues
required actions
buyer-ready eligibility
```

Gate card statuses:

```text
not_run
pass
revise
expert_required
blocked
internal_only
```

---

## 5. Gate Card Design

Each gate card shows:

```text
gate type
status
last run
reviewer
violation count
severity summary
CTA
```

CTA examples:

```text
[Run Gate]
[Review Issues]
[Assign Fix]
[Mark Resolved]
[Override with Reason]
```

---

## 6. Data Gate

Checks:

```text
required fields present
source_refs present
evidence_refs linked
missing data labeled
unverified facts marked
```

Common violations:

```text
missing rent roll
missing operating expense assumption
missing registry evidence
section claim without source_ref
```

---

## 7. Disclosure Gate

Checks:

```text
exact address exposure
tenant name exposure
unit rent exposure
seller motivation exposure
negotiation memo exposure
owner/buyer contact exposure
evidence visibility
```

P0 violations must block external sharing.

---

## 8. Risk Gate

Checks:

```text
investment recommendation
valuation certainty
loan certainty
legal/tax certainty
value-add overclaim
yield guarantee
```

Each issue shows:

```text
original text
issue type
severity
suggested rewrite
apply action
```

---

## 9. Financial Consistency Gate

Checks:

```text
rent totals
vacancy treatment
operating expense assumptions
NOI formula
Cap Rate formula
debt sensitivity assumptions
unit/currency consistency
```

Blocks buyer-ready if:

```text
NOI used without assumptions
debt sensitivity lacks disclaimer
valuation logic overclaims price
```

---

## 10. Expert Scope Gate

Checks:

```text
sections requiring expert patch
assignment completion
expert role suitability
visibility_after_review
additional review needed
```

Blocks buyer-ready if:

```text
required expert patch missing
expert patch says blocked
additional review required
```

---

## 11. Design Quality Gate

Checks:

```text
cover present
disclaimer present
section order complete
tables readable
missing data not hidden
draft labels removed only after approval
contact page present
```

---

## 12. Training Rights Gate

Checks:

```text
golden candidates not auto-approved
training rights explicit
redaction status valid
expert permission captured
```

This gate is not required for buyer-ready output, but required for dataset approval.

---

## 13. Buyer-ready Approval Gate

Final reviewer/admin approval.

Required:

```text
Data Gate pass
Disclosure Gate pass
Risk Gate pass
Financial Consistency Gate pass or documented override
Expert Scope Gate pass or documented override
Design Quality Gate pass
Disclaimer present
No P0 violations
```

---

## 14. Violation Table

Columns:

```text
gate
section
severity
issue
recommended action
assigned to
status
```

Actions:

```text
open section
apply safe rewrite
request expert patch
request evidence
mark resolved
override with reason
block export
```

---

## 15. Override Policy

Reviewer override requires:

```text
reason
reviewer id
timestamp
affected gate
affected section
risk acknowledgement
```

P0 disclosure issues cannot be overridden for external sharing.

---

## 16. Activity Events

Required events:

```text
gate_review_started
gate_review_completed
gate_violation_created
gate_violation_resolved
buyer_ready_approved
buyer_ready_blocked
export_blocked_by_gate
reviewer_override_created
```

---

## 17. UX Copy

### Blocked

```text
Buyer-ready 승인이 차단되었습니다.
아래 P0 또는 High 이슈를 먼저 해결해야 합니다.
```

### Revise

```text
일부 섹션의 수정이 필요합니다.
수정 후 Gate Review를 다시 실행하세요.
```

### Pass

```text
이 Gate는 통과되었습니다.
다음 Gate 또는 Buyer-ready 승인 단계로 이동할 수 있습니다.
```

---

## 18. Acceptance Criteria

Gate Review Console is accepted when:

```text
- all required gates are visible.
- violations are section-linked.
- P0 disclosure issues block external sharing.
- buyer-ready approval requires gates.
- reviewer override is logged.
- export can be blocked by gate status.
- activity events are emitted.
```
