# 28. Test Plan

## 1. Purpose

This document defines the test strategy for **JS Full IM Studio**.

The system is a professional CRE deal document production app. Testing must cover more than UI rendering. It must verify:

```text
domain invariants
handoff import safety
B-SSoT upgrade
IM readiness
AI output schemas
financial/risk/disclosure guardrails
expert workbench
gate review
export blocking
RLS / permissions
Golden Dataset safety
```

---

## 2. Testing Philosophy

Use strict TDD for P0 workflows.

```text
Write failing test
→ implement minimum code
→ pass test
→ refactor
→ run regression
```

Do not implement major features before tests.

---

## 3. Test Stack

Recommended:

```text
Unit: Vitest
Schema: Zod validation tests
API: Vitest + route handler test utilities
E2E: Playwright
Accessibility: @axe-core/playwright
Database: Supabase local / SQL fixtures
AI: deterministic mock provider
Storage: mocked Supabase Storage
Export: snapshot / file existence tests
```

---

## 4. Test Folders

```text
tests/
├─ unit/
│  ├─ domain/
│  ├─ schemas/
│  ├─ ai/
│  ├─ guardrails/
│  └─ services/
├─ api/
│  ├─ handoff/
│  ├─ projects/
│  ├─ sections/
│  ├─ experts/
│  ├─ gates/
│  └─ exports/
├─ e2e/
│  ├─ handoff-import.spec.ts
│  ├─ readiness-outline.spec.ts
│  ├─ section-editor.spec.ts
│  ├─ expert-workbench.spec.ts
│  ├─ gate-review.spec.ts
│  └─ export-preview.spec.ts
├─ fixtures/
│  ├─ handoff-payloads/
│  ├─ bssot/
│  ├─ sections/
│  ├─ evidence/
│  └─ ai-outputs/
└─ mocks/
   ├─ ai-provider.ts
   ├─ supabase.ts
   └─ storage.ts
```

---

## 5. Unit Tests

## 5.1 Domain Invariant Tests

Required tests:

```text
im_project must reference building_ssot_full
im_section must reference im_project
AI draft cannot become buyer_ready directly
buyer_ready requires required gates
export is blocked when project is not buyer_ready unless draft mode
expert_patch cannot erase previous section version
golden_candidate cannot be approved without rights and redaction
```

---

## 5.2 Status Transition Tests

Test:

```text
valid project transitions
invalid project transitions
valid section transitions
invalid section transitions
buyer-ready guard
export guard
golden candidate approval guard
```

Expected files:

```text
tests/unit/domain/project-status.test.ts
tests/unit/domain/section-status.test.ts
tests/unit/domain/export-guard.test.ts
tests/unit/domain/golden-candidate-guard.test.ts
```

---

## 5.3 Readiness Tests

Test readiness score bands:

```text
0~30 teaser only
31~50 external snapshot
51~70 IM Lite
71~85 Full IM draft
86~100 buyer-ready candidate after gate review
```

Also test:

```text
missing rent roll lowers readiness
missing operating expense blocks buyer-ready
missing registry evidence requires legal patch
missing photos/floor plans affects building condition section
```

---

## 6. Schema Tests

Every shared contract must have validation tests:

```text
BuildingSSoTFullSchema
IMProjectSchema
IMSectionSchema
ExpertPatchSchema
GateReviewSchema
ExportJobSchema
GoldenIMCandidateSchema
```

Test:

```text
valid payload passes
missing required field fails
invalid enum fails
protected field violation fails when checked by policy helper
```

---

## 7. AI Guardrail Tests

## 7.1 Structured Output Tests

Required:

```text
AI section draft must pass output schema
AI readiness output must pass schema
AI section planner must return 18 sections
AI Q&A pack must contain answer_status
AI Golden candidate output must include redaction_status and training_rights
```

## 7.2 Forbidden Claims Tests

Must block or rewrite:

```text
투자 가치가 높습니다
대출 가능합니다
적정 가격입니다
수익률이 보장됩니다
법적 문제 없습니다
용도변경 가능합니다
리모델링하면 임대료가 상승합니다
```

