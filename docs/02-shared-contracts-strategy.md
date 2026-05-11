# 02. Shared Contracts Strategy

## 1. Purpose

This document defines the strategy for the shared package:

```text
@js-ssot/contracts
```

This package ensures that the MVP and Full IM Studio use the same schema, language, policy, and event vocabulary.

Without this package, the two projects will drift.

---

## 2. Core Principle

> Contracts are the shared truth. Apps are implementations.

The shared package should contain only pure, framework-agnostic contracts.

It should not include app code, route handlers, Supabase clients, React components, or UI logic.

---

## 3. Package Structure

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
│  │  └─ activity-event.schema.ts
│  ├─ enums/
│  │  ├─ document-type.enum.ts
│  │  ├─ gate-level.enum.ts
│  │  ├─ visibility.enum.ts
│  │  ├─ im-section-type.enum.ts
│  │  ├─ expert-role.enum.ts
│  │  ├─ event-name.enum.ts
│  │  └─ confidence-label.enum.ts
│  ├─ policies/
│  │  ├─ disclosure-policy.ts
│  │  ├─ forbidden-claims.ts
│  │  ├─ safe-rewrite-rules.ts
│  │  ├─ readiness-rules.ts
│  │  └─ gate-rules.ts
│  ├─ types/
│  │  ├─ index.ts
│  │  └─ helpers.ts
│  └─ index.ts
├─ package.json
├─ tsconfig.json
└─ README.md
```

---

## 4. What Must Be Shared

### 4.1 Building Contracts

```text
BuildingSSoTLiteSchema
BuildingSSoTFullSchema
BuildingSignalCardSchema
EvidenceRefSchema
SourceRefSchema
ConfidenceLabel
```

### 4.2 Document Contracts

```text
DocumentObjectSchema
DocumentType
DocumentStatus
Visibility
SourceRef
BoundaryNote
```

### 4.3 Gate / Disclosure Contracts

```text
GateLevel
GateReviewSchema
DisclosureViolationSchema
VisibilityState
ProtectedField
DisclosurePolicy
```

### 4.4 Full IM Contracts

```text
IMProjectSchema
IMSectionSchema
IMSectionType
IMSectionStatus
IMReadinessResultSchema
ExportJobSchema
```

### 4.5 Expert Contracts

```text
ExpertRole
ExpertAssignmentSchema
ExpertPatchSchema
PatchType
EditTag
TrainingRights
```

### 4.6 Events

```text
ActivityEventSchema
EventName
EventActorRole
EventEntityType
```

### 4.7 AI Safety

```text
ForbiddenClaim
SafeRewriteRule
RiskBoundaryRule
FinancialBoundaryRule
```

---

## 5. What Must Not Be Shared

The contracts package must not include:

```text
- Next.js route handlers
- Server actions
- Supabase clients
- SQL migrations
- UI components
- React hooks
- app-specific domain services
- AI provider clients
- prompt execution functions
```

Prompts may be documented as IDs and schema contracts, but actual model calls should live in each app.

---

## 6. Versioning Policy

### Version 0.1.x

MVP-only baseline:

```text
building_ssot_lite
building_signal_card
buyer_intent_lite
document_object
gate_request_lite
activity_event
```

### Version 0.2.x

Full IM Studio introduction:

```text
building_ssot_full
im_project
im_section
expert_patch
gate_review
export_job
golden_im_candidate
```

### Version 1.0.x

Stable platform contract for external API/partner usage.

---

## 7. Breaking Change Rules

A change is breaking if it:

```text
- removes a field
- renames an enum value
- changes a schema output shape
- changes disclosure policy behavior
- changes event names
- changes gate level semantics
```

Breaking changes require:

```text
- migration note
- version bump
- affected apps list
- backward compatibility plan
- test fixture update
```

---

## 8. Import Rules

Allowed in MVP:

```ts
import {
  BuildingSSoTLiteSchema,
  BuildingSignalCardSchema,
  DocumentObjectSchema,
  GateLevel,
  Visibility,
  EventName
} from "@js-ssot/contracts";
```

Allowed in Full IM Studio:

```ts
import {
  BuildingSSoTFullSchema,
  IMProjectSchema,
  IMSectionSchema,
  ExpertPatchSchema,
  GateReviewSchema,
  DisclosurePolicy
} from "@js-ssot/contracts";
```

Not allowed:

```ts
import { supabase } from "@js-ssot/contracts";
import { Button } from "@js-ssot/contracts";
import { generateFullIM } from "@js-ssot/contracts";
```

---

## 9. Testing Strategy

The contracts package must have its own tests:

```text
- schema validation tests
- enum stability tests
- disclosure policy tests
- forbidden claim tests
- readiness rule tests
```

Example tests:

```text
- Blind teaser cannot include protected fields.
- IM section must have section_type and status.
- Expert patch must include before_text, after_text, and edit_tags.
- Event name must be in EventName enum.
```

---

## 10. Contracts-first AI-pair Coding Rule

Before coding any feature in MVP or Full IM Studio, the AI-pair coding agent must check:

```text
1. Is there an existing contract?
2. If yes, use it.
3. If no, propose a contract addition first.
4. Do not create app-specific shadow schemas for shared objects.
```

---

## 11. Acceptance Criteria

This shared contracts strategy is accepted when:

```text
- Shared objects are defined in one package.
- MVP and Full IM Studio can import the same schema and enums.
- Disclosure policy is shared.
- Event names are shared.
- Contracts do not include app-specific implementation.
- Versioning rules are clear.
```
