# 23. Full IM Studio Dashboard

## 1. Purpose

The Project Dashboard is the command center for one Full IM project.

It should show:

```text
project status
readiness score
available outputs
blocked outputs
missing data
required expert patches
gate status
recent activity
next best action
```

---

## 2. Route

```text
/im-projects/[projectId]
```

---

## 3. Primary User Questions

The dashboard should answer:

```text
1. What stage is this project in?
2. Can we generate an IM now?
3. What is missing?
4. Which sections need expert review?
5. Can this become buyer-ready?
6. What should I do next?
```

---

## 4. Layout

### Desktop

```text
Top: project header + status + actions
Left main: readiness, outputs, missing data
Right sidebar: gate status, expert tasks, recent activity
Bottom: section progress and evidence summary
```

### Tablet

```text
stacked cards with sticky action bar
```

### Mobile

```text
review-only mode
key status + next action + alerts
```

---

## 5. Project Header

Must show:

```text
project title
asset display name or disclosure name
project_type
target_output
status badge
last updated
created by
```

Primary actions:

```text
[Run Readiness]
[Generate Outline]
[Open Sections]
[Request Expert Patch]
[Run Gate Review]
[Export]
```

Actions must be state-aware.

---

## 6. Readiness Score Card

### Content

```text
Readiness Score: 78/100
Status: Full IM Draft 가능 / Buyer-ready 전 추가 검토 필요
```

### Score Bands

```text
0~30: Teaser only
31~50: External Snapshot candidate
51~70: IM Lite candidate
71~85: Full IM Draft candidate
86~100: Buyer-ready candidate after gate review
```

### UX Copy

```text
현재 자료로는 Full IM 초안 작성이 가능합니다.
Buyer-ready 출력을 위해서는 임대차·운영비·수선 이력 확인과 전문가 검토가 필요합니다.
```

---

## 7. Output Availability Matrix

| Output | Status | Reason |
|---|---|---|
| Blind Teaser | Available | public-safe signal 있음 |
| External Snapshot | Available | 기본 정보 충분 |
| IM Lite | Available | 핵심 자료 일부 존재 |
| Full IM Draft | Conditional | 일부 섹션 자료 부족 |
| Buyer-ready Full IM | Blocked | Gate / Expert Patch 필요 |
| Deal Room Package | Blocked | Evidence Index 미완성 |

---

## 8. Missing Data Card

Group missing data by output requirement:

```text
Required for IM Lite
Required for Full IM Draft
Required for Buyer-ready
Optional Enrichment
```

Each item should show:

```text
missing item
why it matters
linked section
recommended action
```

Example:

```text
운영비 내역
- 영향: NOI / Cap Rate 해석 정확도
- 관련 섹션: Income, NOI & Yield Analysis
- 권장 조치: 최근 12개월 운영비 또는 관리비 구조 입력
```

---

## 9. Required Expert Patch Card

Shows:

```text
section
expert role
reason
priority
status
CTA
```

Example:

```text
Income, NOI & Yield Analysis
Expert: CRE Consultant
Reason: 운영비 가정과 NOI 표현 검토 필요
Priority: High
[전문가 검토 요청]
```

---

## 10. Gate Status Card

Gate list:

```text
Data Gate
Disclosure Gate
Risk Gate
Financial Consistency Gate
Expert Scope Gate
Design Quality Gate
Buyer-ready Approval Gate
```

Status:

```text
not_run
pass
revise
expert_required
blocked
```

If blocked:

```text
Buyer-ready 출력이 차단되었습니다.
먼저 Gate Review 이슈를 해결하세요.
```

---

## 11. Section Progress Summary

Show 18-section progress:

```text
planned: 18
ai_draft: 6
needs_data: 4
needs_expert_patch: 3
buyer_ready: 0
blocked: 1
```

UI:

```text
progress bar
section status table preview
[Open Section Planner]
```

---

## 12. Evidence Summary

Show:

```text
uploaded files count
reviewed files count
needs redaction count
buyer-ready evidence count
blocked evidence count
```

CTA:

```text
[Evidence 관리]
```

---

## 13. Recent Activity

Show events:

```text
handoff_imported
im_readiness_checked
im_outline_generated
im_section_draft_generated
expert_patch_requested
gate_review_completed
```

Do not show protected raw values.

---

## 14. Next Best Action Logic

Examples:

| Condition | Next Action |
|---|---|
| no readiness | Run Readiness |
| readiness done but no outline | Generate Outline |
| outline exists but no drafts | Generate Core Section Drafts |
| high-risk sections | Request Expert Patch |
| drafts complete | Run Gate Review |
| gate passed | Export |
| gate blocked | Fix Required Actions |

---

## 15. Acceptance Criteria

Dashboard is accepted when:

```text
- user can understand project state within 10 seconds.
- readiness, missing data, expert needs, gate status are visible.
- next best action is clear.
- risky/buyer-ready states are not hidden.
- dashboard supports broker/editor/reviewer workflows.
```
