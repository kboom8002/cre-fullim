# 31. Single-lane Prompts

## 1. Purpose

This file is optimized for copy-pasting into Antigravity / Claude Sonnet.

Use one prompt at a time. Do not run prompts in parallel.

---

## GLOBAL PROMPT

```text
You are implementing JS Full IM Studio.

This is a separate professional workflow app that integrates with JS Building SSoT MVP through handoff payloads.

Follow the repo docs strictly.
Use @js-ssot/contracts where applicable.
Do not expand P0 scope.
Use TDD: write failing tests before implementation.
Implement one slice at a time.

Core workflow:
MVP handoff
→ Building SSoT Full
→ IM Project
→ IM Sections
→ AI Draft
→ Expert Patch
→ Gate Review
→ Export
→ Golden Dataset candidate.

Rules:
1. AI drafts are never buyer-ready by default.
2. Buyer-ready requires required gates to pass.
3. Protected fields must not leak.
4. Every important mutation emits activity_event.
5. Expert access is assignment-scoped.
6. Export is blocked when gates fail.
7. Golden candidates require rights, redaction, and approval.
8. Do not implement payment, full marketplace, public lead-gen, final valuation, legal/tax/loan judgment, or investment advice.

Work pattern:
Read docs → write tests → implement → run tests → verify demo → report changed files and issues.
```

---

## PROMPT 0 — Project Foundation

```text
Task: Slice 0 Project Foundation.

Read first:
- docs/00-product-brief.md
- docs/01-ai-pair-coding-guide.md
- docs/02-scope-and-boundaries.md
- docs/21-information-architecture.md
- docs/28-test-plan.md

Goal:
Create the foundation for JS Full IM Studio.

Write failing tests first:
- unit smoke test
- schema validation smoke test
- Playwright home route smoke test

Build:
- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui-compatible component folder
- Supabase client wrappers
- Zod setup
- AI provider abstraction placeholder
- app shell
- role-aware navigation placeholder
- basic routes:
  /
  /im-projects
  /im-projects/import
  /expert/assignments
  /admin

Acceptance:
- app starts
- npm run typecheck passes
- npm run test passes
- npm run test:e2e smoke passes
- no product feature implemented beyond shell
```

---

## PROMPT 1 — Shared Contracts Integration

```text
Task: Slice 1 Shared Contracts Integration.

Read first:
- packages/contracts-docs/00-contracts-overview.md
- packages/contracts-docs/01-building-ssot-contracts.md
- packages/contracts-docs/02-document-contracts.md
- packages/contracts-docs/03-gate-disclosure-contracts.md
- packages/contracts-docs/04-im-project-contracts.md
- packages/contracts-docs/05-expert-patch-contracts.md
- packages/contracts-docs/06-event-contracts.md
- packages/contracts-docs/07-forbidden-claims-and-safe-language.md

Goal:
Integrate shared contracts or local contracts placeholder.

Write failing tests first:
- BuildingSSoTFull fixture validates
- IMProject fixture validates
- IMSection fixture validates
- ExpertPatch fixture validates
- forbidden claim detector flags unsafe statement

Build:
- contracts import path
- schema validation helper
- event name helper
- disclosure helper placeholder
- forbidden claims helper
- sample fixtures

Acceptance:
- schemas validate fixtures
- invalid fixtures fail
- app does not create duplicate shadow schemas
```

---

## PROMPT 2 — MVP Handoff Import

```text
Task: Slice 2 MVP Handoff Import.

Read first:
- docs/05-integration-with-mvp.md
- docs/06-handoff-api-contract.md
- docs/07-import-from-bssot-lite.md
- docs/08-cross-app-auth-and-permission.md
- docs/09-cross-app-events.md

Goal:
Implement handoff token import flow.

Write failing tests first:
- valid token imports
- expired token fails
- invalid token fails
- preview does not expose protected fields
- import creates source snapshot, building_ssot_full, im_project

Build:
- /im-projects/import page
- safe handoff preview
- POST /api/im-projects/import-from-handoff
- handoff_source_snapshots table/service
- building_ssot_full draft creation
- im_project creation
- activity events

Acceptance:
- valid handoff creates project
- protected fields not exposed
- MVP source is not mutated
- errors are safe
```

---

## PROMPT 3 — Full B-SSoT Upgrade

