# 02. Scope and Boundaries

## 1. Purpose

This document locks the product scope for the first production-oriented version of JS Full IM Studio.

The goal is to develop a professional Full IM production system that is separate from, but integrated with, JS Building SSoT MVP.

---

## 2. Product Scope Statement

JS Full IM Studio handles:

```text
MVP handoff
→ Full B-SSoT upgrade
→ IM readiness
→ 18-section Full IM planning
→ AI section drafting
→ expert patch
→ gate review
→ export
→ Q&A Pack
→ Golden Dataset candidate extraction
```

It does not replace the MVP's public and broker utility workflows.

---

## 3. P0 Scope — Must Build

These are required for the first serious working version.

### 3.1 MVP Handoff Import

```text
- accept handoff token
- validate handoff payload
- import Building SSoT Lite
- import source document references
- create Full IM project
- record handoff_imported event
```

### 3.2 Full B-SSoT Upgrade

```text
- upgrade Building SSoT Lite to Building SSoT Full
- allow evidence upload / linking
- mark missing data
- support source_refs and evidence_refs
```

### 3.3 IM Readiness Engine

```text
- calculate readiness score
- list available outputs
- list blocked outputs
- identify missing required data
- identify required expert patches
```

### 3.4 Full IM Project Manager

```text
- create project
- project dashboard
- project status transitions
- project owner / broker / editor roles
```

### 3.5 18-section IM Planner

Required sections:

```text
1. Cover & Confidentiality
2. Executive Summary
3. Investment Thesis & Buyer Fit
4. Property Fact Sheet
5. Land, Zoning & Legal Constraints
6. Location & Access
7. Micro-market & Demand Story
8. Building Condition & Physical Review
9. Rent Roll & Lease Quality
10. Income, NOI & Yield Analysis
11. Debt Sensitivity & Cash Flow
12. Valuation Logic & Comparables
13. Value-add & Repositioning Scenario
14. Risk Factors & DD Checklist
15. Deal Process & Next Steps
16. Deal Room Q&A Starter
17. Appendix / Evidence Index
18. Disclaimer & Contact
```

### 3.6 AI Section Draft

```text
- generate section draft
- include source_refs
- include confidence label
- include missing data / risk notes
- apply forbidden claim check
- apply disclosure guard
```

### 3.7 Section Editor

```text
- section list
- editor panel
- evidence/source panel
- risk/disclosure panel
- section status controls
```

### 3.8 Expert Workbench

```text
- expert assignment list
- assigned section view
- AI draft view
- evidence view
- expert patch submission
- edit tags
- visibility after review
```

### 3.9 Gate Review Console

```text
- Data Gate
- Disclosure Gate
- Risk Gate
- Financial Consistency Gate
- Expert Scope Gate
- Buyer-ready Approval Gate
```

### 3.10 Export

```text
- Web IM preview
- Markdown export
- PDF export
- PPTX-ready export placeholder
```

### 3.11 Q&A Pack and Evidence Index

```text
- generate expected buyer questions
- show answer availability
- link needed evidence
- create evidence index
```

### 3.12 Golden Dataset Candidate Extraction

```text
- capture AI draft and expert patch pairs
- store edit tags
- apply redaction
- track training rights
- create candidate object
```

---

## 4. P1 Scope — Should Build After P0

```text
- PPTX export production quality
- collaborative comments
- reviewer assignment workflow
- expert SLA / due dates
- richer financial tables
- section version diff viewer
- buyer-specific Full IM variant
- Deal Room publish integration
- advanced export design themes
```

---

## 5. P2 Scope — Later

```text
- payment / billing
- expert marketplace
- partner API
- external buyer portal
- multi-asset portfolio IM
- advanced comp database
- valuation model integration
- lender package
- legal/tax partner workflow
```

---

## 6. Explicit Non-goals for First Version

Do not build:

```text
- public lead generation pages
- 1-minute broker deal card
- automatic valuation
- final legal advice
- final tax advice
- loan approval prediction
- investment recommendation
- full investor portal
- full marketplace settlement
- unrestricted data room
```

These belong to MVP, future Deal Room, or future marketplace products.

---

## 7. Product Boundary with MVP

| Function | MVP | Full IM Studio |
|---|---|---|
| Public building radar | Yes | No |
| 1-minute broker deal card | Yes | No |
| Building SSoT Lite | Yes | Import only |
| Full Building SSoT | No | Yes |
| Expert Patch | No | Yes |
| Full IM drafting | No | Yes |
| Gate Review | Basic | Full |
| Export | Basic document output | Web/PDF/Markdown/PPTX-ready |
| Golden Dataset | No | Yes |

---

## 8. Definition of Done

P0 is complete when:

```text
- handoff import works
- Full B-SSoT is created
- readiness check runs
- 18 sections are generated
- at least 6 key sections can be AI drafted
- expert can patch a section
- gate review can block unsafe output
- buyer-ready approval requires gate pass
- Web/Markdown/PDF export works
- Q&A Pack and Evidence Index are generated
- Golden Dataset candidate can be created from AI draft + expert patch
```

---

## 9. Acceptance Criteria

This scope document is accepted when:

```text
- P0/P1/P2 are clearly separated.
- MVP and Full IM Studio responsibilities do not overlap.
- Professional workflow requirements are included.
- Non-goals prevent overbuilding.
- AI-pair coding can use this as the scope lock.
```
