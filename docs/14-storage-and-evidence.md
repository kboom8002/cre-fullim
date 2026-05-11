# 14. Storage and Evidence

## 1. Purpose

This document defines how JS Full IM Studio stores, classifies, reviews, and exposes evidence files.

Evidence is essential for Full IM quality, but it is also one of the highest-risk areas for disclosure leakage.

---

## 2. Evidence Principles

```text
- Evidence is private by default.
- Evidence must have type, visibility, and review status.
- Evidence access is role- and gate-aware.
- Buyer-ready output should reference evidence without exposing restricted raw files.
- Evidence used for training must have explicit rights and redaction.
```

---

## 3. Storage Buckets

Recommended Supabase Storage buckets:

```text
full-im-evidence-private
full-im-export-private
full-im-export-shared
full-im-thumbnails
```

### 3.1 full-im-evidence-private

Contains:

```text
building register
registry
land use plan
lease summary
rent roll
full lease contracts
photos
floor plans
repair history
expert memos
```

Default:

```text
private
signed URL only
role/gate checked
```

### 3.2 full-im-export-private

Contains:

```text
draft PDF
draft markdown
internal exports
reviewer exports
```

Default:

```text
private
```

### 3.3 full-im-export-shared

Contains:

```text
buyer-ready PDF
approved Web IM assets
approved dealroom payload assets
```

Default:

```text
private or controlled signed URL
not public by default
```

### 3.4 full-im-thumbnails

Contains:

```text
image thumbnails
redacted preview images
```

Only redacted thumbnails can be shared at lower gate levels.

---

## 4. Evidence Types

```text
building_register
registry
land_use_plan
lease_summary
rent_roll
full_lease_contract
photo
floor_plan
repair_history
market_comp
rent_comp
expert_memo
owner_note
broker_note
other
```

---

## 5. Evidence Visibility

```text
private_truth
internal_only
gate_restricted
buyer_ready
public_blind
blocked
```

### Meaning

| Visibility | Meaning |
|---|---|
| private_truth | raw source, highly restricted |
| internal_only | internal project team only |
| gate_restricted | available after appropriate gate |
| buyer_ready | approved for buyer-ready package |
| public_blind | redacted and safe |
| blocked | cannot be shared |

---

## 6. Evidence Review Status

```text
uploaded
parsed
reviewed
needs_redaction
buyer_ready
internal_only
blocked
```

---

## 7. Evidence Metadata

Each evidence file should store:

```text
project_id
building_ssot_full_id
uploaded_by
evidence_type
title
storage_path
source_uri
visibility
review_status
contains_sensitive_data
training_allowed
metadata
created_at
updated_at
```

Metadata may include:

```text
file_size
mime_type
page_count
extracted_text_available
redaction_required
linked_sections
```

---

## 8. Access Rules

### Owner

Can upload and view own uploaded evidence unless restricted by reviewer/admin.

### Broker / IM Editor

Can view project evidence needed for document production.

### Expert

Can view evidence linked to assigned section or explicitly shared with assignment.

### Reviewer / Admin

Can view all project evidence.

### Buyer / External

Can view only buyer_ready or gate-approved evidence.

---

## 9. Signed URL Policy

Signed URLs require:

```text
user permission
project membership
evidence visibility check
gate level check
expiration
activity event
```

Never issue signed URL for:

```text
blocked evidence
private_truth evidence to external users
full lease contracts without G5/DD permission
```

---

## 10. Evidence Linking

Evidence can link to:

```text
building_ssot_full layer
im_section
expert_assignment
expert_patch
gate_review
qna_item
```

Example:

```text
rent_roll.pdf
→ lease_income layer
→ rent_roll_lease_quality section
→ income_noi_yield_analysis section
```

---

## 11. Redaction Rules

Evidence that contains protected fields must be redacted before low-gate sharing.

Protected fields:

```text
exact_address
tenant_name
unit_rent
owner_contact
buyer_contact
seller_motivation
negotiation_memo
full lease terms
personal information
```

Redacted derivatives should be stored as separate files with their own evidence record.

---

## 12. Evidence Index

Every buyer-ready Full IM should have an Evidence Index.

Evidence Index includes:

```text
evidence title
evidence type
review status
visibility
linked section
available to buyer?
notes
```

Do not include private storage paths in buyer-facing Evidence Index.

---

## 13. Training Rights

Evidence files can be used for training only if:

```text
training_allowed = true
redaction complete
rights confirmed
reviewer/admin approved
```

Default:

```text
training_allowed = false
```

---

## 14. Activity Events

Required events:

```text
evidence_uploaded
evidence_reviewed
evidence_redaction_required
evidence_redacted
evidence_linked_to_section
evidence_signed_url_created
evidence_blocked
```

Event metadata must not include raw evidence content.

---

## 15. Acceptance Criteria

Storage and Evidence spec is accepted when:

```text
- buckets are defined.
- evidence visibility and review statuses are defined.
- role/gate-aware access is defined.
- signed URL policy is explicit.
- redaction and training rights are addressed.
- Evidence Index supports buyer-ready package.
```
