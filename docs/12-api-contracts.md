# 12. API Contracts

## 1. Purpose

This document defines the initial API contracts for JS Full IM Studio.

All APIs must be schema-validated using Zod and must emit activity events for important mutations.

---

## 2. API Principles

```text
- Validate request body with Zod.
- Validate auth and project membership.
- Use shared contracts where possible.
- Do not expose protected fields.
- Emit activity_event for mutations.
- Log AI calls in ai_runs.
- Return safe errors.
```

---

## 3. Handoff Import APIs

## 3.1 Import from Handoff

```text
POST /api/im-projects/import-from-handoff
```

### Request

```json
{
  "handoff_token": "hof_abc123"
}
```

### Response

```json
{
  "im_project_id": "improj_001",
  "building_ssot_full_id": "bssot_full_001",
  "status": "readiness_pending",
  "next_url": "/im-projects/improj_001/readiness"
}
```

### Side Effects

```text
- validates token
- stores handoff_source_snapshot
- creates building_ssot_full
- creates im_project
- adds current user as project member
- emits handoff_imported
- emits bssot_full_created
- emits im_project_created
```

---

## 3.2 Preview Handoff

```text
GET /api/im-projects/preview-handoff/:token
```

### Response

Safe preview only:

```json
{
  "area_signal": "성수권역",
  "asset_type": "근생형 꼬마빌딩",
  "requested_output": "buyer_ready_full_im",
  "package_intent": "ai_expert_review",
  "expires_at": "2026-05-16T00:00:00Z"
}
```

Must not expose protected fields.

---

## 4. IM Project APIs

## 4.1 Create Project

```text
POST /api/im-projects
```

### Request

```json
{
  "building_ssot_full_id": "bssot_full_001",
  "project_type": "ai_expert_review",
  "target_output": "buyer_ready_full_im",
  "package_intent": "ai_expert_review",
  "title": "성수권역 근생형 자산 Full IM"
}
```

### Response

```json
{
  "im_project_id": "improj_001",
  "status": "intake"
}
```

---

## 4.2 Get Project

```text
GET /api/im-projects/:id
```

### Response

```json
{
  "id": "improj_001",
  "status": "readiness_checked",
  "readiness_score": 78,
  "project_type": "ai_expert_review",
  "target_output": "buyer_ready_full_im",
  "building_summary": {},
  "permissions": {
    "can_edit": true,
    "can_run_gate": false,
    "can_export": false
  }
}
```

Response must be permission-filtered.

---

## 4.3 Update Project

```text
PATCH /api/im-projects/:id
```

Allowed fields:

```text
title
description
project_type
target_output
package_intent
status only via status transition service
```

---

## 5. Readiness APIs

## 5.1 Run Readiness Check

```text
POST /api/im-projects/:id/readiness-check
```

### Response

```json
{
  "project_id": "improj_001",
  "readiness_score": 78,
  "available_outputs": ["blind_teaser", "external_snapshot", "im_lite", "full_im_draft"],
  "blocked_outputs": ["buyer_ready_full_im"],
  "missing_required_data": ["운영비 내역", "수선 이력"],
  "required_expert_patches": [
    {
      "patch_type": "lease_quality_patch",
      "expert_role": "cre_consultant",
      "priority": "high"
    }
  ]
}
```

### Side Effects

```text
- updates im_projects.readiness_score
- emits im_readiness_checked
- may update building_ssot_full.readiness_status
```

---

## 6. Outline / Section APIs

## 6.1 Generate Outline

```text
POST /api/im-projects/:id/generate-outline
```

### Response

```json
{
  "project_id": "improj_001",
  "sections_created": 18
}
```

### Side Effects

```text
- creates 18 im_sections
- emits im_outline_generated
```

---

## 6.2 List Sections

```text
GET /api/im-projects/:id/sections
```

### Response

```json
{
  "sections": [
    {
      "id": "section_001",
      "section_type": "executive_summary",
      "section_order": 2,
      "title": "Executive Summary",
      "status": "planned",
      "confidence": "unknown",
      "risk_level": "medium"
    }
  ]
}
```

---

## 6.3 Get Section

```text
GET /api/im-sections/:id
```

Returns permission-filtered section details.

---

## 6.4 Update Section

```text
PATCH /api/im-sections/:id
```

Allowed:

```text
title
content_json
markdown
status via status service
missing_data
required_evidence
source_refs
evidence_refs
```

Side Effects:

```text
- creates im_section_version
- emits im_section_updated
```

---

## 7. AI Draft APIs

## 7.1 Generate Section Draft

```text
POST /api/im-sections/:id/generate-draft
```

### Request

```json
{
  "prompt_version": "prompt_full_im_section_writer_v1",
  "style": "professional_buyer_ready_draft"
}
```

### Response

```json
{
  "section_id": "section_010",
  "status": "ai_draft",
  "confidence": "needs_evidence",
  "requires_expert_patch": true,
  "markdown": "...",
  "source_refs": []
}
```

### Side Effects

```text
- creates ai_run
- updates im_section
- creates im_section_version
- emits im_section_draft_generated
```

### Must Run

