# 15. AI Agent Contracts

## 1. Purpose

This document defines the AI agent contracts for **JS Full IM Studio**.

AI agents in this system must not behave like free-form writers. They must act as constrained domain workers that read structured Building SSoT data, produce schema-validated outputs, respect disclosure policy, and create auditable AI run records.

---

## 2. Global AI Agent Rules

Every AI agent must follow these rules:

```text
1. Do not invent facts.
2. Use Building SSoT Full, source_refs, and evidence_refs as primary context.
3. Mark uncertainty explicitly.
4. Use safe language for finance, legal, tax, loan, valuation, and value-add statements.
5. Do not expose protected fields in lower-visibility outputs.
6. Produce structured output that passes Zod validation.
7. Log model, prompt_version, input_ref, output_ref, status, and error if any.
8. AI-generated content defaults to draft.
9. Buyer-ready approval is never performed by AI.
```

---

## 3. Shared Input Context

Most agents receive a subset of this context:

```ts
export const FullIMAgentContextSchema = z.object({
  project_id: z.string(),
  building_ssot_full_id: z.string(),
  building_ssot_full: z.record(z.string(), z.any()),
  target_output: z.enum([
    "external_snapshot",
    "im_lite",
    "buyer_ready_full_im",
    "dealroom_ready_package"
  ]),
  gate_level: z.enum(["G0", "G1", "G2", "G3", "G4", "G5"]).optional(),
  visibility: z.string().optional(),
  source_refs: z.array(z.any()).default([]),
  evidence_refs: z.array(z.any()).default([]),
  prior_sections: z.array(z.any()).default([]),
  boundary_policy: z.record(z.string(), z.any()).optional()
});
```

---

## 4. IMReadinessAgent

### Role

Determines whether the project has enough data to generate specific IM outputs.

### Input

```ts
export const IMReadinessAgentInputSchema = z.object({
  project_id: z.string(),
  building_ssot_full: z.record(z.string(), z.any()),
  target_output: z.string(),
  evidence_refs: z.array(z.any()).default([])
});
```

### Output

```ts
export const IMReadinessAgentOutputSchema = z.object({
  readiness_score: z.number().min(0).max(100),
  available_outputs: z.array(z.string()),
  blocked_outputs: z.array(z.string()),
  missing_required_data: z.array(z.string()),
  required_expert_patches: z.array(z.object({
    patch_type: z.string(),
    expert_role: z.string(),
    reason: z.string(),
    priority: z.enum(["low", "medium", "high"])
  })),
  section_readiness: z.array(z.object({
    section_type: z.string(),
    status: z.enum(["ready", "partial", "blocked"]),
    missing_data: z.array(z.string()).default([]),
    expert_required: z.boolean()
  })),
  boundary_note: z.string()
});
```

### Must Not

```text
- mark buyer-ready if required gates have not passed
- treat missing rent roll as complete
- treat unverified numbers as confirmed
```

---

## 5. BSSoTUpgradeAgent

### Role

Upgrades Building SSoT Lite and handoff snapshot into Building SSoT Full draft.

### Input

```ts
export const BSSoTUpgradeAgentInputSchema = z.object({
  handoff_source_snapshot: z.record(z.string(), z.any()),
  building_ssot_lite: z.record(z.string(), z.any()),
  source_documents: z.array(z.any()).default([]),
  evidence_refs: z.array(z.any()).default([])
});
```

### Output

```ts
export const BSSoTUpgradeAgentOutputSchema = z.object({
  building_ssot_full_patch: z.record(z.string(), z.any()),
  missing_data: z.array(z.string()),
  protected_fields_detected: z.array(z.string()),
  warnings: z.array(z.string()),
  readiness_status: z.enum([
    "lite_imported",
    "needs_data",
    "im_lite_ready",
    "full_im_draft_ready",
    "buyer_ready_candidate"
  ])
});
```

### Must Not

```text
- overwrite original MVP source
- invent exact facts
- move protected fields into public layers
```