## 7.3 Disclosure Tests

Must block or redact:

```text
exact address in blind/public output
tenant name in blind/public output
unit-level rent in blind/public output
seller motivation in external output
negotiation memo in external output
full lease contract before G5
```

## 7.4 Financial Guardrail Tests

Required:

```text
NOI without operating expense assumption returns revise
Cap Rate commentary includes assumption note
debt sensitivity includes financing boundary note
valuation logic includes appraisal boundary note
buyer-ready approval blocked when financial consistency gate fails
```

---

## 8. API Tests

## 8.1 Handoff API

Test:

```text
valid token imports
expired token fails
revoked token fails
already imported token fails
contract mismatch fails
permission denied fails
protected fields not returned in preview
```

---

## 8.2 Project API

Test:

```text
create project
get project with permission
deny project without membership
update allowed fields
reject direct illegal status update
```

---

## 8.3 Readiness / Outline API

Test:

```text
readiness check updates project
outline creates 18 sections
running outline twice does not duplicate sections
```

---

## 8.4 Section API

Test:

```text
generate draft creates ai_run
generate draft creates section version
update section creates version
forbidden AI output fails
protected field output fails
```

---

## 8.5 Expert API

Test:

```text
request expert assignment
expert sees assigned section only
expert submits patch
patch requires edit_tags
patch creates event
```

---

## 8.6 Gate API

Test:

```text
run gate review
P0 violation blocks buyer-ready
reviewer can approve buyer-ready only when gates pass
broker cannot approve buyer-ready
override requires reason
```

---

## 8.7 Export API

Test:

```text
draft export allowed with draft label
buyer-ready export blocked before approval
buyer-ready export allowed after approval
export includes disclaimer
failed export creates failed job
```

---

## 9. RLS / Permission Tests

Required:

```text
user cannot read project without membership
expert can read assigned section only
expert cannot read unrelated evidence
reviewer can read assigned review project
admin can read all
owner cannot approve buyer-ready
broker cannot override P0 disclosure issue
```

---

## 10. E2E Tests

## 10.1 Handoff to Readiness

```text
MVP handoff token
→ preview
→ import
→ project dashboard
→ readiness result
```

## 10.2 Readiness to Section Draft

```text
project dashboard
→ generate outline
→ open sections
→ generate executive summary
→ verify AI draft status
```

## 10.3 Expert Patch Flow

```text
request expert patch
→ expert opens assignment
→ submits patch
→ section shows patched status
```

## 10.4 Gate Review Flow

```text
run gate review
→ see violation
→ fix issue
→ rerun gate
→ approve buyer-ready
```

## 10.5 Export Flow

```text
buyer-ready project
→ export preview
→ generate PDF/Markdown
→ verify output job completed
```

---

## 11. Accessibility Tests

Required:

```text
project dashboard has headings
section editor controls have labels
expert patch form is keyboard usable
gate review violation table is accessible
export buttons have discernible labels
no critical axe violations on P0 screens
```

---

## 12. Performance Checks

P0 targets:

```text
project dashboard initial render < 3s local/dev
section editor initial render < 4s local/dev
AI generation shows loading state within 500ms
export job shows queued state immediately
```

---

## 13. Regression Suite

Run before marking a slice complete:

```text
npm run typecheck
npm run test
npm run test:e2e
npm run test:guardrails
npm run test:rls
```

If scripts are not available yet, create them in Slice 0.

---

## 14. Definition of Done

A feature is done when:

```text
- tests fail first
- implementation passes tests
- typecheck passes
- relevant E2E passes
- no P0 disclosure failure exists
- buyer-ready approval rules are preserved
- activity events are emitted
- no scope creep introduced
```

---

## 15. Acceptance Criteria

Test plan is accepted when:

```text
- all P0 workflows have tests.
- guardrails are testable.
- RLS/permissions are testable.
- E2E scenarios match product flows.
- regression suite is defined.
```
