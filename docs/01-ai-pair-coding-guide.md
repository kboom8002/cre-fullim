# 01. AI-pair Coding Guide

## 1. Purpose

This document defines how Antigravity / Claude / AI-pair coding agents should implement JS Full IM Studio.

The product is complex. AI agents must not improvise the domain model or expand scope without permission.

---

## 2. Required Reading Order

Before implementing any feature, the AI coding agent must read the relevant docs in this order:

```text
1. docs/00-product-brief.md
2. docs/02-scope-and-boundaries.md
3. docs/03-user-roles.md
4. docs/05-integration-with-mvp.md
5. docs/10-domain-model.md
6. docs/11-database-schema.md
7. docs/12-api-contracts.md
8. docs/15-ai-agent-contracts.md
9. docs/21-information-architecture.md
10. docs/28-test-plan.md
```

For shared types and policy, check:

```text
@js-ssot/contracts
```

---

## 3. Core Implementation Rule

Every feature must preserve this workflow:

```text
MVP handoff or manual intake
→ building_ssot_full
→ im_project
→ im_sections
→ ai draft
→ expert patch
→ gate review
→ buyer-ready approval
→ export
→ activity event
```

---

## 4. Non-negotiable Rules

### 4.1 SSoT Rule

Do not generate Full IM content directly from loose text alone.

All Full IM content must be grounded in:

```text
building_ssot_full
source_refs
evidence_refs
section context
```

### 4.2 Draft Rule

AI-generated content is always draft by default.

```text
im_section.status = ai_draft
document.status = draft
```

### 4.3 Gate Rule

Buyer-ready output requires gate pass.

At minimum:

```text
Data Gate
Disclosure Gate
Risk Gate
Financial Consistency Gate
Buyer-ready Approval Gate
```

### 4.4 Expert Rule

Sections marked `requires_expert_patch = true` cannot become buyer-ready until expert review or explicit reviewer override.

### 4.5 Disclosure Rule

Protected fields must not appear in public, blind, or lower-gate outputs.

Protected fields include:

```text
exact_address
tenant_name
unit_rent
seller_motivation
negotiation_memo
internal_broker_note
raw_registry_details
full_lease_contract
```

### 4.6 Safe Language Rule

Do not produce:

```text
investment recommendation
valuation certainty
legal conclusion
tax conclusion
loan approval claim
guaranteed yield
remodeling upside certainty
```

Use safe language:

```text
preliminary review
evidence needed
expert review required
condition-dependent
scenario-based
```

### 4.7 Event Rule

Every important mutation must create an activity event.

---

## 5. Coding Style

Use:

```text
Next.js App Router
TypeScript
Zod
Supabase
Server Actions or Route Handlers
Tailwind CSS
shadcn/ui-compatible components
AI provider abstraction
```

Prefer:

```text
domain service functions
schema-first APIs
typed contracts
small composable components
explicit status transitions
```

Avoid:

```text
large monolithic route handlers
untyped JSON blobs without schemas
hidden business logic in UI components
direct DB mutations in components
AI calls without schema validation
```

---

## 6. AI Output Rules

Every AI-generated object must pass:

```text
Zod output schema
RiskBoundary check
DisclosureGuard check
source_refs existence check
boundary note check where required
```

AI runs must log:

```text
run_type
input_ref
output_ref
model
prompt_version
status
token_usage if available
latency_ms if available
error if any
```

---

## 7. Testing Before Implementation

For all major features, follow TDD:

```text
write failing test
implement minimum code
pass test
refactor
run regression
```

Required test layers:

```text
unit
API
RLS/permission
AI guardrail
E2E
mobile/desktop responsive
```

---

## 8. Slice Completion Rule

A slice is complete only when:

```text
- all acceptance criteria pass
- typecheck passes
- core tests pass
- demo path works
- no protected field leakage exists
- no scope creep was introduced
- activity events are recorded
```

---

## 9. Forbidden Scope Expansion

Do not implement unless explicitly requested:

```text
payment / billing
full expert marketplace
public lead generation
automatic valuation
investment advice
legal/tax/loan final judgment
full data room permissions beyond planned Gate Review
external investor portal
```

If useful, add to future roadmap instead.

---

## 10. Antigravity Execution Pattern

Use single-lane execution.

```text
Plan
→ Implement
→ Test
→ Verify in browser
→ Report changed files
→ Report remaining issues
```

Do not run multiple major slices in parallel.

---

## 11. Bug Fix Rule

When fixing a bug:

```text
1. reproduce with a test
2. make the test fail
3. fix the smallest responsible code path
4. pass test
5. run relevant regression
```

---

## 12. Acceptance Criteria

This guide is accepted when:

```text
- AI agents know the implementation rules.
- SSoT, draft, gate, expert, and disclosure rules are explicit.
- TDD workflow is mandatory for major slices.
- Scope creep is prevented.
- Full IM Studio can be implemented consistently by AI-pair coding.
```
