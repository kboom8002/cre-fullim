# 00. Contracts Overview

## 1. Purpose

This document defines the shared contract package for the JS Building SSoT ecosystem:

```text
@js-ssot/contracts
```

This package is shared by:

```text
js-building-ssot-mvp
js-full-im-studio
future dealroom / expert marketplace / partner API apps
```

The purpose of the package is to make sure every app speaks the same domain language and follows the same disclosure, gate, document, event, and AI safety rules.

---

## 2. Core Principle

> Contracts are the shared truth. Apps are implementations.

The MVP and Full IM Studio may have different UI, routes, database services, and workflows, but they must use the same contract vocabulary for:

```text
Building SSoT
Document Object
Gate / Disclosure
Full IM Project
Expert Patch
Activity Event
Forbidden Claims
Safe Language
```

---

## 3. What Belongs in Contracts

The contracts package should include:

```text
- Zod schemas
- TypeScript types inferred from Zod
- enums
- constant maps
- pure validation helpers
- pure policy helpers
- safe language rules
- event name registry
- version metadata
```

Allowed dependencies:

```text
zod
typescript
```

Optional lightweight dependencies:

```text
nanoid or uuid type only if necessary
```

---

## 4. What Does Not Belong in Contracts

The contracts package must not include:

```text
- Next.js app code
- route handlers
- server actions
- Supabase client
- SQL migrations
- React components
- UI styles
- model provider clients
- prompt execution functions
- file upload functions
- database query functions
```

The package can define prompt IDs and input/output schemas, but actual LLM calls must live in the app.

---

## 5. Package Structure

```text
@js-ssot/contracts
├─ src/
│  ├─ schemas/
│  │  ├─ building-ssot-lite.schema.ts
│  │  ├─ building-ssot-full.schema.ts
│  │  ├─ building-signal.schema.ts
│  │  ├─ buyer-intent.schema.ts
│  │  ├─ document-object.schema.ts
│  │  ├─ im-project.schema.ts
│  │  ├─ im-section.schema.ts
│  │  ├─ expert-patch.schema.ts
│  │  ├─ gate-review.schema.ts
│  │  ├─ evidence.schema.ts
│  │  └─ activity-event.schema.ts
│  ├─ enums/
│  │  ├─ document-type.enum.ts
│  │  ├─ gate-level.enum.ts
│  │  ├─ visibility.enum.ts
│  │  ├─ im-section-type.enum.ts
│  │  ├─ expert-role.enum.ts
│  │  ├─ event-name.enum.ts
│  │  ├─ confidence-label.enum.ts
│  │  └─ review-status.enum.ts
│  ├─ policies/
│  │  ├─ disclosure-policy.ts
│  │  ├─ forbidden-claims.ts
│  │  ├─ safe-rewrite-rules.ts
│  │  ├─ readiness-rules.ts
│  │  └─ gate-rules.ts
│  ├─ helpers/
│  │  ├─ visibility.ts
│  │  ├─ redaction.ts
│  │  ├─ readiness.ts
│  │  └─ assertions.ts
│  ├─ prompts/
│  │  └─ prompt-ids.ts
│  └─ index.ts
├─ package.json
├─ tsconfig.json
└─ README.md
```

---

## 6. Contract Categories

### 6.1 Building Contracts

```text
BuildingSSoTLite
BuildingSSoTFull
BuildingSignalCard
SourceRef
EvidenceRef
ConfidenceLabel
```

### 6.2 Document Contracts

```text
DocumentObject
DocumentType
DocumentStatus
Visibility
BoundaryNote
```

### 6.3 Gate / Disclosure Contracts

```text
GateLevel
GateReview
GateReviewStatus
DisclosureViolation
ProtectedField
VisibilityState
```

### 6.4 Full IM Contracts

```text
IMProject
IMSection
IMSectionType
IMReadinessResult
ExportJob
QAPack
EvidenceIndex
```

### 6.5 Expert Contracts

```text
ExpertRole
ExpertAssignment
ExpertPatch
PatchType
EditTag
TrainingRights
```

### 6.6 Event Contracts

```text
ActivityEvent
EventName
EventActorRole
EventEntityType
```

---

## 7. Version Policy

Initial versioning:

```text
0.1.x = MVP baseline contracts
0.2.x = Full IM Studio contracts
0.3.x = Dealroom / Golden Dataset extensions
1.0.x = stable platform contract
```

Breaking changes require:

```text
- version bump
- migration note
- affected app list
- schema diff
- compatibility plan
```

---

## 8. Golden Rule for AI-pair Coding

Before creating any schema, enum, policy, event, or protected field in either app, the AI-pair coding agent must check the contracts package first.

If the contract exists, use it.

If it does not exist, propose a contract addition before implementing app-specific logic.

---

## 9. Acceptance Criteria

The contracts overview is accepted when:

```text
- Contract boundaries are clear.
- The package contains only shared pure contracts.
- MVP and Full IM Studio can import the same schemas/enums/policies.
- Disclosure and event rules are centralized.
- App-specific implementation remains outside the contracts package.
```