```text
- Zod validation
- RiskBoundary check
- DisclosureGuard check
- source_refs check
```

---

## 7.2 Rewrite Section

```text
POST /api/im-sections/:id/rewrite
```

### Request

```json
{
  "rewrite_type": "risk_balance",
  "instruction": "리스크 균형을 강화해줘"
}
```

Allowed rewrite types:

```text
shorter
more_professional
buyer_perspective
risk_balance
evidence_needed
safe_language
```

---

## 8. Expert APIs

## 8.1 Request Expert Patch

```text
POST /api/im-projects/:id/request-expert-patch
```

### Request

```json
{
  "section_id": "section_010",
  "expert_role": "cre_consultant",
  "assignment_type": "section_patch",
  "instructions": "NOI 표현과 운영비 가정을 검토해주세요."
}
```

### Response

```json
{
  "assignment_id": "assign_001",
  "status": "assigned"
}
```

### Side Effects

```text
- creates expert_assignment
- emits expert_patch_requested
- emits expert_assignment_created
```

---

## 8.2 List Expert Assignments

```text
GET /api/expert/assignments
```

Returns assignments for current expert.

---

## 8.3 Submit Expert Patch

```text
POST /api/expert-patches/:assignmentId/submit
```

### Request

```json
{
  "patch_type": "risk_balance",
  "before_text": "리모델링 후 임대료 상승이 가능합니다.",
  "after_text": "리모델링 후 임대료 재검토 여지는 있으나, 실제 가능성은 공사비, 공실기간, 주변 임대사례 확인이 필요합니다.",
  "edit_tags": ["overclaim_removed", "risk_balance_added", "evidence_needed"],
  "rationale": "기존 표현은 과도한 단정입니다.",
  "visibility_after_review": "buyer_ready",
  "training_rights": "allowed_anonymized"
}
```

### Side Effects

```text
- creates expert_patch
- updates assignment status
- may create section version
- emits expert_patch_submitted
```

---

## 9. Gate Review APIs

## 9.1 Run Gate Review

```text
POST /api/im-projects/:id/run-gate-review
```

### Request

```json
{
  "gate_types": [
    "data_gate",
    "disclosure_gate",
    "risk_gate",
    "financial_consistency_gate"
  ],
  "target": "project"
}
```

### Response

```json
{
  "project_id": "improj_001",
  "overall_status": "revise",
  "gate_reviews": [
    {
      "gate_type": "disclosure_gate",
      "status": "pass",
      "violations": []
    },
    {
      "gate_type": "financial_consistency_gate",
      "status": "revise",
      "violations": [
        {
          "field": "operating_expense_assumption",
          "severity": "medium",
          "message": "운영비 가정이 표시되지 않았습니다."
        }
      ]
    }
  ]
}
```

### Side Effects

```text
- creates gate_reviews
- emits gate_review_completed
```

---

## 9.2 Approve Buyer-ready

```text
POST /api/im-projects/:id/approve-buyer-ready
```

Rules:

```text
- reviewer/admin only
- required gates must pass
- no P0 disclosure violation
- required expert patches completed or override logged
```

Response:

```json
{
  "project_id": "improj_001",
  "status": "buyer_ready"
}
```

---

## 10. Export APIs

## 10.1 Export Markdown

```text
POST /api/im-projects/:id/export/markdown
```

## 10.2 Export PDF

```text
POST /api/im-projects/:id/export/pdf
```

## 10.3 Export Web IM

```text
POST /api/im-projects/:id/export/web
```

## 10.4 Export PPTX-ready

```text
POST /api/im-projects/:id/export/pptx-ready
```

Export rules:

```text
- draft export allowed with draft label
- buyer-ready export requires gate approval
- disclaimer required
- export job must be recorded
```

---

## 11. Q&A Pack APIs

## 11.1 Generate Q&A Pack

```text
POST /api/im-projects/:id/generate-qna-pack
```

### Response

```json
{
  "qna_pack_id": "qna_001",
  "item_count": 18
}
```

---

## 12. Golden Dataset APIs

## 12.1 Create Golden Candidate

```text
POST /api/golden-im-candidates
```

### Request

```json
{
  "section_id": "section_010",
  "expert_patch_id": "patch_001"
}
```

### Side Effects

```text
- extracts AI draft + expert revision
- applies redaction
- sets review_status = candidate
- emits golden_candidate_created
```

---

## 13. Error Response Format

```json
{
  "error": {
    "code": "GATE_REVIEW_REQUIRED",
    "message": "Buyer-ready export requires gate approval.",
    "details": {}
  }
}
```

Common codes:

```text
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
DISCLOSURE_VIOLATION
GATE_REVIEW_REQUIRED
EXPERT_PATCH_REQUIRED
AI_SCHEMA_VALIDATION_FAILED
EXPORT_BLOCKED
```

---

## 14. Acceptance Criteria

API contracts are accepted when:

```text
- all P0 workflows have route contracts.
- all mutating APIs have side effects defined.
- AI APIs require validation and logging.
- gate approval controls buyer-ready output.
- export is blocked when gates fail.
- protected fields are never returned from low-visibility APIs.
```
