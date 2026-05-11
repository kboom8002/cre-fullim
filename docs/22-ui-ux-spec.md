# 22. UI/UX Spec

## 1. Purpose

This document defines the UI/UX principles and interaction patterns for **JS Full IM Studio**.

Full IM Studio must feel like a professional production tool for commercial real estate IM work.

---

## 2. UX Positioning

JS Full IM Studio is:

```text
- professional
- evidence-aware
- risk-balanced
- expert-collaborative
- gate-controlled
- export-ready
```

It is not:

```text
- a casual chatbot
- a simple brochure template
- a generic document editor
- a public lead-gen page
```

---

## 3. Core UX Loop

```text
Import / Create Project
→ Check Readiness
→ Fill B-SSoT / Evidence
→ Generate Section Plan
→ Draft Section
→ Patch with Expert
→ Gate Review
→ Export
```

Every screen should answer:

```text
Where am I?
What is the current status?
What is missing?
What can I do next?
What is blocked?
What is safe to share?
```

---

## 4. Layout Philosophy

### 4.1 Desktop-first Professional Workspace

Primary users will do serious work on desktop.

Recommended breakpoint behavior:

```text
desktop: multi-pane workspace
tablet: two-pane workspace
mobile: review/approval mode, not full production
```

### 4.2 Three-panel Pattern

Used in Section Editor and Expert Workbench:

```text
Left: navigation/context
Center: work surface
Right: evidence/risk/disclosure/source panel
```

### 4.3 Status-first Design

Every major object should show badges:

```text
AI 초안
자료 부족
전문가 검토 필요
Gate 검토 필요
민감정보 포함
Buyer-ready
Blocked
```

---

## 5. Design System

## 5.1 Tone

```text
professional
calm
trustworthy
not flashy
not salesy
```

## 5.2 Visual Language

```text
clean panels
dense but readable tables
status badges
evidence chips
risk indicators
right-side inspector
version history timeline
```

## 5.3 Suggested UI Components

```text
ProjectCard
ReadinessScoreCard
MissingDataList
OutputAvailabilityMatrix
SectionStatusTable
SectionEditor
EvidencePanel
RiskPanel
DisclosurePanel
ExpertPatchForm
GateReviewCard
ExportPreviewFrame
ActivityTimeline
```

---

## 6. Status Badges

### Document / Section

```text
AI 초안
편집 중
자료 부족
전문가 검토 필요
전문가 반영
Gate 검토 중
Buyer-ready
Blocked
```

### Risk

```text
Low Risk
Medium Risk
High Risk
Blocked
```

### Disclosure

```text
Public-safe
Blind-safe
Gate Required
Internal Only
Private Truth
Blocked
```

### Evidence

```text
Uploaded
Parsed
Reviewed
Needs Redaction
Buyer-ready
Blocked
```

---

## 7. UX Writing Rules

## 7.1 Preferred Language

Use:

```text
확인 필요
예비 검토
가정 기반
전문가 검토 필요
Gate 통과 필요
Buyer-ready 후보
자료 부족
민감정보 포함
```

Avoid:

```text
확정
보장
추천
문제 없음
대출 가능
세금상 유리
저평가
수익률 보장
```

---

## 7.2 Example Microcopy

### Readiness

```text
현재 자료로는 IM Lite 초안까지 생성할 수 있습니다.
Buyer-ready Full IM을 위해서는 임대차 만기, 운영비, 수선 이력 확인이 필요합니다.
```

### Expert Patch

```text
이 섹션은 수익성 표현이 포함되어 전문가 검토가 권장됩니다.
```

### Gate Review

```text
외부 공유 전 민감정보와 단정 표현을 확인해야 합니다.
```

### Export

```text
현재 문서는 Draft 상태입니다. Buyer-ready 출력은 Gate Review 통과 후 가능합니다.
```

---

## 8. Interaction Patterns

## 8.1 Generate AI Draft

Flow:

```text
click Generate Draft
→ show source/evidence summary
→ confirm target style
→ run AI
→ show result with status = AI Draft
→ show missing data and guardrail issues
```

## 8.2 Request Expert Patch

Flow:

```text
select section
→ click Request Expert Patch
→ choose expert role
→ add instruction
→ create assignment
→ show assignment status
```

## 8.3 Run Gate Review

Flow:

```text
select gates
→ run review
→ show pass/revise/blocked
→ list violations and required actions
→ assign fixes
```

## 8.4 Export

Flow:

```text
select export type
→ check gate status
→ show draft/buyer-ready warning
→ generate export job
→ show download/view link
```

---

## 9. Empty States

### No Project

```text
아직 Full IM 프로젝트가 없습니다.
MVP에서 가져오거나 새 프로젝트를 시작하세요.
```

### No Evidence

```text
아직 근거자료가 없습니다.
Full IM의 신뢰도를 높이려면 공부자료, 임대차 요약, 사진을 추가하세요.
```

### No Expert Assignment

```text
아직 전문가 검토 요청이 없습니다.
리스크가 높은 섹션에서 전문가 Patch를 요청할 수 있습니다.
```

---

## 10. Error States

### Gate Blocked

```text
현재 문서는 Buyer-ready로 승인할 수 없습니다.
아래 이슈를 먼저 수정해주세요.
```

### AI Failure

```text
AI 초안 생성에 실패했습니다.
입력자료 또는 프롬프트 버전을 확인한 후 다시 시도하세요.
```

### Permission Denied

```text
이 프로젝트에 접근 권한이 없습니다.
관리자 또는 프로젝트 담당자에게 문의하세요.
```

### Disclosure Violation

```text
민감정보가 포함되어 외부 공유가 차단되었습니다.
```

---

## 11. Accessibility

Minimum requirements:

```text
keyboard navigable
buttons have labels
forms have labels
status changes announced where possible
color is not the only status indicator
contrast sufficient for professional documents
```

---

## 12. Commercial UX Quality Bar

The user should feel:

```text
I know exactly what is missing.
I can trust the system not to expose sensitive info.
I can see where expert review is needed.
I can produce a professional document step by step.
```

---

## 13. Acceptance Criteria

UI/UX spec is accepted when:

```text
- desktop-first professional workflow is defined.
- three-panel production pattern is defined.
- status/risk/disclosure badges are standardized.
- UX writing avoids unsafe claims.
- key interactions have flows.
- empty/error states are defined.
```
