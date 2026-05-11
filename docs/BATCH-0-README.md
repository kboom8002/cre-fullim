# Batch 0 README — Repo / System Boundary Lock

## Purpose

Batch 0 defines how the Full IM Studio project will exist alongside the already-developed JS Building SSoT MVP v0.1.

It locks:

```text
1. repository strategy
2. system boundaries
3. shared contracts strategy
```

## Generated Documents

```text
docs/00-repo-strategy.md
docs/01-system-boundaries.md
docs/02-shared-contracts-strategy.md
```

## Key Decisions

```text
- Full IM Studio is a separate professional workflow app.
- MVP remains a lightweight acquisition and broker utility app.
- @js-ssot/contracts becomes the shared schema/policy/event package.
- MVP and Full IM Studio are connected through handoff payloads, not direct internal imports.
- Full IM Studio must not mutate MVP source objects.
```

## Next Batch

Batch 1 should define the Shared Contracts Pack in detail:

```text
- Building SSoT contracts
- Document contracts
- Gate/Disclosure contracts
- IM Project contracts
- Expert Patch contracts
- Event contracts
- Forbidden claims / safe language
- Versioning policy
```
