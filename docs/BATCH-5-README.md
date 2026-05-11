# Batch 5 README — AI Agent / Prompt / Guardrail Contract

## Purpose

Batch 5 defines the AI layer contracts for JS Full IM Studio.

It covers:

```text
- AI agent contracts
- prompt contracts
- financial guardrails
- risk boundary policy
- disclosure guard policy
- golden dataset extraction
```

## Generated Documents

```text
js-full-im-studio/docs/15-ai-agent-contracts.md
js-full-im-studio/docs/16-prompt-contracts.md
js-full-im-studio/docs/17-financial-analysis-guardrails.md
js-full-im-studio/docs/18-risk-boundary-policy.md
js-full-im-studio/docs/19-disclosure-guard-policy.md
js-full-im-studio/docs/20-golden-dataset-extraction.md
```

## Key Decisions

```text
- AI agents are constrained domain workers, not free-form writers.
- All AI outputs must be schema-validated.
- AI cannot approve buyer-ready output.
- Financial, valuation, legal, tax, loan, and value-add language must be guarded.
- Disclosure Guard blocks protected fields.
- Golden Dataset candidates require rights, redaction, and approval.
```

## Next Batch

Batch 6 should define UI/UX, Expert Workbench, Gate Review Console, and Export Preview specs:

```text
21-information-architecture.md
22-ui-ux-spec.md
23-full-im-studio-dashboard.md
24-section-editor-spec.md
25-expert-workbench-spec.md
26-gate-review-console-spec.md
27-export-preview-spec.md
```
