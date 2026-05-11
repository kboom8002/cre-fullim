# 08. Versioning Policy

## 1. Purpose

This document defines versioning and change management for:

```text
@js-ssot/contracts
```

Because this package is shared between MVP and Full IM Studio, uncontrolled changes can break app integration.

---

## 2. Version Stages

### 0.1.x — MVP Baseline

Includes:

```text
BuildingSSoTLite
BuildingSignalCard
BuyerIntentLite
DocumentObject
GateRequestLite
ActivityEvent
DisclosurePolicy G0~G3
```

### 0.2.x — Full IM Studio Baseline

Adds:

```text
BuildingSSoTFull
IMProject
IMSection
ExpertPatch
GateReview
ExportJob
GoldenIMCandidate
DisclosurePolicy G0~G5
```

### 0.3.x — Deal Room / Golden Dataset Extensions

Adds:

```text
DealRoomPayload
QAPack
BuyerActivityEvent
GoldenDatasetApproval
TrainingRightsAudit
```

### 1.0.x — Stable Platform Contract

Stable for external integration.

---

## 3. Semantic Versioning

Use semantic versioning:

```text
PATCH: compatible fixes
MINOR: backward-compatible additions
MAJOR: breaking changes
```

Examples:

```text
0.2.1 = typo fix or new safe helper
0.3.0 = new optional schema fields
1.0.0 = stable external API
2.0.0 = breaking schema changes
```

---

## 4. Breaking Changes

A breaking change includes:

```text
- removing a field
- renaming a field
- changing enum values
- changing disclosure policy semantics
- changing gate level meaning
- changing event names
- changing required fields
- changing schema shape in a non-compatible way
```

---

## 5. Non-breaking Changes

Non-breaking changes include:

```text
- adding optional field
- adding new enum value if apps handle unknown values safely
- adding helper function
- adding new document type without changing existing behavior
- adding new event name
```

---

## 6. Change Proposal Format

Every contract change should include:

```text
Title
Version impact
Affected schemas
Affected apps
Migration needed?
Backward compatibility
Test update needed?
Reason
```

---

## 7. Compatibility Rules

### MVP Compatibility

MVP must support:

```text
contracts 0.1.x
```

MVP may import selected 0.2.x types only if no runtime dependency is introduced.

### Full IM Studio Compatibility

Full IM Studio requires:

```text
contracts >= 0.2.0
```

### Handoff Compatibility

Handoff payloads must include:

```text
contracts_version
source_app_version
payload_version
```

---

## 8. Deprecation Policy

Fields should not be removed immediately.

Use:

```text
deprecated_at
replacement_field
migration_note
```

Deprecation period:

```text
at least one minor version
```

---

## 9. Tests Required Before Release

Contracts release must pass:

```text
- schema validation tests
- enum snapshot tests
- disclosure policy tests
- forbidden claims tests
- readiness rule tests
- sample payload tests
```

---

## 10. Release Checklist

```text
□ Version bumped
□ CHANGELOG updated
□ Schema tests pass
□ Affected apps listed
□ Migration notes written
□ Sample payloads updated
□ Contract package published or tagged
```

---

## 11. Acceptance Criteria

Versioning policy is accepted when:

```text
- breaking vs non-breaking changes are clear.
- MVP and Full IM Studio compatibility is defined.
- handoff payload versioning is required.
- release checklist exists.
- contract drift can be controlled.
```
