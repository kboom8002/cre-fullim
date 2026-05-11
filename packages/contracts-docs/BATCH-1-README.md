# Batch 1 README — Shared Contracts Pack

## Purpose

Batch 1 defines the shared contract layer for JS Building SSoT MVP and JS Full IM Studio.

This is the most important foundation for making the two apps separate but interoperable.

## Generated Documents

```text
packages/contracts-docs/00-contracts-overview.md
packages/contracts-docs/01-building-ssot-contracts.md
packages/contracts-docs/02-document-contracts.md
packages/contracts-docs/03-gate-disclosure-contracts.md
packages/contracts-docs/04-im-project-contracts.md
packages/contracts-docs/05-expert-patch-contracts.md
packages/contracts-docs/06-event-contracts.md
packages/contracts-docs/07-forbidden-claims-and-safe-language.md
packages/contracts-docs/08-versioning-policy.md
```

## Key Decisions

```text
- @js-ssot/contracts is the shared truth package.
- It contains schemas, enums, policies, event names, and pure helpers.
- It does not contain Next.js, Supabase, React, AI provider, or app-specific code.
- MVP and Full IM Studio must use the same disclosure policy.
- Contract versioning is mandatory.
```

## Next Batch

Batch 2 should define the Full IM Studio product scope:

```text
- product brief
- AI-pair coding guide
- scope and boundaries
- user roles
- commercial packages
```
