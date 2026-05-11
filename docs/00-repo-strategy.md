# 00. Repo Strategy

## 1. Purpose

This document locks the repository and deployment strategy for the **JS Full IM Studio** project.

JS Full IM Studio is a separate professional workflow application that integrates with the already-developed **JS Building SSoT MVP v0.1**.

The goal is to keep the MVP light while allowing Full IM Studio to become a production-grade AI + Expert Deal Document Production System.

---

## 2. Strategic Decision

The recommended architecture is:

```text
js-building-ssot-mvp/
  Public Building Radar
  Broker 1분 딜카드
  Buyer Intent Lite
  Owner Readiness Lite
  Expert Note / Full IM lead generation

js-full-im-studio/
  Full B-SSoT upgrade
  IM Readiness
  Full IM Project Manager
  Section Planner
  AI Section Draft
  Expert Workbench
  Gate Review
  Export
  Deal Room / Q&A Pack handoff
  Golden Dataset candidate pipeline

js-ssot-contracts/
  Shared schemas
  Shared enums
  Shared disclosure policies
  Shared event names
  Shared forbidden claim rules
  Shared readiness rules
```

Final decision:

> Use separate projects/repositories with a shared contracts package.

---

## 3. Why Not Build Full IM Inside MVP?

The MVP must remain a low-friction acquisition and broker utility product.

MVP responsibilities:

```text
Small input
→ Building SSoT Lite
→ Public-safe signal/document
→ Full IM lead or expert note request
```

Full IM Studio responsibilities:

```text
Building SSoT Lite handoff
→ Full Building SSoT
→ IM project
→ section draft
→ expert patch
→ review gate
→ export / publish
```

If Full IM is built directly inside the MVP, the MVP becomes heavy, slow to iterate, and harder for brokers and public users to understand.

---

## 4. Recommended Repo Structure

### Option A — Separate Repos

```text
js-building-ssot-mvp/
js-full-im-studio/
js-ssot-contracts/
```

Recommended for production.

Advantages:

```text
- Clear product boundary
- Independent deployment
- Smaller AI-pair coding context per repo
- Better permission separation
- Better expert workflow isolation
- Easier future licensing/API packaging
```

Tradeoffs:

```text
- Shared package versioning required
- Handoff API must be explicit
- Cross-app auth/session strategy needed
```

---

### Option B — Turborepo Workspace

```text
js-building-platform/
├─ apps/
│  ├─ mvp/
│  └─ full-im-studio/
└─ packages/
   ├─ contracts/
   ├─ ui/
   ├─ ai/
   └─ supabase/
```

Recommended only if one team is developing both apps tightly in the early phase.

Advantages:

```text
- Easy local development
- Shared package linking
- Shared TypeScript types
- Easier CI setup
```

Tradeoffs:

```text
- Product boundaries can blur
- Full IM Studio may accidentally depend on MVP internals
- Deployment coupling can increase
```

---

## 5. Final Recommendation

Use this production-oriented structure:

```text
js-building-ssot-mvp/
js-full-im-studio/
js-ssot-contracts/
```

During local development, the repos may be checked out side by side:

```text
workspace/
├─ js-building-ssot-mvp/
├─ js-full-im-studio/
└─ js-ssot-contracts/
```

Each app should import contracts from a versioned package:

```text
@js-ssot/contracts
```

---

## 6. Package Ownership

| Package / App | Owner | Purpose |
|---|---|---|
| js-building-ssot-mvp | Product / Growth / Broker Utility | Lead generation and B-SSoT Lite creation |
| js-full-im-studio | Professional Workflow / Expert Ops | Full IM, Expert Patch, Gate Review, Export |
| js-ssot-contracts | Platform Architecture | Shared schema, enum, policy, event standards |

---

## 7. Deployment Strategy

### MVP App

```text
Public domain:
- building radar
- broker deal card
- owner readiness
- expert note request

Deployment:
- Vercel
- Supabase project or shared Supabase tenant
```

### Full IM Studio

```text
Restricted professional app:
- broker/editor/expert/reviewer/admin login
- full IM project workspace
- expert workbench
- review gate
- export

Deployment:
- Vercel
- same Supabase project with separated schemas OR separate Supabase project with API-based handoff
```

### Contracts Package

```text
Distribution:
- private npm package
- Git submodule
- workspace package in early dev
```

---

## 8. Supabase Strategy

Two viable options exist.

### Option 1 — Shared Supabase Project

Recommended for early development.

```text
mvp tables
full_im tables
shared profiles/auth
shared activity_events
```

Advantages:

```text
- Simpler auth
- Easier handoff
- Easier analytics
```

Risks:

```text
- RLS must be strict
- Full IM tables must not leak into public APIs
```

### Option 2 — Separate Supabase Projects

Recommended later for enterprise separation.

```text
MVP Supabase
Full IM Supabase
Handoff API bridge
```

Advantages:

```text
- Strong isolation
- Separate operational risk
```

Tradeoffs:

```text
- More integration complexity
- Cross-app identity mapping required
```

Initial recommendation:

> Use one Supabase project with strict schema/table boundary and RLS, then separate later if enterprise requirements demand it.

---

## 9. Environment Separation

Required environment variables for Full IM Studio:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
AI_PROVIDER
AI_MODEL_FULL_IM
MVP_HANDOFF_SECRET
CONTRACTS_VERSION
APP_BASE_URL
EXPORT_STORAGE_BUCKET
```

Optional:

```text
SENTRY_DSN
POSTHOG_KEY
SLACK_WEBHOOK_URL
PDF_EXPORT_WORKER_URL
PPTX_EXPORT_WORKER_URL
```

---

## 10. Versioning Strategy

The contracts package must be versioned.

```text
@js-ssot/contracts@0.1.x
  MVP-compatible contracts

@js-ssot/contracts@0.2.x
  Full IM Studio contracts

@js-ssot/contracts@1.0.x
  stable external API contract
```

Breaking changes require:

```text
- migration note
- affected app list
- schema diff
- API diff
- backward compatibility plan
```

---

## 11. Repo Rule for AI-pair Coding

AI agents must not import MVP internal files directly into Full IM Studio.

Allowed:

```text
import from @js-ssot/contracts
call documented handoff API
use documented source payload
```

Not allowed:

```text
import from js-building-ssot-mvp/src/domain/*
import MVP private route handlers
query MVP-specific tables outside approved handoff scope
modify MVP source rows from Full IM Studio
```

---

## 12. Acceptance Criteria

This repo strategy is accepted when:

```text
- MVP, Full IM Studio, and Contracts responsibilities are clearly separated.
- The Handoff API is the only product-level bridge.
- Shared schema/policy/event contracts are centralized.
- Full IM Studio can be developed independently by AI-pair coding.
- MVP remains lightweight and not polluted by professional workflow complexity.
```
