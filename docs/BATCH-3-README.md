# Batch 3 README — Integration & Handoff Contract

## Purpose

Batch 3 defines how JS Building SSoT MVP and JS Full IM Studio integrate safely.

The core idea is:

```text
MVP creates Building SSoT Lite and Full IM intent.
Full IM Studio imports through a handoff token and creates its own Full IM project.
```

## Generated Documents

```text
js-full-im-studio/docs/05-integration-with-mvp.md
js-full-im-studio/docs/06-handoff-api-contract.md
js-full-im-studio/docs/07-import-from-bssot-lite.md
js-full-im-studio/docs/08-cross-app-auth-and-permission.md
js-full-im-studio/docs/09-cross-app-events.md
```

## Key Decisions

```text
- Handoff API is the only product bridge.
- Full IM Studio must not mutate MVP source rows.
- Building SSoT Lite is imported as a source snapshot.
- Full IM Studio creates building_ssot_full and im_project internally.
- Handoff tokens must expire and be permission-checked.
- Events track the funnel from full_im_requested to im_exported.
```

## Next Batch

Batch 4 should define Full IM Studio domain, database, API, status transition, storage, and evidence contracts:

```text
10-domain-model.md
11-database-schema.md
12-api-contracts.md
13-status-transition.md
14-storage-and-evidence.md
```
