# 04. IM Project Contracts

## 1. Purpose

This document defines the shared contracts for Full IM projects, readiness, sections, and exports.

These contracts are primarily used by JS Full IM Studio.

---

## 2. IM Project Type

```ts
export const IMProjectTypeSchema = z.enum([
  "ai_self_authoring",
  "ai_expert_review",
  "expert_full_build",
  "dealroom_ready_package"
]);
```

---

## 3. IM Project Status

```ts
export const IMProjectStatusSchema = z.enum([
  "intake",
  "ssot_building",
  "readiness_checked",
  "outline_generated",
  "ai_draft",
  "expert_patch",
  "gate_review",
  "client_review",
  "buyer_ready",
  "exported",
  "dealroom_published",
  "archived",
  "blocked"
]);
```

---

## 4. IM Project Schema

```ts
export const IMProjectSchema = z.object({
  id: z.string(),

  source_app: z.enum(["js-building-ssot-mvp", "js-full-im-studio", "manual"]),
  source_building_ssot_lite_id: z.string().optional(),
  building_ssot_full_id: z.string(),

  created_by: z.string(),
  project_owner_id: z.string().optional(),

  project_type: IMProjectTypeSchema,
  target_output: z.enum([
    "external_snapshot",
    "im_lite",
    "buyer_ready_full_im",
    "dealroom_ready_package"
  ]),

  status: IMProjectStatusSchema.default("intake"),

  readiness_score: z.number().min(0).max(100).optional(),
  required_expert_patches: z.array(z.string()).default([]),

  source_document_ids: z.array(z.string()).default([]),
  source_refs: z.array(z.any()).default([]),

  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional()
});
```

---

## 5. IM Section Types

```ts
export const IMSectionTypeSchema = z.enum([
  "cover_confidentiality",
  "executive_summary",
  "investment_thesis_buyer_fit",
  "property_fact_sheet",
  "land_zoning_legal_constraints",
  "location_access",
  "micro_market_demand_story",
  "building_condition_physical_review",
  "rent_roll_lease_quality",
  "income_noi_yield_analysis",
  "debt_sensitivity_cash_flow",
  "valuation_logic_comparables",
  "value_add_repositioning_scenario",
  "risk_factors_dd_checklist",
  "deal_process_next_steps",
  "dealroom_qna_starter",
  "appendix_evidence_index",
  "disclaimer_contact"
]);
```

---

## 6. IM Section Status

```ts
export const IMSectionStatusSchema = z.enum([
  "not_started",
  "planned",
  "ai_draft",
  "needs_data",
  "needs_expert_patch",
  "patched",
  "gate_review",
  "buyer_ready",
  "blocked"
]);
```

---

## 7. IM Section Schema

```ts
export const IMSectionSchema = z.object({
  id: z.string(),
  project_id: z.string(),

  section_type: IMSectionTypeSchema,
  section_order: z.number(),
  title: z.string(),

  status: IMSectionStatusSchema.default("not_started"),

  confidence: z.enum([
    "confirmed",
    "inferred",
    "needs_evidence",
    "expert_required",
    "unknown"
  ]).default("unknown"),

  risk_level: z.enum(["low", "medium", "high", "blocked"]).default("medium"),

  requires_expert_patch: z.boolean().default(false),
  required_expert_roles: z.array(z.string()).default([]),

  missing_data: z.array(z.string()).default([]),
  required_evidence: z.array(z.string()).default([]),

  content_json: z.record(z.string(), z.any()).default({}),
  markdown: z.string().optional(),

  source_refs: z.array(z.any()).default([]),
  evidence_refs: z.array(z.any()).default([]),

  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional()
});
```

---

## 8. IM Readiness Result

```ts
export const IMReadinessResultSchema = z.object({
  project_id: z.string().optional(),
  building_ssot_full_id: z.string(),

  readiness_score: z.number().min(0).max(100),

  available_outputs: z.array(z.enum([
    "blind_teaser",
    "external_snapshot",
    "im_lite",
    "full_im_draft",
    "buyer_ready_full_im",
    "dealroom_ready_package"
  ])).default([]),

  blocked_outputs: z.array(z.string()).default([]),

  missing_required_data: z.array(z.string()).default([]),

  required_expert_patches: z.array(z.object({
    patch_type: z.string(),
    expert_role: z.string(),
    reason: z.string(),
    priority: z.enum(["low", "medium", "high"])
  })).default([]),

  section_readiness: z.array(z.object({
    section_type: IMSectionTypeSchema,
    status: z.enum(["ready", "partial", "blocked"]),
    missing_data: z.array(z.string()).default([]),
    expert_required: z.boolean().default(false)
  })).default([]),

  boundary_note: z.string()
});
```

---

## 9. Export Job Schema

```ts
export const ExportJobSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  export_type: z.enum(["web_im", "pdf", "markdown", "pptx", "dealroom_payload"]),
  status: z.enum(["queued", "processing", "completed", "failed"]),
  output_uri: z.string().optional(),
  error_message: z.string().optional(),
  created_by: z.string(),
  created_at: z.string().datetime(),
  completed_at: z.string().datetime().optional()
});
```

---

## 10. Acceptance Criteria

IM project contracts are accepted when:

```text
- IM project lifecycle is explicit.
- 18-section Full IM structure is standardized.
- Readiness result can block buyer-ready output.
- Section-level missing data and expert requirements are supported.
- Export jobs are standardized.
```
