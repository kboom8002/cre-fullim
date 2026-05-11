# 18. Risk Boundary Policy

## 1. Purpose

This document defines the risk boundary policy for JS Full IM Studio.

The goal is to prevent AI-generated or user-edited IM content from sounding like guaranteed investment advice, final legal conclusion, final tax advice, loan approval, or certain value-add outcome.

---

## 2. Risk Categories

```text
investment_recommendation
valuation_certainty
financial_certainty
legal_certainty
tax_certainty
loan_certainty
permit_certainty
value_add_certainty
lease_certainty
market_demand_certainty
```

---

## 3. Severity Levels

```text
low
medium
high
p0
```

### P0

P0 issues block external sharing.

Examples:

```text
매수 추천합니다.
수익률이 보장됩니다.
대출 가능합니다.
법적 문제 없습니다.
임차인명/호실별 월세가 public output에 노출됨.
```

---

## 4. Forbidden Statement Patterns

### Investment

```text
투자 가치가 높습니다
매수 추천
안전한 투자처
우량 매물
확실한 투자 기회
```

### Valuation

```text
적정 가격
저평가
시장가보다 저렴
가격 상승 확실
```

### Finance

```text
수익률 보장
NOI 확정
Cap Rate 안정
현금흐름 보장
```

### Debt

```text
대출 가능
LTV 가능
금리 확정
DSCR 충분
```

### Legal / Tax / Permit

```text
법적 문제 없음
세금상 유리
용도변경 가능
증축 가능
위반건축물 문제 없음
```

### Value-add

```text
리모델링하면 임대료 상승
공실 쉽게 해소
MD 개선으로 가치 상승
```

---

## 5. Required Safe Transformations

| Unsafe | Safe |
|---|---|
| 가능합니다 | 검토 여지가 있으나 확인이 필요합니다 |
| 확정됩니다 | 입력자료 기준 예비 추정입니다 |
| 문제 없습니다 | 문제 여부는 별도 확인이 필요합니다 |
| 저평가입니다 | 주변 사례와 보정 기준을 함께 검토해야 합니다 |
| 수익률 보장 | 수익률은 가정과 실사 결과에 따라 달라질 수 있습니다 |

---

## 6. Section-specific Risk Rules

### Executive Summary

Must balance:

```text
investment points
buyer fit
key risks
missing data
next step
```

### Rent Roll

Must not name tenants unless visibility allows.

Must include:

```text
lease maturity
vacancy
missing lease data
```

### NOI / Yield

Must include assumptions and caveats.

### Debt

Must include financing dependency language.

### Legal / Zoning

Must require expert review.

### Value-add

Must include cost/time/vacancy/permit risk.

---

## 7. Risk Boundary Check Output

```ts
export const RiskBoundaryCheckSchema = z.object({
  status: z.enum(["pass", "revise", "blocked"]),
  issues: z.array(z.object({
    issue_type: z.string(),
    severity: z.enum(["low", "medium", "high", "p0"]),
    original_text: z.string().optional(),
    recommended_text: z.string().optional(),
    message: z.string()
  })),
  safe_text: z.string().optional()
});
```

---

## 8. Required Boundary Notes

Every public or buyer-facing IM output must include:

```text
본 자료는 제공자료와 공개정보를 바탕으로 한 예비 검토 자료이며, 투자 권유, 감정평가, 법률·세무·대출 가능성 판단을 목적으로 하지 않습니다. 실제 거래 여부는 별도 실사와 전문가 검토를 통해 판단해야 합니다.
```

---

## 9. Gate Integration

Risk Gate must run before:

```text
buyer_ready approval
external export
dealroom publication
```

If Risk Gate returns:

```text
pass → continue
revise → require revision
blocked → block external sharing
```

---

## 10. Tests

Required tests:

```text
investment recommendation blocked
loan certainty blocked
legal certainty blocked
value-add certainty rewritten
NOI certainty rewritten
risk gate blocks buyer-ready when P0 issue exists
```

---

## 11. Acceptance Criteria

Risk boundary policy is accepted when:

```text
- unsafe statement categories are explicit.
- safe rewrite patterns are defined.
- section-specific rules exist.
- risk gate integration is defined.
- P0 issues block external sharing.
```
