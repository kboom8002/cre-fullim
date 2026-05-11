# 27. Export Preview Spec

## 1. Purpose

The Export Preview screen allows users to generate Web/PDF/Markdown/PPTX-ready outputs from Full IM projects.

Export must be state-aware, gate-aware, and disclosure-safe.

---

## 2. Route

```text
/im-projects/[projectId]/export
```

---

## 3. Export Types

```text
Web IM Preview
Markdown Export
PDF Export
PPTX-ready Export
Deal Room Payload
Evidence Index
Q&A Pack
```

---

## 4. Export Modes

### Draft Export

Allowed before buyer-ready approval.

Requirements:

```text
Draft label
watermark or clear draft status
disclaimer
not for external sharing note
```

### Buyer-ready Export

Allowed only after required gates pass.

Requirements:

```text
buyer_ready project status
no P0 disclosure issues
reviewer/admin approval
final disclaimer
evidence index checked
```

### Internal Export

For team review.

Requirements:

```text
internal_only label
protected fields allowed only for permitted roles
```

---

## 5. Export Screen Layout

### Top

```text
project title
status
target output
gate summary
export eligibility
```

### Left

```text
export type selector
design/theme selector
section inclusion checklist
```

### Center

```text
preview frame
page/section preview
missing issue overlay
```

### Right

```text
gate status
disclosure warnings
risk warnings
evidence index status
export actions
```

---

## 6. Export Eligibility Card

Shows:

```text
Can export draft: Yes/No
Can export buyer-ready: Yes/No
Blocked by:
- Disclosure Gate
- Financial Consistency Gate
- Missing Disclaimer
- Expert Patch Required
```

Example:

```text
Buyer-ready PDF는 아직 생성할 수 없습니다.
Disclosure Gate는 통과했지만 Financial Consistency Gate에 수정 필요 이슈가 있습니다.
```

---

## 7. Section Inclusion Checklist

For each section:

```text
include checkbox
section status
risk level
gate status
evidence status
```

Required sections cannot be excluded from buyer-ready export:

```text
Cover & Confidentiality
Executive Summary
Property Fact Sheet
Risk Factors & DD Checklist
Disclaimer & Contact
```

---

## 8. Preview Requirements

Preview must show:

```text
cover
section order
status labels
boundary note
disclaimer
missing data labels
risk notes
evidence index references
```

Draft preview must show:

```text
DRAFT
AI 초안
Not for external sharing
```

Buyer-ready preview must not show draft labels.

---

## 9. PDF Export

PDF export requirements:

```text
cover page
page numbers
section headings
tables readable
disclaimer included
contact page included
export timestamp
version id
```

If export fails:

```text
create export_job with status failed
show error
allow retry
```

---

## 10. Markdown Export

Markdown export requirements:

```text
frontmatter
section headings
source/evidence references as structured notes
disclaimer
status metadata
```

Example frontmatter:

```yaml
project_id: improj_001
export_type: markdown
status: draft
generated_at: 2026-05-09T00:00:00Z
```

---

## 11. PPTX-ready Export

PPTX production may be placeholder in P0.

PPTX-ready export should produce:

```text
slide outline
section-to-slide mapping
speaker notes draft
visual asset list
table/image placeholders
```

---

## 12. Web IM Preview

Web IM preview should be:

```text
responsive
section-based
gate-aware
shareable only if permitted
```

If not buyer-ready:

```text
view only inside workspace
draft badge visible
```

---

## 13. Deal Room Payload

Deal Room payload includes:

```text
buyer-ready Full IM
Q&A Pack
Evidence Index
allowed evidence refs
visibility rules
gate level requirements
```

Should not implement full Deal Room in P0, only payload generation.

---

## 14. Export Job Lifecycle

```text
queued
→ processing
→ completed
```

Alternative:

```text
queued → blocked
processing → failed
```

---

## 15. Activity Events

Required:

```text
im_export_requested
im_export_blocked
im_exported
export_job_failed
dealroom_payload_created
```

---

## 16. Acceptance Criteria

Export Preview is accepted when:

```text
- export types are visible.
- export eligibility is gate-aware.
- draft export is clearly labeled.
- buyer-ready export is blocked until approval.
- PDF/Markdown/Web export requirements are defined.
- PPTX-ready placeholder is defined.
- Deal Room payload generation is separated from full Deal Room.
```
