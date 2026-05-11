# Batch 4 README — Full IM Domain / Database / API Contract

## Purpose

Batch 4 defines the core implementation contract for JS Full IM Studio.

It covers:

```text
- domain model
- database schema
- API contracts
- status transitions
- storage and evidence policy
```

## Generated Documents

```text
js-full-im-studio/docs/10-domain-model.md
js-full-im-studio/docs/11-database-schema.md
js-full-im-studio/docs/12-api-contracts.md
js-full-im-studio/docs/13-status-transition.md
js-full-im-studio/docs/14-storage-and-evidence.md
```

## Key Decisions

```text
- Full IM Studio owns professional production objects.
- Building SSoT Full is separate from MVP Building SSoT Lite.
- IM Project is the top-level production workspace.
- 18 Full IM sections are first-class objects.
- Expert Patch and Gate Review are first-class objects.
- Evidence is private by default and gate-aware.
- Buyer-ready status requires gate pass.
- Export is blocked if required gates fail.
```

## Next Batch

Batch 5 should define AI Agent / Prompt / Guardrail contracts:

```text
15-ai-agent-contracts.md
16-prompt-contracts.md
17-financial-analysis-guardrails.md
18-risk-boundary-policy.md
19-disclosure-guard-policy.md
20-golden-dataset-extraction.md
```
