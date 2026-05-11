# 29. Implementation Slices

## 1. Purpose

This document defines the sequential implementation slices for JS Full IM Studio.

Use single-lane execution. Do not implement multiple slices in parallel.

---

## 2. Global Implementation Rule

Every slice must follow:

```text
read docs
write tests first
implement minimum
run tests
verify demo path
emit activity events where required
avoid scope creep
```

---

# Slice 0. Project Foundation

## Goal

Create the project foundation.

## Build

```text
Next.js App Router
TypeScript strict mode
Tailwind CSS
shadcn/ui-compatible component structure
Supabase client wrappers
Zod setup
AI provider abstraction placeholder
test framework setup
basic app shell
role-aware navigation placeholder
```

## Acceptance

```text
app starts
typecheck passes
unit test smoke passes
Playwright smoke test passes
```

---

# Slice 1. Shared Contracts Integration

## Goal

Integrate `@js-ssot/contracts` or local contracts placeholder.

## Build

```text
contracts import path
schema validation helpers
enum usage
disclosure policy helpers
event names
forbidden claims helpers
```

## Acceptance

```text
schemas import correctly
contract tests pass
app does not define duplicate shadow schemas for shared objects
```

---

# Slice 2. MVP Handoff Import

## Goal

Import handoff payload from MVP.

## Build

```text
/import route
handoff preview
POST /api/im-projects/import-from-handoff
handoff_source_snapshot
building_ssot_full draft
im_project creation
activity events
```

## Acceptance

```text
valid token imports
invalid/expired token fails safely
protected fields not exposed in preview
source snapshot stored
MVP source not mutated
```

---

# Slice 3. Full B-SSoT Upgrade

## Goal

Upgrade Building SSoT Lite into Building SSoT Full.

## Build

```text
BSSoT upgrade service
B-SSoT editor page
layer navigation
missing data detection
source/evidence refs
protected field classification
```

## Acceptance

```text
Lite maps to Full
unknown fields become missing data
protected fields go into disclosure layer
B-SSoT page renders
```

---

# Slice 4. IM Readiness Engine

## Goal

Calculate readiness and recommend available outputs.

## Build

```text
readiness rules
POST /api/im-projects/:id/readiness-check
readiness dashboard card
missing data grouping
required expert patch recommendations
```

## Acceptance

```text
readiness score produced
available/blocked outputs shown
missing data shown by output type
readiness event recorded
```

---

# Slice 5. Full IM Section Planner

## Goal

Generate 18-section Full IM plan.

## Build

```text
section planner service
POST /api/im-projects/:id/generate-outline
im_sections creation
section list UI
status/confidence/risk badges
```

## Acceptance

```text
18 sections created
running twice does not duplicate
section list renders
im_outline_generated event recorded
```

---

# Slice 6. AI Section Draft

## Goal

Generate section drafts safely.

## Build

```text
AI provider mock
FullIMWriterAgent service
POST /api/im-sections/:id/generate-draft
RiskBoundary check
DisclosureGuard check
section versioning
ai_runs logging
```

## Acceptance

```text
draft generated
schema validation passes
section version created
unsafe output blocked/revised
ai_run recorded
```

---

# Slice 7. Section Editor

## Goal

Build professional section editing workspace.

## Build

```text
three-panel section editor
18-section navigation
editor modes
source/evidence/risk/disclosure panels
version history
rewrite buttons
status transition controls
```

## Acceptance

```text
section can be edited
version created on major change
risk/disclosure panel visible
invalid buyer-ready transition blocked
```

---

# Slice 8. Expert Workbench

## Goal

Allow experts to review assigned sections.

## Build

```text
expert profiles
expert assignments
assignment list
assignment detail
expert patch form
edit tags
visibility after review
training rights
submit patch API
```

## Acceptance

```text
expert sees assigned work only
patch can be submitted
edit_tags required
patch creates event
section status updates
```

---

# Slice 9. Gate Review Console

## Goal

Implement gate review and buyer-ready control.

## Build

```text
gate review service
gate review console
violation table
run gate review API
approve buyer-ready API
override with reason
export block check
```

## Acceptance

```text
P0 disclosure blocks buyer-ready
reviewer can approve when gates pass
broker cannot approve
override logged
events recorded
```

---

# Slice 10. Export System

## Goal

Generate export outputs.

## Build

```text
export preview screen
draft export
Markdown export
PDF export placeholder or implementation
Web IM preview
PPTX-ready outline
export_jobs
```

## Acceptance

```text
draft export includes draft label
buyer-ready export requires approval
disclaimer included
export job status tracked
```

---

# Slice 11. Deal Room Q&A Pack

## Goal

Generate Q&A starter pack and evidence index.

## Build

```text
Q&A generator
dealroom_qna_packs
dealroom_qna_items
Evidence Index view
dealroom payload JSON
```

## Acceptance

```text
Q&A pack generated
questions have answer_status
evidence linked
dealroom payload does not expose protected fields
```

---

# Slice 12. Golden Dataset Pipeline

## Goal

Create safe Golden Dataset candidates.

## Build

```text
candidate extraction from AI draft + expert patch
redaction service
training rights checks
admin review page
approve/reject actions
```

## Acceptance

```text
candidate cannot be approved without rights
candidate cannot be approved before redaction
protected fields removed
events recorded
```

---

# Slice 13. Admin / Analytics

## Goal

Build operational console.

## Build

```text
admin project list
expert management placeholder
gate review queue
golden candidate queue
analytics dashboard
activity event timeline
```

## Acceptance

```text
admin sees project pipeline
reviewer sees pending gate reviews
analytics show core events
non-admin blocked
```

---

# Slice 14. QA / E2E / Commercial Polish

## Goal

Stabilize for pilot-ready use.

## Build

```text
E2E tests
accessibility checks
responsive polish
empty/error states
loading states
README update
demo scenarios
```

## Acceptance

```text
regression passes
core demos work
no P0 disclosure issue
commercial readiness checklist mostly passes
```

---

## 16. Execution Order

```text
0 Foundation
1 Contracts
2 Handoff
3 B-SSoT Upgrade
4 Readiness
5 Section Planner
6 AI Draft
7 Section Editor
8 Expert Workbench
9 Gate Review
10 Export
11 Q&A Pack
12 Golden Dataset
13 Admin / Analytics
14 QA / Polish
```

---

## 17. Acceptance Criteria

Implementation slices are accepted when:

```text
- each slice is independently executable.
- each slice has acceptance criteria.
- order reduces integration risk.
- gate/disclosure/AI safety are implemented before export.
- QA and commercial polish are last.
```
