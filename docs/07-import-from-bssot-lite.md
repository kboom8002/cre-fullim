# 07. Import from Building SSoT Lite

## 1. Purpose

This document defines how Full IM Studio imports Building SSoT Lite from the MVP and upgrades it into Building SSoT Full.

The import process must preserve original MVP data while creating Full IM Studio-owned professional data objects.

---

## 2. Import Principle

> Never mutate the MVP source. Create a Full IM Studio snapshot and upgrade from there.

The imported data should be treated as a source snapshot with version and provenance.

---

## 3. Import Flow

```text
handoff token
→ handoff payload validation
→ fetch Building SSoT Lite
→ fetch allowed source documents
→ normalize source refs
→ create source snapshot
→ create Building SSoT Full draft
→ create IM Project
→ attach source refs/evidence refs
→ queue readiness check
```

---

## 4. Source Objects

Full IM Studio may import:

```text
building_ssot_lite
building_signal_card
deal_curiosity_report
blind_teaser
buyer_intent_lite
owner_readiness_check
expert_note_request
evidence_refs
```

Only if allowed in:

```text
allowed_import_scope
```

---

## 5. Import Snapshot Schema

```ts
export const HandoffSourceSnapshotSchema = z.object({
  id: z.string(),
  handoff_id: z.string(),

  source_app: z.literal("js-building-ssot-mvp"),
  source_app_version: z.string().optional(),
  contracts_version: z.string(),
  payload_version: z.string(),

  source_building_ssot_lite_id: z.string(),
  source_objects: z.record(z.string(), z.any()).default({}),

  imported_by: z.string().optional(),
  imported_at: z.string().datetime(),

  import_status: z.enum([
    "pending",
    "imported",
    "imported_with_warnings",
    "failed"
  ]),

  warnings: z.array(z.string()).default([])
});
```

---

## 6. Lite to Full Mapping

### 6.1 Basic Mapping

| Building SSoT Lite | Building SSoT Full |
|---|---|
| area_signal | asset_identity.area_signal |
| asset_type | asset_identity.asset_type |
| price_band | buyer_fit / project context |
| size_signal | physical_fact summary |
| current_use_signal | physical_fact / lease_income |
| vacancy_signal | lease_income.vacancy_summary |
| fit_summary | buyer_fit.fit_types / buyer_messages |
| caution_summary | risk_unknown.risk_items |
| hidden_fields | disclosure_gate.protected_fields |
| source_refs | evidence_source.source_refs |
| evidence_refs | evidence_source.evidence_refs |

### 6.2 Unmapped Fields

If a Lite field cannot be mapped safely:

```text
store in import_snapshot.source_objects
mark as needs_review
do not place in buyer-ready output
```

---

## 7. Full B-SSoT Draft Creation

The initial Building SSoT Full should be created with:

```text
readiness_status = lite_imported
source_building_ssot_lite_id
evidence_source.source_refs
disclosure_gate.protected_fields
risk_unknown from caution_summary
buyer_fit from fit_summary
```

Missing layers should be initialized as empty objects, not invented.

---

## 8. Missing Data Detection

After import, the system should detect missing Full IM data:

```text
exact address / disclosure-controlled
land area
gross floor area
registry
land use plan
rent roll
lease summary
photos
floor plan
repair history
operating expenses
market comps
rent comps
```

Each missing item should be classified:

```text
required_for_im_lite
required_for_full_im_draft
required_for_buyer_ready
optional_enrichment
```

---

## 9. Disclosure Review on Import

The import process must re-run disclosure checks.

If the imported source includes protected fields:

```text
- mark field visibility
- store as private_truth or internal_only
- do not include in default section drafts
- require gate review before external output
```

---

## 10. Source Integrity

The imported source snapshot should include:

```text
source object ids
source app version
contracts version
import timestamp
imported by
payload version
```

This allows later audit and debugging.

---

## 11. Import Warnings

Possible warnings:

```text
missing_source_document
contracts_version_mismatch
protected_fields_detected
owner_readiness_missing
buyer_intent_missing
evidence_refs_missing
source_confidence_low
```

Warnings should not necessarily block import, but they should affect readiness.

---

## 12. Post-import Actions

After import:

```text
1. create im_project
2. run or queue readiness check
3. show Project Dashboard
4. suggest missing data
5. suggest package path
6. record events
```

Events:

```text
handoff_imported
bssot_full_created
im_project_created
im_readiness_check_queued
```

---

## 13. Acceptance Criteria

Import from Building SSoT Lite is accepted when:

```text
- Lite object can be imported into Full IM Studio.
- Full B-SSoT draft is created.
- source snapshot is stored.
- missing data is detected.
- protected fields remain protected.
- readiness check can run after import.
- MVP source objects are not mutated.
```
