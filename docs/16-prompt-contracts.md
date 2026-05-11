# 16. Prompt Contracts

## 1. Purpose

This document defines prompt contracts for JS Full IM Studio.

Prompt contracts describe:

```text
prompt_id
use case
input schema
output schema
system instruction
forbidden behavior
quality requirements
evaluation examples
```

Actual prompt execution must live in the app code, not in the shared contracts package.

---

## 2. Prompt Versioning

Prompt IDs must be versioned:

```text
prompt_im_readiness_v1
prompt_bssot_upgrade_v1
prompt_im_section_planner_v1
prompt_full_im_section_writer_v1
```

Breaking prompt behavior changes require a new version.

Prompt version must be stored in:

```text
ai_runs.prompt_version
im_section_versions.version_source metadata
document_object.prompt_version
```

---

## 3. Global System Instruction

All Full IM Studio prompts must include the following principles:

```text
You are assisting with commercial real estate investment memorandum production.
You must not invent facts.
You must ground claims in provided Building SSoT, source_refs, and evidence_refs.
You must mark uncertainty and missing data explicitly.
You must not provide investment recommendation, final valuation, legal advice, tax advice, loan approval judgment, or guaranteed yield.
You must use safe language for finance, legal, tax, debt, valuation, and value-add scenarios.
You must respect disclosure policy and protected fields.
All outputs must match the requested structured schema.
```

---

## 4. prompt_im_readiness_v1

### Use Case

Evaluate whether a project is ready for IM Lite, Full IM Draft, or Buyer-ready Full IM.

### Input

```text
IMReadinessAgentInputSchema
```

### Output

```text
IMReadinessAgentOutputSchema
```

### Required Reasoning

The model must evaluate:

```text
asset identity completeness
physical fact completeness
legal/registry evidence
lease/rent roll evidence
income assumptions
market/location evidence
photos/floor plans
risk items
expert patch requirements
disclosure constraints
```

### Forbidden

```text
Do not mark buyer_ready_full_im available without evidence and required gate assumptions.
```

---

## 5. prompt_bssot_upgrade_v1

### Use Case

Upgrade Building SSoT Lite into Building SSoT Full draft.

### Input

```text
BSSoTUpgradeAgentInputSchema
```

### Output

```text
BSSoTUpgradeAgentOutputSchema
```

### Rules

```text
- Map known Lite fields to Full layers.
- Leave unknown fields empty.
- Add missing_data instead of inventing facts.
- Put protected fields into disclosure_gate.
- Preserve source references.
```

---

## 6. prompt_im_section_planner_v1

### Use Case

Generate the 18-section IM plan.

### Input

```text
IMSectionPlannerInputSchema
```

### Output

```text
IMSectionPlannerOutputSchema
```

### Required Sections

Must include all 18 standard sections in correct order.

### Section Status Rules

```text
ready data → planned
missing essential data → needs_data
professional risk → needs_expert_patch
unsafe or impossible section → blocked
```

---

## 7. prompt_full_im_section_writer_v1

### Use Case

Generate one IM section draft.

### Input

```text
FullIMWriterInputSchema
```

### Output

```text
FullIMWriterOutputSchema
```

### Required Section Output

```text
section title
professional narrative
key bullets or tables when useful
source_refs
missing_data
risk notes
boundary note
expert patch requirement
```

### Style

```text
professional
clear
buyer-oriented
risk-balanced
not promotional
not overconfident
```

---

## 8. prompt_financial_commentary_v1

### Use Case

Generate safe financial commentary.

### Required Structure

```text
basis of input
current income view
assumptions
missing assumptions
sensitivity note
caution note
expert review need
```

### Required Boundary Language

```text
본 분석은 제공된 임대차 및 운영비 가정을 기준으로 한 예비 검토이며, 실제 NOI와 현금흐름은 계약서, 운영비, 공실기간, 금융조건 확인 후 달라질 수 있습니다.
```

---

## 9. prompt_rent_roll_analysis_v1

### Use Case

Analyze rent roll and lease quality.

### Must Discuss

```text
lease maturity concentration
vacancy exposure
tenant mix by category
re-pricing possibility as hypothesis
missing lease data
```

### Must Not

```text
name tenants in lower-gate output
say rent can definitely rise
say vacancy risk is absent
```

---

## 10. prompt_valuation_logic_v1

### Use Case

Draft valuation logic and comparable interpretation.

### Must Include

```text
comparison basis
adjustment factors
limitations
missing comps
valuation expert review need when needed
```

### Required Boundary Language

```text
본 비교는 투자검토를 위한 참고용이며, 감정평가 또는 가격 적정성 보증이 아닙니다.
```

---

## 11. prompt_value_add_scenario_v1

### Use Case

Create value-add scenario section.

### Scenario Structure

```text
idea
conditions required
evidence needed
cost/time/vacancy risk
expert review required
possible buyer relevance
```

### Forbidden

```text
리모델링하면 임대료 상승
용도변경 가능
공실 해소 가능
수익률 개선 보장
```

---

## 12. prompt_risk_factor_v1

### Use Case

Generate Risk Factors & DD Checklist.

### Required Columns

```text
Risk
Potential Impact
Evidence Needed
Owner/Broker Answer Needed
Expert Review Needed
Status
```

---

## 13. prompt_disclosure_guard_v1

### Use Case

Redact or block unsafe disclosure.

### Input

```text
text
target_visibility
gate_level
protected_fields
```

### Output

```text
safe_text
redacted_fields
violations
blocked
```

### P0 Rule

If exact address, tenant name, unit rent, seller motivation, or negotiation memo appears in public/blind output, return blocked = true.

---

## 14. prompt_expert_patch_router_v1

### Use Case

Recommend expert assignments by section.

### Expert Roles

```text
cre_consultant
legal_expert
tax_accounting_expert
valuation_expert
architect_building_expert
market_research_expert
debt_financing_expert
```

---

## 15. prompt_gate_review_v1

### Use Case

Assist gate review.

### Must Output

```text
recommended_status
violations
required_actions
reviewer_note_draft
```

### Must Not

```text
approve buyer-ready final status
```

---

## 16. prompt_qna_pack_generator_v1

### Use Case

Generate buyer question starter pack.

### Required Question Types

```text
lease
income
legal
building condition
value-add
debt/financing
market
process
evidence
```

---

## 17. prompt_golden_candidate_extractor_v1

### Use Case

Extract Golden Dataset candidate from AI draft and expert patch.

### Must Include

```text
ai_draft
expert_revision
edit_tags
protected_field_check
training_rights
redaction_status
```

### Must Not

```text
approve training use
include unredacted private data
```

---

## 18. Prompt Evaluation Requirements

Each prompt must have test fixtures for:

```text
valid output
schema failure
forbidden claim
protected field exposure
missing boundary note
low evidence context
```

---

## 19. Acceptance Criteria

Prompt contracts are accepted when:

```text
- every P0 AI workflow has a prompt ID.
- prompts have input/output schemas.
- forbidden behavior is explicit.
- prompts support evaluation tests.
- prompt versions can be logged in ai_runs.
```
