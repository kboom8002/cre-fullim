# 19. Disclosure Guard Policy

## 1. Purpose

This document defines how JS Full IM Studio prevents protected deal information from leaking into the wrong output.

Disclosure control is essential because Full IM work may involve exact addresses, rent rolls, tenant names, owner motivations, negotiation memos, lease contracts, and sensitive evidence.

---

## 2. Core Rule

> Public and blind outputs must show signal, not private truth.

Protected fields should remain hidden unless gate level and role permission allow access.

---

## 3. Protected Fields

```text
exact_address
tenant_name
unit_rent
seller_motivation
negotiation_memo
internal_broker_note
owner_contact
buyer_contact
raw_registry_details
full_lease_contract
banking_or_financing_detail
personal_information
```

---

## 4. Visibility Levels

```text
public
public_blind
registered_interest
qualified_summary
gate_restricted
internal_only
private_truth
blocked
```

---

## 5. Gate Levels

```text
G0 Public Signal
G1 Registered Interest
G2 Qualified Summary
G3 Snapshot / IM Lite
G4 Deal Room Access
G5 DD / Closing
```

MVP primarily uses G0~G3.

Full IM Studio may use G0~G5, but G4/G5 require Deal Room/permission infrastructure.

---

## 6. Disclosure Matrix

| Field | public_blind | G2 summary | G3 IM Lite | G4 Dealroom | G5 DD |
|---|---|---|---|---|---|
| exact_address | block | block | conditional | allow | allow |
| tenant_name | block | block | block/conditional | conditional | allow |
| unit_rent | block | summary only | conditional summary | conditional | allow |
| seller_motivation | block | block | block | internal_only | internal_only |
| negotiation_memo | block | block | block | internal_only | internal_only |
| full lease contract | block | block | block | conditional | allow |
| lease summary | block | summary | allow | allow | allow |
| evidence index | block | limited | allow | allow | allow |

---

## 7. Disclosure Guard Input

```ts
export const DisclosureGuardInputSchema = z.object({
  text: z.string(),
  target_visibility: z.string(),
  gate_level: z.enum(["G0", "G1", "G2", "G3", "G4", "G5"]).optional(),
  protected_fields_available: z.array(z.string()).default([]),
  output_type: z.enum([
    "blind_teaser",
    "external_snapshot",
    "im_lite",
    "full_im",
    "qna_pack",
    "evidence_index",
    "dealroom_payload"
  ])
});
```

---

## 8. Disclosure Guard Output

```ts
export const DisclosureGuardOutputSchema = z.object({
  status: z.enum(["pass", "redacted", "blocked"]),
  safe_text: z.string(),
  redacted_fields: z.array(z.string()),
  violations: z.array(z.object({
    field: z.string(),
    severity: z.enum(["low", "medium", "high", "p0"]),
    message: z.string(),
    recommended_action: z.string()
  }))
});
```

---

## 9. P0 Disclosure Failures

The following are P0 failures:

```text
exact_address in public_blind output
tenant_name in public_blind output
unit_rent in public_blind output
seller_motivation in external output
negotiation_memo in external output
owner_contact in external output
full lease contract exposed without gate
```

P0 failures must:

```text
- block output
- emit disclosure_violation_blocked event
- require reviewer/admin action
```

---

## 10. Redaction Patterns

### Exact Address

```text
서울 성동구 성수동2가 123-45
→ 성수권역
```

### Tenant Name

```text
스타벅스 입점
→ 1층 F&B 임차인
```

### Unit Rent

```text
301호 월세 450만 원
→ 상층부 임대수익 존재
```

### Seller Motivation

```text
상속 문제로 급매
→ 매도자 사정 비공개
```

### Negotiation Memo

```text
75억까지 가능
→ 내부 협상 메모 비공개
```

---

## 11. Evidence Disclosure

Evidence must have visibility and review status.

Evidence cannot be externally shared unless:

```text
visibility allows
review_status is buyer_ready or approved
signed URL policy passes
gate level allows
activity event is recorded
```

---

## 12. Section Disclosure

Some Full IM sections are more sensitive:

High sensitivity:

```text
rent_roll_lease_quality
income_noi_yield_analysis
debt_sensitivity_cash_flow
appendix_evidence_index
dealroom_qna_starter
```

These sections require stricter disclosure review before export.

---

## 13. Gate Review Integration

Disclosure Gate must run before:

```text
external_snapshot export
im_lite export
buyer_ready_full_im approval
dealroom publication
evidence signed URL generation
```

---

## 14. Tests

Required tests:

```text
exact address blocked in blind teaser
tenant name blocked in blind teaser
unit rent converted to summary
seller motivation removed
negotiation memo removed
full lease contract blocked without G5
evidence signed URL blocked before permission
```

---

## 15. Acceptance Criteria

Disclosure Guard Policy is accepted when:

```text
- protected fields are defined.
- visibility and gate matrix is explicit.
- P0 failures are defined.
- redaction patterns are defined.
- evidence disclosure is controlled.
- gate integration is defined.
```