```text
Task: Slice 3 Full B-SSoT Upgrade.

Read first:
- docs/10-domain-model.md
- docs/11-database-schema.md
- docs/14-storage-and-evidence.md
- docs/07-import-from-bssot-lite.md

Goal:
Create B-SSoT Lite to Full B-SSoT upgrade workflow.

Write failing tests first:
- area_signal maps to asset_identity.area_signal
- hidden_fields map to disclosure_gate.protected_fields
- unknown fields become missing_data
- source_refs preserved

Build:
- BSSoT upgrade service
- /im-projects/[id]/bssot page
- layer navigation
- missing data display
- evidence refs display
- protected field classification

Acceptance:
- Lite to Full mapping works
- missing data visible
- protected fields classified
- no invented facts
```

---

## PROMPT 4 — IM Readiness Engine

```text
Task: Slice 4 IM Readiness Engine.

Read first:
- docs/15-ai-agent-contracts.md
- docs/16-prompt-contracts.md
- docs/23-full-im-studio-dashboard.md
- docs/17-financial-analysis-guardrails.md

Goal:
Implement readiness scoring and output availability.

Write failing tests first:
- missing rent roll blocks buyer-ready
- missing operating expense affects NOI section
- readiness score maps to output availability
- required expert patches are recommended

Build:
- readiness rules service
- POST /api/im-projects/:id/readiness-check
- dashboard readiness card
- missing data card
- output availability matrix
- required expert patch card

Acceptance:
- readiness result shown
- missing data grouped
- blocked outputs shown
- im_readiness_checked event emitted
```

---

## PROMPT 5 — Full IM Section Planner

```text
Task: Slice 5 Full IM Section Planner.

Read first:
- docs/10-domain-model.md
- docs/12-api-contracts.md
- docs/24-section-editor-spec.md
- docs/16-prompt-contracts.md

Goal:
Create 18-section Full IM outline.

Write failing tests first:
- generate outline creates 18 sections
- section order is correct
- duplicate outline generation does not duplicate
- section statuses reflect readiness

Build:
- section planner service
- POST /api/im-projects/:id/generate-outline
- /im-projects/[id]/sections page
- section status table
- status/confidence/risk badges

Acceptance:
- 18 sections created
- section list renders
- event emitted
```

---

## PROMPT 6 — AI Section Draft

```text
Task: Slice 6 AI Section Draft.

Read first:
- docs/15-ai-agent-contracts.md
- docs/16-prompt-contracts.md
- docs/17-financial-analysis-guardrails.md
- docs/18-risk-boundary-policy.md
- docs/19-disclosure-guard-policy.md

Goal:
Generate safe AI draft for one IM section.

Write failing tests first:
- valid draft passes schema
- unsafe investment claim is blocked/revised
- exact address in blind output is blocked
- debt certainty statement is rewritten
- ai_run is recorded
- section version is created

Build:
- AI provider mock
- FullIMWriterAgent service
- RiskBoundary service
- DisclosureGuard service
- POST /api/im-sections/:id/generate-draft
- ai_runs logging
- im_section_versions

Acceptance:
- section draft generated safely
- guardrails run
- ai_run recorded
- version created
```

---

## PROMPT 7 — Section Editor

```text
Task: Slice 7 Section Editor.

Read first:
- docs/22-ui-ux-spec.md
- docs/24-section-editor-spec.md
- docs/13-status-transition.md

Goal:
Build professional three-panel Section Editor.

Write failing E2E tests first:
- open section editor
- navigate between sections
- edit markdown
- view source/evidence panel
- view risk/disclosure panel
- invalid buyer-ready transition blocked

Build:
- three-panel layout
- left 18-section nav
- center editor
- right tabs: SSoT, Evidence, Risk, Disclosure, Expert, History
- status controls
- version history display

Acceptance:
- section editing works
- panels work
- version history visible
- invalid transitions blocked
```

---

## PROMPT 8 — Expert Workbench

```text
Task: Slice 8 Expert Workbench.

Read first:
- docs/03-user-roles.md
- docs/25-expert-workbench-spec.md
- packages/contracts-docs/05-expert-patch-contracts.md

Goal:
Build expert assignment and patch workflow.

Write failing tests first:
- expert sees assigned section only
- expert cannot see unrelated section
- patch requires after_text and edit_tags
- patch submission creates expert_patch
- activity event emitted

Build:
- /expert/assignments
- /expert/assignments/[assignmentId]
- assignment list
- assignment detail
- patch form
- edit tags selector
- visibility_after_review
- training_rights

Acceptance:
- assignment-scoped access works
- patch submitted
- events recorded
```