---

## 6. IMSectionPlannerAgent

### Role

Creates or updates the 18-section Full IM plan.

### Input

```ts
export const IMSectionPlannerInputSchema = z.object({
  project_id: z.string(),
  building_ssot_full: z.record(z.string(), z.any()),
  readiness_result: z.record(z.string(), z.any()),
  target_output: z.string()
});
```

### Output

```ts
export const IMSectionPlannerOutputSchema = z.object({
  sections: z.array(z.object({
    section_type: z.string(),
    section_order: z.number(),
    title: z.string(),
    status: z.enum(["planned", "needs_data", "needs_expert_patch", "blocked"]),
    confidence: z.enum(["confirmed", "inferred", "needs_evidence", "expert_required", "unknown"]),
    risk_level: z.enum(["low", "medium", "high", "blocked"]),
    requires_expert_patch: z.boolean(),
    required_expert_roles: z.array(z.string()).default([]),
    missing_data: z.array(z.string()).default([]),
    required_evidence: z.array(z.string()).default([]),
    allowed_language: z.array(z.string()).default([])
  }))
});
```

### Must Include

All 18 standard IM sections.

---

## 7. FullIMWriterAgent

### Role

Generates a draft for one Full IM section.

### Input

```ts
export const FullIMWriterInputSchema = z.object({
  project_id: z.string(),
  section_id: z.string(),
  section_type: z.string(),
  section_title: z.string(),
  building_ssot_full: z.record(z.string(), z.any()),
  evidence_refs: z.array(z.any()).default([]),
  source_refs: z.array(z.any()).default([]),
  target_output: z.string(),
  writing_style: z.enum([
    "professional_draft",
    "buyer_ready_candidate",
    "risk_balanced",
    "concise",
    "technical"
  ]).default("professional_draft")
});
```

### Output

```ts
export const FullIMWriterOutputSchema = z.object({
  section_type: z.string(),
  title: z.string(),
  markdown: z.string(),
  content_json: z.record(z.string(), z.any()).default({}),
  confidence: z.enum(["confirmed", "inferred", "needs_evidence", "expert_required", "unknown"]),
  risk_level: z.enum(["low", "medium", "high", "blocked"]),
  source_refs: z.array(z.any()).default([]),
  evidence_refs: z.array(z.any()).default([]),
  missing_data: z.array(z.string()).default([]),
  requires_expert_patch: z.boolean(),
  boundary_note: z.string()
});
```

### Must Not

```text
- produce buyer-ready approval
- cite unavailable evidence
- guarantee yield, loan, valuation, legal, tax, or value-add result
```

---

## 8. FinancialCommentaryAgent

### Role

Generates safe commentary around rent, NOI, yield, cap rate, debt sensitivity, and cash flow assumptions.

### Input

```ts
export const FinancialCommentaryInputSchema = z.object({
  lease_income: z.record(z.string(), z.any()),
  assumptions: z.record(z.string(), z.any()).default({}),
  target_section: z.enum([
    "rent_roll_lease_quality",
    "income_noi_yield_analysis",
    "debt_sensitivity_cash_flow",
    "valuation_logic_comparables"
  ])
});
```

### Output

```ts
export const FinancialCommentaryOutputSchema = z.object({
  commentary: z.string(),
  assumptions_used: z.array(z.string()),
  missing_assumptions: z.array(z.string()),
  caution_notes: z.array(z.string()),
  safe_numeric_summary: z.record(z.string(), z.any()).default({}),
  requires_expert_patch: z.boolean()
});
```

### Must Include

```text
- input basis
- assumptions
- missing data
- sensitivity language
- disclaimer if debt/yield/NOI is mentioned
```

---

## 9. ValuationLogicAgent

### Role

Creates preliminary valuation logic and comparable analysis language without giving final valuation.

### Must Not

```text
- say price is fair
- say asset is undervalued
- provide final appraised value
- guarantee marketability
```

### Must Include

