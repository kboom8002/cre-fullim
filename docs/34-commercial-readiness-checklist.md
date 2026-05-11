# 34. Commercial Readiness Checklist

## 1. Purpose

This checklist defines what “commercially ready for pilot” means for JS Full IM Studio.

This is not full enterprise readiness. It is the minimum quality bar for serious broker/expert/owner pilot use.

---

## 2. Product Readiness

```text
□ MVP handoff import works
□ Full B-SSoT is created
□ IM Project is created
□ Readiness Score is shown
□ 18-section outline is generated
□ Core sections can be AI drafted
□ Section Editor is usable
□ Expert Workbench is usable
□ Gate Review blocks unsafe output
□ Export Preview works
□ Q&A Pack can be generated
□ Golden Dataset candidate can be created
```

---

## 3. Core Section Readiness

At least these sections should work well before pilot:

```text
□ Executive Summary
□ Investment Thesis & Buyer Fit
□ Property Fact Sheet
□ Rent Roll & Lease Quality
□ Income, NOI & Yield Analysis
□ Risk Factors & DD Checklist
□ Deal Process & Next Steps
□ Disclaimer & Contact
```

---

## 4. AI Safety Readiness

```text
□ AI outputs pass Zod schema
□ Boundary note appears on buyer-facing outputs
□ Forbidden claims are blocked/revised
□ Financial assumptions are shown
□ Legal/tax/loan claims are guarded
□ Value-add scenarios include conditions and risks
□ AI cannot approve buyer-ready
```

---

## 5. Disclosure Readiness

```text
□ exact address blocked in public/blind output
□ tenant name blocked in public/blind output
□ unit rent blocked or summarized by gate
□ seller motivation blocked externally
□ negotiation memo blocked externally
□ evidence files are private by default
□ signed URLs require permission
□ Disclosure Gate runs before buyer-ready export
```

---

## 6. Expert Workflow Readiness

```text
□ expert assignment can be created
□ expert sees assigned sections only
□ expert can view relevant evidence
□ expert can submit patch
□ edit_tags are required
□ training_rights are captured
□ reviewer can request revision
□ expert patch is auditable
```

---

## 7. Gate Review Readiness

```text
□ Data Gate works
□ Disclosure Gate works
□ Risk Gate works
□ Financial Consistency Gate works
□ Expert Scope Gate works
□ Buyer-ready Approval Gate works
□ P0 issue blocks approval
□ override requires reason
□ gate events are recorded
```

---

## 8. Export Readiness

```text
□ draft export has draft label
□ buyer-ready export requires approval
□ disclaimer included
□ export job status tracked
□ Markdown export works
□ PDF export works or documented placeholder exists
□ Web IM preview works
□ PPTX-ready outline exists
```

---

## 9. Permission Readiness

```text
□ unauthenticated user cannot access project
□ non-member cannot view project
□ expert cannot see unrelated section
□ broker cannot approve buyer-ready
□ reviewer/admin can approve when gates pass
□ admin can access analytics
```

---

## 10. Analytics / Audit Readiness

```text
□ handoff_imported event recorded
□ im_project_created event recorded
□ readiness event recorded
□ section draft event recorded
□ expert patch event recorded
□ gate review event recorded
□ export event recorded
□ safety events recorded
□ activity timeline visible
```

---

## 11. UX Readiness

```text
□ dashboard shows next best action
□ readiness explains missing data
□ section editor shows source/evidence/risk/disclosure
□ expert workbench is assignment-focused
□ gate review shows required actions
□ export preview explains blocked state
□ empty states are helpful
□ error states are safe
```

---

## 12. Performance / Reliability

```text
□ app route loads reliably
□ dashboard loads within acceptable time
□ long AI operations show loading state
□ export jobs show queued/processing/completed
□ errors do not expose private data
□ retry path exists for failed AI/export jobs
```

---

## 13. Pilot Readiness Score

Score each area 0~2.

```text
0 = not ready
1 = partial
2 = ready
```

Areas:

```text
Product flow
AI safety
Disclosure
Expert workflow
Gate review
Export
Permissions
Analytics
UX
Reliability
```

Pilot threshold:

```text
minimum 16 / 20
no P0 disclosure issue
buyer-ready approval guard working
```

---

## 14. Not Required for Pilot

```text
payment
full expert marketplace
full dealroom
advanced valuation model
external investor portal
multi-tenant enterprise admin
advanced PPTX design engine
```

---

## 15. Acceptance Criteria

Commercial readiness checklist is accepted when:

```text
- pilot readiness is measurable.
- P0 blockers are explicit.
- no payment/marketplace overbuild is required.
- professional workflow quality is covered.
```
