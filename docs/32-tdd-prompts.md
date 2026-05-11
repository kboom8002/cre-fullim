# 32. TDD Prompts

## 1. Purpose

This document provides TDD-specific prompts for commercial-grade implementation of JS Full IM Studio.

Use these prompts to force tests before implementation.

---

## GLOBAL TDD PROMPT

```text
You are improving or implementing JS Full IM Studio using strict TDD.

Rules:
1. Do not implement before writing tests.
2. Each task starts with failing tests.
3. Implement the minimum needed to pass.
4. Refactor only after tests pass.
5. Preserve product boundaries and scope.
6. Do not bypass gate/disclosure/risk rules.
7. Do not approve buyer-ready output from AI.
8. Do not leak protected fields.
9. Every important mutation emits activity_event.
10. Run relevant regression before completion.

Work order:
Test → Fail → Implement → Pass → Refactor → Verify → Report.
```

---

# TDD-0 Foundation

```text
Write tests for:
- app route smoke
- schema validation smoke
- AI mock deterministic output
- Supabase helper smoke

Then implement test infrastructure.
```

---

# TDD-1 Contracts

```text
Write tests for:
- BuildingSSoTFull valid/invalid fixtures
- IMProject valid/invalid fixtures
- IMSection valid/invalid fixtures
- ExpertPatch requires edit_tags
- GateReview supports P0 violation
- forbidden claim detector
```

---

# TDD-2 Handoff

```text
Write tests for:
- valid handoff import
- expired handoff
- invalid handoff
- permission denied
- safe preview redacts protected fields
- import creates source snapshot and project
```

---

# TDD-3 B-SSoT Upgrade

```text
Write tests for:
- Lite to Full mapping
- protected fields classification
- missing data detection
- source_refs preservation
- no invented facts
```

---

# TDD-4 Readiness

```text
Write tests for:
- readiness score bands
- missing rent roll blocks buyer-ready
- missing operating expense triggers financial patch
- missing registry triggers legal patch
- available/blocked outputs are correct
```

---

# TDD-5 Section Planner

```text
Write tests for:
- exactly 18 sections
- correct section order
- no duplicate sections
- high-risk sections require expert patch
```

---

# TDD-6 AI Draft

```text
Write tests for:
- valid draft passes schema
- invalid output fails
- forbidden claims blocked
- protected fields redacted
- boundary note required
- ai_run logged
```

---

# TDD-7 Section Editor

```text
Write E2E tests for:
- open section editor
- edit section
- switch sections
- view source/evidence panel
- run rewrite
- blocked transition cannot proceed
```

---

# TDD-8 Expert Workbench

```text
Write tests for:
- expert sees assigned work only
- patch requires edit_tags
- patch requires training_rights
- patch submission creates event
- patch creates section version if applied
```

---

# TDD-9 Gate Review

```text
Write tests for:
- disclosure P0 blocks buyer-ready
- financial issue blocks export
- reviewer can approve after pass
- broker cannot approve
- override requires reason
```

---

# TDD-10 Export

```text
Write tests for:
- draft export has draft label
- buyer-ready export requires approval
- disclaimer required
- export job lifecycle
- failed export state
```

---

# TDD-11 Q&A Pack

```text
Write tests for:
- Q&A pack generated
- answer_status exists
- required evidence listed
- protected fields not exposed
- dealroom payload safe
```

---

# TDD-12 Golden Dataset

```text
Write tests for:
- candidate extracted from AI draft + expert patch
- candidate cannot approve without rights
- candidate cannot approve before redaction
- protected fields redacted
- edit_tags required
```

---

# TDD-13 Admin / Analytics

```text
Write tests for:
- admin access
- non-admin blocked
- gate queue visible to reviewer
- event counts shown
- safety events shown
```

---

# TDD-14 Regression

```text
Run:
- npm run typecheck
- npm run test
- npm run test:e2e
- npm run test:guardrails
- npm run test:rls

Verify:
- handoff flow works
- readiness works
- section draft works
- expert patch works
- gate review works
- export works
- no protected field leaks
- no forbidden claims
```
