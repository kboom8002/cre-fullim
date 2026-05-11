# 03. Gate and Disclosure Contracts

## 1. Purpose

This document defines shared gate and disclosure contracts.

The same gate and disclosure rules must apply in:

```text
JS Building SSoT MVP
JS Full IM Studio
future Deal Room
future Expert Marketplace
```

---

## 2. Gate Levels

```ts
export const GateLevelSchema = z.enum([
  "G0",
  "G1",
  "G2",
  "G3",
  "G4",
  "G5"
]);
```

### Meaning

| Gate | Meaning | Typical Content |
|---|---|---|
| G0 | Public Signal | area, asset type, blind deal points |
| G1 | Registered Interest | saved lead, non-sensitive summary |
| G2 | Qualified Summary | partial summary, limited data |
| G3 | Snapshot / IM Lite | more detailed but controlled info |
| G4 | Dealroom Access | evidence files, detailed IM |
| G5 | DD / Closing | full diligence materials |

MVP v0.1 uses G0~G3.

Full IM Studio may use G0~G5, but G4/G5 should be introduced only when Deal Room is active.

---

## 3. Protected Fields

```ts
export const ProtectedFieldSchema = z.enum([
  "exact_address",
  "tenant_name",
  "unit_rent",
  "seller_motivation",
  "negotiation_memo",
  "internal_broker_note",
  "raw_registry_details",
  "full_lease_contract",
  "owner_contact",
  "buyer_contact",
  "banking_or_financing_detail"
]);
```

---

## 4. Disclosure Policy Matrix

| Field | G0 | G1 | G2 | G3 | G4 | G5 |
|---|---|---|---|---|---|---|
| area_signal | allow | allow | allow | allow | allow | allow |
| asset_type | allow | allow | allow | allow | allow | allow |
| price_band | allow | allow | allow | allow | allow | allow |
| exact_address | block | block | block | conditional | allow | allow |
| tenant_name | block | block | block | block/conditional | conditional | allow |
| unit_rent | block | block | block | conditional summary | conditional | allow |
| seller_motivation | block | block | block | block | internal_only | internal_only |
| negotiation_memo | block | block | block | block | internal_only | internal_only |
| lease_summary | block | summary | summary | allow | allow | allow |
| evidence_files | block | block | block | limited | allow | allow |

---

## 5. Disclosure Violation Schema

```ts
export const DisclosureViolationSchema = z.object({
  field: ProtectedFieldSchema,
  violation_type: z.enum([
    "field_exposed",
    "unsafe_detail",
    "wrong_visibility",
    "missing_redaction",
    "requires_gate",
    "internal_only_leak"
  ]),
  severity: z.enum(["low", "medium", "high", "p0"]),
  message: z.string(),
  recommended_action: z.string()
});
```

---

## 6. Gate Review Schema

```ts
export const GateReviewSchema = z.object({
  id: z.string(),
  target_type: z.enum(["document", "im_section", "im_project", "evidence_file", "dealroom_payload"]),
  target_id: z.string(),
  gate_type: z.enum([
    "data_gate",
    "disclosure_gate",
    "risk_gate",
    "financial_consistency_gate",
    "expert_scope_gate",
    "design_quality_gate",
    "training_rights_gate",
    "buyer_ready_approval_gate"
  ]),
  status: z.enum(["pass", "revise", "expert_required", "blocked", "internal_only"]),
  violations: z.array(DisclosureViolationSchema).default([]),
  required_actions: z.array(z.string()).default([]),
  reviewed_by: z.string().optional(),
  reviewed_at: z.string().datetime().optional()
});
```

---

## 7. Visibility Rules

```ts
export function isFieldAllowedAtGate(field: ProtectedField, gateLevel: GateLevel): boolean
export function getMinimumGateForField(field: ProtectedField): GateLevel | "internal_only"
export function redactProtectedFields(input: unknown, gateLevel: GateLevel): unknown
```

These functions must be pure.

---

## 8. P0 Disclosure Failures

These are P0 failures:

```text
- exact_address exposed in public/blind document
- tenant_name exposed in public/blind document
- unit_rent exposed in public/blind document
- seller_motivation exposed externally
- negotiation_memo exposed externally
- internal_broker_note exposed externally
```

Any P0 failure must block external sharing.

---

## 9. Acceptance Criteria

Gate and disclosure contracts are accepted when:

```text
- Gate levels are standardized.
- Protected fields are centralized.
- Disclosure policy matrix is explicit.
- Violation schema supports review workflows.
- P0 failures are defined.
- Pure helper functions can be implemented without app dependency.
```