```text
- comparable limitations
- adjustment factors
- evidence needed
- valuation expert review flag when needed
```

---

## 10. ValueAddScenarioAgent

### Role

Creates value-add and repositioning scenario language.

### Must Include

```text
- idea
- condition needed
- cost/time/vacancy risk
- evidence needed
- expert review need
```

### Must Not

```text
- claim rent will rise
- claim vacancy will be solved
- claim conversion is possible without permit/legal review
```

---

## 11. RiskBoundaryAgent

### Role

Detects and rewrites unsafe claims.

### Input

```ts
export const RiskBoundaryInputSchema = z.object({
  text: z.string(),
  context_type: z.enum([
    "full_im_section",
    "financial_commentary",
    "valuation_logic",
    "value_add",
    "legal_tax",
    "debt"
  ])
});
```

### Output

```ts
export const RiskBoundaryOutputSchema = z.object({
  safe_text: z.string(),
  detected_issues: z.array(z.object({
    issue_type: z.string(),
    severity: z.enum(["low", "medium", "high", "p0"]),
    original_text: z.string(),
    replacement_text: z.string()
  })),
  blocked: z.boolean()
});
```

---

## 12. DisclosureGuardAgent

### Role

Prevents protected information from appearing in wrong visibility/gate outputs.

### Must Detect

```text
exact_address
tenant_name
unit_rent
seller_motivation
negotiation_memo
internal_broker_note
owner_contact
buyer_contact
full_lease_contract details
```

### Output

```ts
export const DisclosureGuardOutputSchema = z.object({
  safe_text: z.string(),
  redacted_fields: z.array(z.string()),
  violations: z.array(z.object({
    field: z.string(),
    severity: z.enum(["low", "medium", "high", "p0"]),
    recommended_action: z.string()
  })),
  blocked: z.boolean()
});
```

---

## 13. ExpertPatchRouterAgent

### Role

Recommends which sections require which expert roles.

### Output

```ts
export const ExpertPatchRouterOutputSchema = z.object({
  required_patches: z.array(z.object({
    section_type: z.string(),
    expert_role: z.string(),
    patch_type: z.string(),
    reason: z.string(),
    priority: z.enum(["low", "medium", "high"])
  }))
});
```

---

## 14. GateReviewAgent

### Role

Assists reviewer by detecting data, disclosure, risk, and financial issues.

AI may recommend gate results but cannot approve buyer-ready status.

### Output

```ts
export const GateReviewAgentOutputSchema = z.object({
  gate_type: z.string(),
  recommended_status: z.enum(["pass", "revise", "expert_required", "blocked", "internal_only"]),
  violations: z.array(z.any()).default([]),
  required_actions: z.array(z.string()).default([]),
  reviewer_note_draft: z.string().optional()
});
```

---

## 15. ExportNarrativeAgent

### Role

Creates export-ready narrative summaries and section transitions.

Must maintain safe language and disclaimer.

---

## 16. DealRoomQAPackAgent

### Role

Generates expected buyer questions and answer-readiness status.

### Output

```ts
export const QAPackAgentOutputSchema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    answer_status: z.enum(["answer_ready", "needs_owner_answer", "needs_evidence", "expert_required"]),
    draft_answer: z.string().optional(),
    required_evidence: z.array(z.string()).default([]),
    visibility: z.string(),
    expert_required: z.boolean()
  }))
});
```

---

## 17. GoldenDatasetExtractorAgent

### Role

Extracts training/evaluation candidates from AI draft + expert patch + gate review.

### Must Not

```text
- include protected fields
- include data without training rights
- auto-approve golden dataset
```

---

## 18. Acceptance Criteria

AI agent contracts are accepted when:

```text
- each agent has role, input, output, and forbidden behavior.
- financial, legal, tax, loan, and valuation risks are controlled.
- disclosure protection is explicit.
- all AI output is schema-validated.
- AI cannot approve buyer-ready output.
- AI runs are auditable.
```
