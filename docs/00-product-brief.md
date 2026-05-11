# 00. Product Brief

## 1. Product Name

```text
System name: JS Full IM Studio
Product line: JS AI+Expert Deal Document System
External name: AI+Expert Full IM Studio
```

## 2. One-line Definition

**JS Full IM Studio** is a professional AI+Expert CRE deal document production system that imports Building SSoT Lite from the MVP, upgrades it into Full Building SSoT, generates AI-assisted Full IM drafts, routes sections to expert patches, runs gate reviews, and exports buyer-ready Full IM packages.

Short version:

> MVP creates the lead and Building SSoT Lite. Full IM Studio turns it into a buyer-ready professional investment memorandum.

---

## 3. Strategic Role in the Ecosystem

JS Building SSoT MVP is the low-friction entry product.

```text
address / Kakao memo
→ Building SSoT Lite
→ blind deal card
→ buyer memo
→ owner readiness
→ Full IM lead
```

JS Full IM Studio is the professional production product.

```text
Building SSoT Lite
→ Full Building SSoT
→ IM Readiness
→ 18-section Full IM
→ Expert Patch
→ Gate Review
→ Export / Deal Room / Golden Dataset
```

The two apps should be separate but interoperable through shared contracts and handoff payloads.

---

## 4. Primary Product Promise

For brokers, owners, and experts:

> Turn fragmented building information, lease summaries, evidence files, and broker notes into a professional buyer-ready Full IM through AI-assisted drafting, expert review, and controlled disclosure.

For JS as a platform:

> Convert every Full IM workflow into structured Building SSoT, expert edits, review events, buyer questions, and Golden Dataset candidates.

---

## 5. Target Users

| User | Main Job |
|---|---|
| Owner / seller | Prepare building for sale and create buyer-ready materials |
| JS broker | Convert building data into professional Full IM and sales workflow |
| IM editor | Edit AI-generated sections and coordinate review |
| Expert | Patch specific sections based on expertise |
| Reviewer | Approve data, disclosure, risk, and buyer-ready status |
| Admin | Manage projects, users, experts, analytics |
| Buyer-side broker | Consume buyer-ready IM, Q&A pack, and evidence index |
| Future partner | Use contracts/API for external IM production |

---

## 6. Core Workflow

```text
1. Import from MVP Handoff
2. Create IM Project
3. Upgrade B-SSoT Lite to Full B-SSoT
4. Run IM Readiness Check
5. Generate Full IM Section Plan
6. Generate AI Section Drafts
7. Edit and enrich sections
8. Request Expert Patches
9. Run Gate Reviews
10. Approve Buyer-ready Full IM
11. Export Web/PDF/Markdown/PPTX-ready outputs
12. Generate Q&A Pack and Evidence Index
13. Extract Golden Dataset candidates
```

---

## 7. Core Objects

```text
building_ssot_full
im_project
im_section
im_section_version
expert_assignment
expert_patch
gate_review
export_job
dealroom_qna_pack
evidence_index
golden_im_candidate
activity_event
ai_run
```

---

## 8. MVP Relationship

The MVP should not become a Full IM production system.

MVP responsibility:

```text
lead generation
lightweight building truth
blind document generation
full IM interest capture
handoff token creation
```

Full IM Studio responsibility:

```text
professional document production
expert review
section-level editing
gate review
buyer-ready approval
export
learning dataset
```

---

## 9. Product Principles

### 9.1 SSoT-first

Full IM must be generated from Building SSoT, not from unstructured prompt text alone.

### 9.2 Evidence-aware

Every key claim should have:

```text
source_ref
confidence label
evidence status
```

### 9.3 Disclosure-safe

Protected fields must be controlled by gate level and visibility policy.

### 9.4 Expert-augmentable

AI drafts must be easy for experts to patch section-by-section.

### 9.5 Buyer-ready only after review

AI draft is not buyer-ready by default.

### 9.6 Dataset-producing

Every AI draft, expert patch, review gate, and buyer reaction should become a potential learning artifact.

---

## 10. Product Differentiation

JS Full IM Studio is not:

```text
generic AI document generator
simple PDF template filler
pretty brochure builder
CRM
data room only
valuation tool
legal/tax advisory tool
```

JS Full IM Studio is:

```text
Building SSoT-based Full IM production system
AI + Expert document workflow
controlled disclosure engine
professional CRE investment memo workbench
Golden Dataset collection pipeline
```

---

## 11. Initial Product Scope

The first production-grade version should include:

```text
1. MVP handoff import
2. Full Building SSoT upgrade wizard
3. IM Readiness Engine
4. 18-section IM Planner
5. AI Section Draft Generator
6. Section Editor
7. Expert Workbench
8. Gate Review Console
9. Web/PDF/Markdown export
10. Q&A Pack generator
11. Evidence Index
12. Golden Dataset candidate extraction
```

---

## 12. Success Criteria

### Product Success

```text
- user can import MVP handoff into Full IM Studio
- user can create a Full IM project
- system can generate 18-section outline
- system can draft at least 6 core sections
- expert can patch assigned section
- gate review can block unsafe output
- buyer-ready approval requires gate pass
- export produces a usable IM package
```

### Commercial Success

```text
- brokers use it for real owner/buyer conversations
- owners understand missing data and professional value
- experts can complete scoped patch work
- Full IM production time is reduced
- buyer-ready quality improves
- repeatable paid package emerges
```

### Data Success

```text
- AI draft and expert patch pairs are captured
- edit tags are structured
- gate review outcomes are stored
- golden candidates are redacted and reviewable
```

---

## 13. Boundary Statement

This system must not claim:

```text
- investment recommendation
- final valuation
- legal conclusion
- tax conclusion
- loan approval
- guaranteed yield
```

It should say:

```text
- preliminary review
- evidence needed
- expert review required
- scenario-based analysis
- buyer-ready after gate review
```

---

## 14. Acceptance Criteria

This product brief is accepted when:

```text
- Full IM Studio is clearly separate from MVP.
- Product workflow is based on Building SSoT.
- Expert Workbench and Gate Review are core, not optional.
- Outputs and non-goals are explicit.
- The product can be developed by AI-pair coding using later SDD docs.
```
