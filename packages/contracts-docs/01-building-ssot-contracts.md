# 01. Building SSoT Contracts

## 1. Purpose

This document defines the shared Building SSoT contracts used by both the MVP and Full IM Studio.

The MVP creates **Building SSoT Lite**.

Full IM Studio upgrades it into **Building SSoT Full**.

---

## 2. Contract Hierarchy

```text
BuildingSSoTLite
  → BuildingSignalCard
  → HandoffPayload
  → BuildingSSoTFull
  → IMProject
```

---

## 3. Common Supporting Types

### 3.1 SourceRef

```ts
export const SourceRefSchema = z.object({
  id: z.string(),
  source_type: z.enum([
    "user_input",
    "public_data",
    "uploaded_file",
    "broker_memo",
    "expert_patch",
    "ai_inference",
    "external_api"
  ]),
  source_label: z.string(),
  source_uri: z.string().optional(),
  captured_at: z.string().datetime().optional(),
  confidence: z.enum(["confirmed", "inferred", "needs_evidence", "unknown"]),
});
```

### 3.2 EvidenceRef

```ts
export const EvidenceRefSchema = z.object({
  id: z.string(),
  evidence_type: z.enum([
    "building_register",
    "registry",
    "land_use_plan",
    "lease_summary",
    "rent_roll",
    "photo",
    "floor_plan",
    "repair_history",
    "market_comp",
    "rent_comp",
    "expert_memo",
    "other"
  ]),
  title: z.string(),
  storage_path: z.string().optional(),
  visibility: z.enum([
    "public",
    "public_blind",
    "gate_restricted",
    "internal_only",
    "private_truth",
    "blocked"
  ]),
  review_status: z.enum(["uploaded", "reviewed", "buyer_ready", "internal_only", "blocked"]),
});
```

### 3.3 ConfidenceLabel

```ts
export const ConfidenceLabelSchema = z.enum([
  "confirmed",
  "inferred",
  "needs_evidence",
  "expert_required",
  "unknown"
]);
```

---

## 4. Building SSoT Lite

Building SSoT Lite is the lightweight building truth object created by the MVP.

### 4.1 Purpose

It supports:

```text
- public building radar
- broker 1분 딜카드
- blind teaser
- buyer memo
- owner readiness
- full IM handoff
```

### 4.2 Schema

```ts
export const BuildingSSoTLiteSchema = z.object({
  id: z.string(),
  owner_id: z.string().optional(),
  created_by: z.string().optional(),

  input_type: z.enum(["address", "broker_memo", "voice_note", "manual_form", "handoff"]),
  raw_input: z.string().optional(),

  area_signal: z.string().optional(),
  asset_type: z.string().optional(),
  price_band: z.string().optional(),
  size_signal: z.string().optional(),
  current_use_signal: z.string().optional(),
  vacancy_signal: z.string().optional(),

  fit_summary: z.string().optional(),
  caution_summary: z.string().optional(),

  hidden_fields: z.array(z.enum([
    "exact_address",
    "tenant_name",
    "unit_rent",
    "seller_motivation",
    "negotiation_memo",
    "internal_broker_note"
  ])).default([]),

  source_refs: z.array(SourceRefSchema).default([]),
  evidence_refs: z.array(EvidenceRefSchema).default([]),

  confidence: z.record(z.string(), ConfidenceLabelSchema).default({}),
  status: z.enum(["draft", "signal_ready", "handoff_ready", "archived"]).default("draft"),

  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional()
});
```

---

## 5. Building Signal Card

Building Signal Card is the public-safe or broker-safe signal derived from Building SSoT Lite.

### 5.1 Purpose

It supports safe sharing and matching without exposing sensitive information.

### 5.2 Schema

```ts
export const BuildingSignalCardSchema = z.object({
  id: z.string(),
  building_ssot_lite_id: z.string(),

  visibility: z.enum(["public", "public_blind", "gate_restricted"]),
  area_signal: z.string(),
  asset_type: z.string(),
  price_band: z.string().optional(),
  size_signal: z.string().optional(),

  deal_points: z.array(z.string()).default([]),
  caution_points: z.array(z.string()).default([]),
  buyer_fit_types: z.array(z.string()).default([]),
  missing_data: z.array(z.string()).default([]),

  required_gate_level: z.enum(["G0", "G1", "G2", "G3"]).default("G0"),

  redacted_fields: z.array(z.string()).default([]),
  boundary_note: z.string(),

  source_refs: z.array(SourceRefSchema).default([]),

  status: z.enum(["draft", "disclosure_checked", "approved_internal", "shared_external"]).default("draft"),

  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional()
});
```

---

## 6. Building SSoT Full

Building SSoT Full is the professional-grade building truth object used by Full IM Studio.

### 6.1 Purpose

It supports:

