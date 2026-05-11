# 06. Handoff API Contract

## 1. Purpose

This document defines the API contract for passing a Full IM production opportunity from JS Building SSoT MVP to JS Full IM Studio.

The handoff API is the only approved product-level bridge between the two apps.

---

## 2. Handoff Lifecycle

```text
created
→ pending_import
→ imported
→ expired
→ revoked
→ failed
```

---

## 3. Handoff Payload Schema

```ts
export const FullIMHandoffPayloadSchema = z.object({
  handoff_id: z.string(),
  handoff_token: z.string(),

  source_app: z.literal("js-building-ssot-mvp"),
  source_app_version: z.string().optional(),
  contracts_version: z.string(),
  payload_version: z.string().default("1.0"),

  source_building_ssot_lite_id: z.string(),

  source_document_ids: z.array(z.string()).default([]),

  source_buyer_intent_id: z.string().optional(),
  source_owner_readiness_id: z.string().optional(),
  source_expert_note_request_id: z.string().optional(),

  requested_output: z.enum([
    "im_lite",
    "buyer_ready_full_im",
    "expert_review",
    "expert_full_build",
    "dealroom_ready_package"
  ]),

  package_intent: z.enum([
    "ai_self_authoring",
    "ai_expert_review",
    "expert_full_build",
    "dealroom_ready_package",
    "unknown"
  ]).default("unknown"),

  created_by: z.string().optional(),
  actor_role: z.enum([
    "public_user",
    "owner",
    "broker",
    "admin",
    "system"
  ]),

  source_visibility_level: z.enum([
    "public",
    "public_blind",
    "registered_interest",
    "qualified_summary",
    "gate_restricted",
    "internal_only",
    "private_truth"
  ]),

  allowed_import_scope: z.array(z.enum([
    "building_ssot_lite",
    "source_documents",
    "buyer_intent",
    "owner_readiness",
    "expert_note",
    "evidence_refs"
  ])).default(["building_ssot_lite"]),

  expires_at: z.string().datetime(),
  created_at: z.string().datetime()
});
```

---

## 4. MVP Side API

### 4.1 Create Handoff

```text
POST /api/full-im-handoffs
```

#### Request

```json
{
  "source_building_ssot_lite_id": "bsl_001",
  "source_document_ids": ["doc_001", "doc_002"],
  "source_buyer_intent_id": "buyer_001",
  "source_owner_readiness_id": "own_ready_001",
  "requested_output": "buyer_ready_full_im",
  "package_intent": "ai_expert_review"
}
```

#### Response

```json
{
  "handoff_id": "handoff_001",
  "handoff_token": "hof_abc123",
  "handoff_url": "https://fullim.example.com/import?handoff_token=hof_abc123",
  "expires_at": "2026-05-16T00:00:00Z",
  "status": "created"
}
```

#### Side Effects

```text
- creates handoff record
- records full_im_handoff_created event
- does not expose protected fields in response
```

---

### 4.2 Get Handoff

```text
GET /api/full-im-handoffs/:token
```

This endpoint should be callable by Full IM Studio server only or by a secure handoff validation layer.

#### Response

```json
{
  "handoff_id": "handoff_001",
  "status": "pending_import",
  "payload": {
    "source_app": "js-building-ssot-mvp",
    "contracts_version": "0.2.0",
    "payload_version": "1.0",
    "source_building_ssot_lite_id": "bsl_001",
    "source_document_ids": ["doc_001"],
    "requested_output": "buyer_ready_full_im",
    "package_intent": "ai_expert_review"
  }
}
```

---

### 4.3 Revoke Handoff

```text
POST /api/full-im-handoffs/:id/revoke
```

Used when user or admin cancels the request.

---

## 5. Full IM Studio Side API

### 5.1 Import from Handoff

```text
POST /api/im-projects/import-from-handoff
```

#### Request

```json
{
  "handoff_token": "hof_abc123"
}
```

#### Process

```text
1. validate token format
2. call MVP handoff validation endpoint
3. verify status and expiry
4. validate payload against FullIMHandoffPayloadSchema
5. verify user permission
6. fetch/import allowed source objects
7. create building_ssot_full
8. create im_project
9. attach source refs
10. update handoff status to imported
11. record handoff_imported event
```

#### Response

```json
{
  "im_project_id": "improj_001",
  "building_ssot_full_id": "bssot_full_001",
  "status": "readiness_pending",
  "next_url": "/im-projects/improj_001/readiness"
}
```

---

### 5.2 Preview Handoff

```text
GET /api/im-projects/preview-handoff/:token
```

Purpose:

```text
show safe preview before import
```

Response should be public-safe:

```json
{
  "area_signal": "성수권역",
  "asset_type": "근생형 꼬마빌딩",
  "requested_output": "buyer_ready_full_im",
  "package_intent": "ai_expert_review",
  "expires_at": "2026-05-16T00:00:00Z"
}
```

Do not expose:

```text
exact_address
tenant_name
unit_rent
seller_motivation
negotiation_memo
```

---

## 6. Handoff Status Model

```ts
export const HandoffStatusSchema = z.enum([
  "created",
  "pending_import",
  "imported",
  "expired",
  "revoked",
  "failed"
]);
```

---

## 7. Token Requirements

```text
- high entropy
- single-use or revocable
- expiry required
- bound to source user or workspace
- should not contain raw payload directly unless encrypted
```

Recommended token type:

```text
opaque random token
```

Avoid:

```text
unsigned plain JSON token
long-lived token
token with private payload in URL
```

---

## 8. Security Requirements

```text
- validate source_app
- validate payload_version
- validate contracts_version compatibility
- validate expiry
- validate user permission
- validate allowed_import_scope
- re-run disclosure policy on imported data
- log all failures
```

---

## 9. Error Codes

| Code | Meaning |
|---|---|
| HANDOFF_INVALID | token does not exist or malformed |
| HANDOFF_EXPIRED | token expired |
| HANDOFF_REVOKED | handoff revoked |
| HANDOFF_ALREADY_IMPORTED | token already imported |
| HANDOFF_PERMISSION_DENIED | user cannot import |
| HANDOFF_CONTRACT_MISMATCH | payload incompatible |
| HANDOFF_SOURCE_FETCH_FAILED | source object unavailable |
| HANDOFF_DISCLOSURE_REVIEW_REQUIRED | import needs review |

---

## 10. Acceptance Criteria

The handoff API contract is accepted when:

```text
- MVP can create handoff token and URL.
- Full IM Studio can import from token.
- token expiry and revocation are supported.
- protected fields are not leaked in preview or response.
- status lifecycle is explicit.
- events are recorded.
- import does not mutate MVP source data.
```