---

## PROMPT 9 — Gate Review Console

```text
Task: Slice 9 Gate Review Console.

Read first:
- docs/26-gate-review-console-spec.md
- docs/13-status-transition.md
- docs/18-risk-boundary-policy.md
- docs/19-disclosure-guard-policy.md

Goal:
Implement gate review and buyer-ready approval control.

Write failing tests first:
- P0 disclosure blocks buyer-ready
- missing expert patch blocks buyer-ready
- broker cannot approve buyer-ready
- reviewer can approve after gates pass
- override requires reason

Build:
- gate review service
- /im-projects/[id]/gate-review
- gate cards
- violation table
- run gate review API
- approve buyer-ready API
- override with reason

Acceptance:
- gate review works
- buyer-ready guarded
- events recorded
```

---

## PROMPT 10 — Export System

```text
Task: Slice 10 Export System.

Read first:
- docs/27-export-preview-spec.md
- docs/12-api-contracts.md
- docs/13-status-transition.md

Goal:
Build export preview and export jobs.

Write failing tests first:
- draft export includes draft label
- buyer-ready export blocked before approval
- disclaimer required
- export job recorded
- PDF/Markdown output generated or placeholder completed

Build:
- /im-projects/[id]/export
- export eligibility card
- preview
- Markdown export
- PDF export placeholder or implementation
- PPTX-ready outline
- export_jobs

Acceptance:
- export guarded by status
- draft clearly labeled
- disclaimer included
```

---

## PROMPT 11 — Deal Room Q&A Pack

```text
Task: Slice 11 Deal Room Q&A Pack.

Read first:
- docs/15-ai-agent-contracts.md
- docs/27-export-preview-spec.md
- docs/14-storage-and-evidence.md

Goal:
Generate Q&A pack and evidence index.

Write failing tests first:
- Q&A pack has questions
- each question has answer_status
- required evidence is listed
- protected fields are not exposed
- dealroom payload respects visibility

Build:
- Q&A generator
- /im-projects/[id]/qna-pack
- dealroom_qna_packs
- dealroom_qna_items
- Evidence Index
- dealroom payload JSON

Acceptance:
- Q&A pack generated
- evidence linked
- payload safe
```

---

## PROMPT 12 — Golden Dataset Pipeline

```text
Task: Slice 12 Golden Dataset Pipeline.

Read first:
- docs/20-golden-dataset-extraction.md
- packages/contracts-docs/05-expert-patch-contracts.md
- docs/19-disclosure-guard-policy.md

Goal:
Create safe Golden Dataset candidate workflow.

Write failing tests first:
- candidate created from AI draft + expert patch
- cannot approve without training rights
- cannot approve before redaction
- exact address redacted
- tenant name redacted
- edit_tags required

Build:
- candidate extraction service
- redaction service
- /admin/golden-candidates
- approve/reject actions
- events

Acceptance:
- candidates safe
- approval guarded
- events recorded
```

---

## PROMPT 13 — Admin / Analytics

```text
Task: Slice 13 Admin / Analytics.

Read first:
- docs/09-cross-app-events.md
- docs/21-information-architecture.md
- docs/23-full-im-studio-dashboard.md

Goal:
Build admin and analytics console.

Write failing tests first:
- admin sees all projects
- reviewer sees gate queue
- non-admin blocked
- analytics show core events
- safety events visible

Build:
- /admin
- /admin/projects
- /admin/experts
- /admin/golden-candidates
- /admin/analytics
- /reviewer/gate-reviews
- event counts
- recent activity

Acceptance:
- role-based access works
- analytics visible
```

---

## PROMPT 14 — QA / Commercial Polish

```text
Task: Slice 14 QA / Commercial Polish.

Read first:
- docs/28-test-plan.md
- docs/33-demo-scenarios.md
- docs/34-commercial-readiness-checklist.md
- docs/22-ui-ux-spec.md

Goal:
Make the app pilot-ready.

Write failing tests first:
- handoff to export happy path
- expert patch happy path
- gate blocks unsafe output
- export includes disclaimer
- accessibility critical issues = 0 on P0 screens

Build:
- loading states
- empty states
- error states
- responsive polish
- README
- demo fixtures
- regression scripts

Acceptance:
- core demos pass
- regression passes
- commercial readiness checklist passes
```