```text
- Full IM project creation
- IM readiness check
- section planner
- AI section draft
- expert workbench
- gate review
- export
- golden dataset extraction
```

### 6.2 Layer Structure

```text
asset_identity
physical_fact
legal_registry
lease_income
market_location
value_up_hypothesis
risk_unknown
buyer_fit
disclosure_gate
evidence_source
b2c_consumer_demand
space_environmental
tenant_operator_management
ai_answer_document_contract
```

### 6.3 Schema

```ts
export const BuildingSSoTFullSchema = z.object({
  id: z.string(),
  source_building_ssot_lite_id: z.string().optional(),
  created_by: z.string(),

  asset_identity: z.object({
    display_name: z.string().optional(),
    exact_address: z.string().optional(),
    area_signal: z.string().optional(),
    parcel_number: z.string().optional(),
    asset_type: z.string().optional(),
    disclosure_name: z.string().optional()
  }).default({}),

  physical_fact: z.object({
    land_area: z.number().optional(),
    gross_floor_area: z.number().optional(),
    building_area: z.number().optional(),
    floors: z.string().optional(),
    structure: z.string().optional(),
    main_use: z.string().optional(),
    completion_year: z.number().optional(),
    parking: z.string().optional(),
    elevator: z.string().optional()
  }).default({}),

  legal_registry: z.object({
    zoning: z.string().optional(),
    land_use: z.string().optional(),
    registry_summary: z.string().optional(),
    violation_status: z.string().optional(),
    legal_notes: z.array(z.string()).default([])
  }).default({}),

  lease_income: z.object({
    rent_roll_summary: z.string().optional(),
    monthly_rent_total: z.number().optional(),
    deposit_total: z.number().optional(),
    vacancy_summary: z.string().optional(),
    lease_quality_notes: z.array(z.string()).default([])
  }).default({}),

  market_location: z.object({
    access_summary: z.string().optional(),
    micro_market_summary: z.string().optional(),
    demand_signals: z.array(z.string()).default([]),
    comp_notes: z.array(z.string()).default([])
  }).default({}),

  value_up_hypothesis: z.object({
    scenarios: z.array(z.object({
      title: z.string(),
      hypothesis: z.string(),
      required_validation: z.array(z.string()).default([]),
      risk_notes: z.array(z.string()).default([])
    })).default([])
  }).default({}),

  risk_unknown: z.object({
    risk_items: z.array(z.object({
      category: z.string(),
      risk: z.string(),
      evidence_needed: z.array(z.string()).default([]),
      expert_required: z.boolean().default(false)
    })).default([])
  }).default({}),

  buyer_fit: z.object({
    fit_types: z.array(z.string()).default([]),
    misfit_types: z.array(z.string()).default([]),
    buyer_messages: z.array(z.string()).default([])
  }).default({}),

  disclosure_gate: z.object({
    protected_fields: z.array(z.string()).default([]),
    allowed_visibility: z.array(z.string()).default([]),
    gate_notes: z.array(z.string()).default([])
  }).default({}),

  evidence_source: z.object({
    source_refs: z.array(SourceRefSchema).default([]),
    evidence_refs: z.array(EvidenceRefSchema).default([])
  }).default({}),

  b2c_consumer_demand: z.record(z.string(), z.any()).default({}),
  space_environmental: z.record(z.string(), z.any()).default({}),
  tenant_operator_management: z.record(z.string(), z.any()).default({}),
  ai_answer_document_contract: z.record(z.string(), z.any()).default({}),

  readiness_status: z.enum(["lite_imported", "needs_data", "im_lite_ready", "full_im_draft_ready", "buyer_ready_candidate"]).default("lite_imported"),

  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional()
});
```

---

## 7. Upgrade Contract

The Full IM Studio must convert Building SSoT Lite into Building SSoT Full using an explicit upgrade function.

```ts
export const BSSoTUpgradeInputSchema = z.object({
  building_ssot_lite: BuildingSSoTLiteSchema,
  source_documents: z.array(z.any()).default([]),
  evidence_refs: z.array(EvidenceRefSchema).default([]),
  target_output: z.enum(["im_lite", "buyer_ready_full_im", "dealroom_package"])
});
```

Output:

```ts
export const BSSoTUpgradeResultSchema = z.object({
  building_ssot_full: BuildingSSoTFullSchema,
  missing_data: z.array(z.string()),
  required_expert_patches: z.array(z.string()),
  readiness_status: z.string()
});
```

---

## 8. Acceptance Criteria

Building contracts are accepted when:

```text
- Building SSoT Lite supports MVP workflows.
- Building Signal Card is safe for public/blind sharing.
- Building SSoT Full supports professional Full IM workflows.
- Source refs and confidence labels are supported.
- Protected fields are explicitly identified.
- Full IM Studio can upgrade Lite to Full without mutating MVP source data.
```
