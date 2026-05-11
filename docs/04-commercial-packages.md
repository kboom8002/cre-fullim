# 04. Commercial Packages

## 1. Purpose

This document defines the commercial packaging assumptions for JS Full IM Studio.

The goal is not to implement billing in the first version, but to design the product workflow so that paid packages can emerge naturally.

---

## 2. Package Philosophy

Full IM Studio should support multiple service levels:

```text
Self-authoring
AI + Expert Review
Expert Full Build
Deal Room Ready Package
```

The same core system should support all packages through different combinations of:

```text
AI draft depth
expert patch scope
gate review rigor
export format
deal room support
```

---

## 3. Package 1 — AI Self-authoring

### Target User

```text
broker
small owner
consultant
internal JS operator
```

### Value Proposition

> Create an AI-assisted Full IM draft from Building SSoT and edit it yourself.

### Includes

```text
- Full B-SSoT upgrade
- IM Readiness Check
- 18-section outline
- AI section drafts
- basic risk/disclosure checks
- Web preview
- Markdown/PDF draft export
```

### Excludes

```text
- expert review
- buyer-ready approval
- official JS reviewer sign-off
- deal room package
```

### Output Status

```text
Full IM Draft
not Buyer-ready
```

---

## 4. Package 2 — AI + Expert Review

### Target User

```text
broker
building owner
seller-side advisor
```

### Value Proposition

> Generate AI Full IM draft and have selected expert sections reviewed.

### Includes

```text
- everything in AI Self-authoring
- expert patch routing
- 1~3 expert section reviews
- risk balance correction
- disclosure review
- buyer-ready eligibility review
```

### Expert Patch Examples

```text
Lease Quality Patch
Legal Registry Patch
Valuation Logic Patch
Building Condition Patch
```

### Output Status

```text
Reviewed IM
Buyer-ready only after Gate Review
```

---

## 5. Package 3 — Expert Full Build

### Target User

```text
premium owner
serious seller
broker team
institutional-style small building deal
```

### Value Proposition

> JS and expert team build a professional Full IM using AI-assisted workflow.

### Includes

```text
- data intake
- Full B-SSoT build
- all essential sections
- expert review for required risk areas
- reviewer gate approval
- design polish
- PDF/Web IM output
```

### Output Status

```text
Buyer-ready Full IM
```

---

## 6. Package 4 — Deal Room Ready Package

### Target User

```text
seller-side mandate
active sale process
multi-buyer process
co-broker network process
```

### Value Proposition

> Prepare buyer-ready IM plus Q&A Pack and evidence structure for controlled disclosure.

### Includes

```text
- Buyer-ready Full IM
- Deal Room Q&A Starter
- Evidence Index
- Gate-based document sharing payload
- buyer question preparation
- export/publish support
```

### Output Status

```text
Deal Room Ready Package
```

---

## 7. Package Comparison

| Feature | Self-authoring | AI+Expert Review | Expert Full Build | Deal Room Package |
|---|---:|---:|---:|---:|
| B-SSoT Upgrade | Yes | Yes | Yes | Yes |
| Readiness Check | Yes | Yes | Yes | Yes |
| AI Draft | Yes | Yes | Yes | Yes |
| Expert Patch | No | Limited | Full | Full |
| Gate Review | Basic | Yes | Yes | Yes |
| Buyer-ready Approval | No | Conditional | Yes | Yes |
| PDF Export | Draft | Reviewed | Buyer-ready | Buyer-ready |
| Q&A Pack | No | Optional | Optional | Yes |
| Evidence Index | Basic | Basic | Yes | Yes |
| Deal Room Payload | No | No | Optional | Yes |

---

## 8. Monetization Hypotheses

These are planning assumptions, not implementation requirements.

```text
AI Self-authoring:
- low subscription or per-project fee

AI + Expert Review:
- per-section expert review fee
- package fee

Expert Full Build:
- premium service fee

Deal Room Ready Package:
- highest service tier
- possible success/retainer hybrid later
```

The first version should not implement billing.

Instead it should track:

```text
package_selected
expert_patch_requested
buyer_ready_requested
export_requested
dealroom_package_requested
```

---

## 9. Product Design Implications

The system must support:

```text
- project_type
- target_output
- required_expert_patches
- buyer_ready_status
- export_status
- package_intent
```

But it should not require payment flows in P0.

---

## 10. Conversion Path from MVP

MVP CTAs should map to packages:

```text
Full IM 가능 여부 확인
→ AI Self-authoring or AI+Expert Review

전문가 3줄 코멘트
→ AI+Expert Review

매각자료 제작 상담
→ Expert Full Build

Deal Room 구성 요청
→ Deal Room Ready Package
```

---

## 11. Commercial Readiness Metrics

Track:

```text
handoff_created
handoff_imported
package_selected
readiness_checked
expert_patch_requested
buyer_ready_requested
export_requested
dealroom_package_requested
```

Conversion indicators:

```text
- readiness score high enough for Full IM
- expert patch request count
- export request count
- buyer-ready approval count
- repeat broker usage
```

---

## 12. Acceptance Criteria

Commercial package spec is accepted when:

```text
- packages map to actual system workflows.
- no billing is required in P0.
- package selection can guide UX and analytics.
- Expert Workbench and Gate Review support paid tiers.
- MVP handoff can route users into the right package.
```
