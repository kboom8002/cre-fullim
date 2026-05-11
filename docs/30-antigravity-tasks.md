# 30. Antigravity Tasks

## 1. Purpose

This document defines task-level instructions for Antigravity or another AI-pair coding agent.

Each task corresponds to one implementation slice.

---

## 2. Global Instructions for Antigravity

```text
You are implementing JS Full IM Studio.

Follow /docs strictly.
Use @js-ssot/contracts where applicable.
Do not expand P0 scope.
Write tests before implementation.
Implement one slice at a time.
Do not proceed to the next slice until acceptance criteria pass.

Core workflow:
handoff → Building SSoT Full → IM Project → IM Sections → AI Draft → Expert Patch → Gate Review → Export → Golden Dataset candidate.

Non-negotiable:
- AI draft is never buyer-ready by default.
- Buyer-ready requires gate approval.
- Protected fields must not leak.
- Every major mutation emits activity_event.
- Expert access is assignment-scoped.
```

---

# Task 0. Project Foundation

Read first:

```text
docs/00-product-brief.md
docs/01-ai-pair-coding-guide.md
docs/02-scope-and-boundaries.md
docs/21-information-architecture.md
docs/28-test-plan.md
```

Build:

```text
Next.js app
TypeScript
Tailwind
component structure
Supabase clients
test setup
app shell
auth placeholder
basic routes
```

Acceptance:

```text
app starts
typecheck passes
unit smoke passes
e2e smoke passes
```

---

# Task 1. Shared Contracts Integration

Read first:

```text
packages/contracts-docs/*
docs/01-ai-pair-coding-guide.md
```

Build:

```text
contracts package import
schema validation helpers
event name usage
disclosure helper usage
forbidden claims helper usage
```

Acceptance:

```text
shared schemas validate fixtures
no duplicate shadow schemas
```

---

# Task 2. MVP Handoff Import

Read first:

```text
docs/05-integration-with-mvp.md
docs/06-handoff-api-contract.md
docs/07-import-from-bssot-lite.md
docs/08-cross-app-auth-and-permission.md
```

Build:

```text
/import page
handoff preview
import API
source snapshot
B-SSoT Full draft creation
IM Project creation
activity events
```

Acceptance:

```text
valid token imports
invalid token fails
preview is safe
project created
```

---

# Task 3. Full B-SSoT Upgrade

Read first:

```text
docs/10-domain-model.md
docs/11-database-schema.md
docs/14-storage-and-evidence.md
```

Build:

```text
B-SSoT upgrade service
B-SSoT page
missing data detection
evidence refs
protected field classification
```

Acceptance:

```text
Lite to Full mapping works
missing data shown
protected fields classified
```

---

# Task 4. IM Readiness Engine

Read first:

```text
docs/15-ai-agent-contracts.md
docs/16-prompt-contracts.md
docs/23-full-im-studio-dashboard.md
```

Build:

```text
readiness service
readiness API
dashboard readiness card
available/blocked outputs
required expert patches
```

Acceptance:

```text
readiness score shown
blocked outputs shown
events recorded
```

---

# Task 5. Full IM Section Planner

Read first:

```text
docs/10-domain-model.md
docs/24-section-editor-spec.md
docs/16-prompt-contracts.md
```

Build:

```text
18-section planner
generate outline API
section list UI
section status table
```

Acceptance:

```text
18 sections created
no duplicates
section list renders
```

---

# Task 6. AI Section Draft

Read first:

```text
docs/15-ai-agent-contracts.md
docs/16-prompt-contracts.md
docs/17-financial-analysis-guardrails.md
docs/18-risk-boundary-policy.md
docs/19-disclosure-guard-policy.md
```

Build:

```text
AI mock/provider abstraction
section draft API
schema validation
risk guard
disclosure guard
ai_runs
section versions
```

Acceptance:

```text
safe draft generated
unsafe claim blocked/revised
protected fields blocked
ai_run recorded
```

---

# Task 7. Section Editor

Read first:

```text
docs/22-ui-ux-spec.md
docs/24-section-editor-spec.md
docs/13-status-transition.md
```

Build:

```text
three-panel section editor
section navigation
editor
source/evidence/risk/disclosure tabs
version history
status controls
```

Acceptance:

```text
edit works
version history works
invalid transitions blocked
```

---

# Task 8. Expert Workbench

Read first:

```text
docs/03-user-roles.md
docs/25-expert-workbench-spec.md
docs/05-expert-patch-contracts.md
```

Build:

```text
expert assignment list
expert assignment detail
expert patch form
edit tags
visibility after review
training rights
```

Acceptance:

```text
expert sees only assigned work
patch submitted
edit tags required
event emitted
```

---

# Task 9. Gate Review Console

Read first:

```text
docs/26-gate-review-console-spec.md
docs/13-status-transition.md
docs/18-risk-boundary-policy.md
docs/19-disclosure-guard-policy.md
```

Build:

```text
gate review service
gate console
violation table
approve buyer-ready
override with reason
```

Acceptance:

```text
P0 blocks buyer-ready
reviewer can approve
broker cannot approve
events recorded
```

---

# Task 10. Export System

Read first:

```text
docs/27-export-preview-spec.md
docs/12-api-contracts.md
docs/13-status-transition.md
```

Build:

```text
export preview
draft export
Markdown export
PDF export or placeholder
PPTX-ready outline
export_jobs
```

Acceptance:

```text
draft label shown
buyer-ready export guarded
disclaimer included
```

---

# Task 11. Deal Room Q&A Pack

Read first:

```text
docs/15-ai-agent-contracts.md
docs/27-export-preview-spec.md
docs/14-storage-and-evidence.md
```

Build:

```text
Q&A pack generation
Q&A items
evidence index
dealroom payload
```

Acceptance:

```text
Q&A generated
visibility respected
payload safe
```

---

# Task 12. Golden Dataset Pipeline

Read first:

```text
docs/20-golden-dataset-extraction.md
docs/05-expert-patch-contracts.md
docs/19-disclosure-guard-policy.md
```

Build:

```text
candidate extraction
redaction service
admin review
approve/reject
events
```

Acceptance:

```text
cannot approve without rights/redaction
protected fields removed
```

---

# Task 13. Admin / Analytics

Read first:

```text
docs/09-cross-app-events.md
docs/21-information-architecture.md
```

Build:

```text
admin dashboard
project list
gate review queue
golden candidate queue
activity analytics
```

Acceptance:

```text
admin/reviewer access works
non-admin blocked
analytics visible
```

---

# Task 14. QA / Commercial Polish

Read first:

```text
docs/28-test-plan.md
docs/33-demo-scenarios.md
docs/34-commercial-readiness-checklist.md
```

Build:

```text
E2E coverage
accessibility checks
loading states
empty states
error states
README
demo polish
```

Acceptance:

```text
regression passes
demos pass
commercial checklist passes
```
