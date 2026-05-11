# 24. Section Editor Spec

## 1. Purpose

The Section Editor is the primary production workspace for Full IM sections.

It must combine:

```text
document editing
Building SSoT context
evidence references
AI drafting
risk/disclosure checks
expert patch workflow
version history
```

---

## 2. Route

```text
/im-projects/[projectId]/sections/[sectionId]
```

---

## 3. Layout

### Desktop Three-panel Layout

```text
Left Panel:
- 18-section navigation
- section status
- risk level
- expert requirement

Center Panel:
- section title
- section editor
- AI draft controls
- markdown/rich editor
- version controls

Right Panel:
- B-SSoT source refs
- evidence refs
- risk issues
- disclosure status
- expert patch status
- activity/version history
```

---

## 4. Left Panel — Section Navigation

Each section row shows:

```text
section_order
title
status badge
confidence badge
risk level dot
expert required icon
```

Actions:

```text
filter by needs_data
filter by needs_expert_patch
filter by blocked
jump to next incomplete section
```

---

## 5. Center Panel — Editor

## 5.1 Header

Show:

```text
section title
section type
status
confidence
risk level
last edited
```

Header actions:

```text
[Generate AI Draft]
[Rewrite]
[Request Expert Patch]
[Run Section Gate]
[Mark Ready for Review]
```

---

## 5.2 Editor Modes

```text
Preview
Edit
Diff
Source-linked
```

### Preview

Read-only document view.

### Edit

Markdown/rich editor with section structure.

### Diff

Compare:

```text
AI draft vs expert patch
previous version vs current
reviewer edit vs expert patch
```

### Source-linked

Highlights which text is supported by which source_refs/evidence_refs.

---

## 6. AI Draft Controls

Options:

```text
Generate Draft
Regenerate with More Risk Balance
Rewrite for Buyer Perspective
Add Missing Data Notes
Make More Concise
Make More Professional
```

Before AI generation, show:

```text
source data available
missing data
target output
visibility
risk level
```

After AI generation, show:

```text
AI Draft created
status = ai_draft
source_refs count
missing data count
guardrail result
```

---

## 7. Right Panel — Source / Evidence

Tabs:

```text
SSoT
Evidence
Risk
Disclosure
Expert
History
```

### SSoT Tab

Shows relevant Building SSoT Full layers.

Examples by section:

```text
Rent Roll → lease_income
NOI → lease_income + financial assumptions
Legal → legal_registry
Market → market_location + b2c_consumer_demand
Value-add → value_up_hypothesis + risk_unknown
```

### Evidence Tab

Shows linked evidence:

```text
evidence title
type
visibility
review status
linked claims
```

Actions:

```text
[Link Evidence]
[Request Evidence]
[Mark Needs Redaction]
```

### Risk Tab

Shows:

```text
detected risky language
forbidden claims
required boundary notes
financial guardrail issues
```

### Disclosure Tab

Shows:

```text
target visibility
gate level
protected fields detected
redacted fields
violations
```

### Expert Tab

Shows:

```text
required expert roles
assignments
submitted patches
patch status
```

### History Tab

Shows:

```text
versions
AI runs
expert patches
reviewer edits
gate reviews
```

---

## 8. Section Status Actions

Allowed transitions:

```text
planned → ai_draft
ai_draft → needs_data
ai_draft → needs_expert_patch
ai_draft → gate_review
needs_expert_patch → patched
patched → gate_review
gate_review → buyer_ready
```

Invalid:

```text
ai_draft → buyer_ready without gate
needs_expert_patch → buyer_ready without patch/override
blocked → export
```

---

## 9. Section-specific Templates

Each section should have a structure guide.

Example: Income, NOI & Yield Analysis

```text
1. Input Basis
2. Current Income Summary
3. Assumptions
4. NOI Estimate
5. Yield / Cap Rate Sensitivity
6. Missing Data
7. Caution Note
```

Example: Risk Factors & DD Checklist

```text
Risk
Potential Impact
Evidence Needed
Owner/Broker Answer
Expert Review Needed
Status
```

---

## 10. Guardrail UX

When guardrail detects issue:

```text
This section contains risky wording.
- Issue: “대출 가능합니다”
- Suggested rewrite: “대출 가능성과 조건은 금융기관 심사에 따라 달라질 수 있습니다.”
[Apply Rewrite]
```

When disclosure issue exists:

```text
민감정보가 포함되어 외부 공유가 차단됩니다.
- Field: tenant_name
- Required action: 임차인명을 업종명으로 대체
```

---

## 11. Save Behavior

Autosave:

```text
draft every 5~10 seconds
manual save button
version created on major actions
```

Major actions:

```text
AI draft generated
expert patch applied
reviewer edit
gate review correction
status transition
```

---

## 12. Acceptance Criteria

Section Editor is accepted when:

```text
- 18-section navigation is visible.
- user can edit a section.
- AI draft can be generated and validated.
- evidence/source/risk/disclosure panels are accessible.
- expert patch can be requested.
- section versions are visible.
- invalid buyer-ready transition is blocked.
```
