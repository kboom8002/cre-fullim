# 21. Information Architecture

## 1. Purpose

This document defines the information architecture for **JS Full IM Studio**.

Full IM Studio is a professional workspace, not a lightweight public app. It must support desktop-first professional production while remaining usable on tablet and large mobile screens for review tasks.

---

## 2. IA Principles

```text
1. Project is the primary workspace.
2. Building SSoT Full is the truth layer.
3. Sections are the production layer.
4. Expert Workbench is assignment-scoped.
5. Gate Review controls buyer-ready status.
6. Export is allowed only by project state and gate state.
7. Golden Dataset review is admin/reviewer scoped.
```

---

## 3. Top-level Route Map

```text
/
 /im-projects
 /im-projects/new
 /im-projects/import
 /im-projects/[projectId]
 /im-projects/[projectId]/readiness
 /im-projects/[projectId]/bssot
 /im-projects/[projectId]/sections
 /im-projects/[projectId]/sections/[sectionId]
 /im-projects/[projectId]/expert
 /im-projects/[projectId]/gate-review
 /im-projects/[projectId]/export
 /im-projects/[projectId]/qna-pack
 /im-projects/[projectId]/evidence
 /expert
 /expert/assignments
 /expert/assignments/[assignmentId]
 /reviewer
 /reviewer/gate-reviews
 /reviewer/gate-reviews/[reviewId]
 /admin
 /admin/projects
 /admin/experts
 /admin/golden-candidates
 /admin/analytics
```

---

## 4. Primary Navigation Groups

### 4.1 Project Work

```text
Projects
Import from MVP
New Project
Recent Projects
```

### 4.2 Production

```text
Dashboard
B-SSoT
Readiness
Sections
Evidence
Expert Patches
Gate Review
Export
```

### 4.3 Expert

```text
My Assignments
Submitted Patches
Revision Requests
```

### 4.4 Review

```text
Pending Gate Reviews
Buyer-ready Approvals
Blocked Exports
Disclosure Issues
```

### 4.5 Admin

```text
Projects
Users/Roles
Experts
Analytics
Golden Candidates
Prompt Versions
```

---

## 5. Route Details

## 5.1 `/`

### Purpose

Landing screen for authenticated users.

### Primary Actions

```text
[Import from MVP Handoff]
[Create Full IM Project]
[Open Recent Project]
```

### Redirect Rules

```text
admin → /admin
expert → /expert/assignments
reviewer → /reviewer/gate-reviews
broker/editor → /im-projects
```

---

## 5.2 `/im-projects`

### Purpose

Project list and production queue.

### Content

```text
project cards
status
readiness score
target output
last updated
blocking issues
next action
```

### Filters

```text
status
project_type
target_output
readiness_score
assigned_to_me
blocked
buyer_ready
```

---

## 5.3 `/im-projects/import`

### Purpose

Import a project from MVP handoff token.

### States

```text
token_preview
auth_required
permission_checking
importing
import_success
import_failed
```

### Primary CTA

```text
[이 자료로 Full IM 프로젝트 만들기]
```

---

## 5.4 `/im-projects/[projectId]`

### Purpose

Project dashboard.

### Sections

```text
IM Readiness Score
Next Action
Project Status
Available Outputs
Blocked Outputs
Missing Data
Required Expert Patches
Gate Status
Recent Activity
```

---

## 5.5 `/im-projects/[projectId]/bssot`

### Purpose

Full Building SSoT editor and evidence-linked truth layer.

### Layout

```text
left: B-SSoT layer navigation
center: selected layer fields
right: evidence/source/confidence panel
```

---

## 5.6 `/im-projects/[projectId]/readiness`

### Purpose

Readiness analysis and missing data workflow.

### Content

```text
readiness score
available outputs
blocked outputs
missing data by output type
required expert patches
recommended next action
```

---

## 5.7 `/im-projects/[projectId]/sections`

### Purpose

18-section Full IM plan.

### Content

```text
section list
section status
confidence
risk level
expert requirement
missing data
```

### Primary CTA

```text
[AI 초안 생성]
[전문가 검토 요청]
[Gate Review로 이동]
```

---

## 5.8 `/im-projects/[projectId]/sections/[sectionId]`

### Purpose

Section Editor.

### Layout

```text
left rail: 18-section table of contents
center: section editor
right rail: source/evidence/risk/disclosure/expert panel
```

---

## 5.9 `/expert/assignments`

### Purpose

Expert's assignment queue.

### Content

```text
assigned sections
due dates
expert role
status
risk level
project context preview
```

---

## 5.10 `/expert/assignments/[assignmentId]`

### Purpose

Expert Workbench for one assignment.

### Layout

```text
top: assignment context
left: AI draft / current section
right: evidence / B-SSoT / risk notes
bottom: expert patch form
```

---

## 5.11 `/im-projects/[projectId]/gate-review`

### Purpose

Gate Review Console.

### Gates

```text
Data Gate
Disclosure Gate
Risk Gate
Financial Consistency Gate
Expert Scope Gate
Design Quality Gate
Buyer-ready Approval Gate
```

---

## 5.12 `/im-projects/[projectId]/export`

### Purpose

Export preview and output generation.

### Export Types

```text
Web IM
Markdown
PDF
PPTX-ready
Deal Room payload
```

### Guard

```text
buyer-ready export requires gate pass
draft export requires draft watermark and disclaimer
```

---

## 5.13 `/admin/golden-candidates`

### Purpose

Review Golden Dataset candidates.

### Content

```text
AI draft
expert revision
edit tags
redaction status
training rights
review status
approve/reject
```

---

## 6. Status-driven Navigation

Project status should determine next action.

| Project Status | Recommended Next Page |
|---|---|
| intake | `/im-projects/import` or `/bssot` |
| ssot_building | `/bssot` |
| readiness_checked | `/readiness` |
| outline_generated | `/sections` |
| ai_draft | `/sections/[sectionId]` |
| expert_patch | `/expert` or `/sections` |
| gate_review | `/gate-review` |
| client_review | `/gate-review` |
| buyer_ready | `/export` |
| exported | `/export` |
| dealroom_published | `/qna-pack` |
| blocked | `/gate-review` |

---

## 7. Role-based Navigation

### Owner

```text
Dashboard
Missing Data
Evidence Upload
Approved Outputs
Expert Request
```

### Broker

```text
Projects
B-SSoT
Readiness
Sections
Expert Request
Gate Review Status
Export Request
```

### IM Editor

```text
Projects
Sections
Evidence
Patch Requests
Gate Issues
```

### Expert

```text
My Assignments
Submitted Patches
Revision Requests
```

### Reviewer

```text
Gate Reviews
Buyer-ready Approvals
Blocked Exports
```

### Admin

```text
All Projects
Users
Experts
Analytics
Golden Candidates
Prompt Versions
```

---

## 8. Information Density

Full IM Studio can use denser UI than MVP, but every screen must have:

```text
clear status
clear next action
visible risk/disclosure state
source/evidence access
activity trail where useful
```

---

## 9. Acceptance Criteria

Information architecture is accepted when:

```text
- routes cover all P0 workflows.
- project is the primary workspace.
- expert work is assignment-scoped.
- gate review and export are distinct.
- role-based navigation is clear.
- project status drives next actions.
```
