# 17. Financial Analysis Guardrails

## 1. Purpose

This document defines guardrails for financial analysis in JS Full IM Studio.

The system may help structure and explain financial assumptions, but it must not present uncertain figures as guaranteed or final.

---

## 2. Financial Output Categories

Financial content may include:

```text
rent roll summary
lease quality
gross rental income
operating expense assumptions
NOI estimate
simple yield
cap rate scenario
debt sensitivity
cash flow sensitivity
valuation comparison
```

---

## 3. Core Rule

> Financial analysis is scenario-based and assumption-dependent unless verified by evidence and expert review.

Every financial section must clearly separate:

```text
confirmed inputs
user-provided assumptions
AI-inferred assumptions
missing data
sensitivity output
expert review required
```

---

## 4. Required Financial Assumption Box

Any section discussing NOI, yield, cap rate, or debt must include an assumption box.

Minimum fields:

```text
rent basis
vacancy assumption
operating expense assumption
management/repair assumption
debt ratio assumption
interest rate assumption
tax/fee exclusion note
data date
```

Example:

```text
Assumption Box:
- 임대수입: 제공된 임대차 요약 기준
- 공실: 현재 입력자료 기준
- 운영비: 미확인, 별도 확인 필요
- 대출조건: 예시 민감도 가정이며 금융기관 심사 결과가 아님
```

---

## 5. NOI Guardrail

### Allowed

```text
입력자료 기준 추정 NOI
예비 NOI 시나리오
운영비 미확인 시 제한적 분석
```

### Forbidden

```text
확정 NOI
보장 NOI
운영비가 확정되지 않았는데 확정 수익률 계산
```

### Required Language

```text
본 NOI는 제공자료와 제한된 운영비 가정을 바탕으로 한 예비 추정이며, 실제 NOI는 임대차계약서, 관리비 구조, 수선비, 공실기간 확인 후 달라질 수 있습니다.
```

---

## 6. Cap Rate / Yield Guardrail

### Allowed

```text
asking price 대비 단순 수익률
가정 기반 cap rate sensitivity
비교 목적의 cap rate range
```

### Forbidden

```text
cap rate 확정
시장 cap rate 단정
수익률 보장
```

### Required Language

```text
수익률 및 Cap Rate는 입력자료와 가정을 기준으로 한 비교 지표이며, 투자 성과를 보장하지 않습니다.
```

---

## 7. Debt Sensitivity Guardrail

### Allowed

```text
금리/대출비율별 민감도
차입 가정별 현금흐름 예시
DSCR 예비 검토
```

### Forbidden

```text
대출 가능합니다
LTV 60% 가능합니다
금리 조건이 확정됩니다
```

### Required Language

```text
대출 가능성과 조건은 금융기관 심사, 담보평가, 차주 신용도, 시장금리에 따라 달라질 수 있습니다.
```

---

## 8. Valuation Guardrail

### Allowed

```text
거래사례 비교
면적당 가격 비교
수익률 기준 비교
보정 필요사항 설명
```

### Forbidden

```text
적정가입니다
저평가입니다
시장가보다 저렴합니다
감정평가 수준의 확정 가격
```

### Required Language

```text
본 비교는 투자검토를 위한 참고용이며, 감정평가 또는 가격 적정성 보증이 아닙니다.
```

---

## 9. Required Financial Consistency Checks

Before buyer-ready approval, the system must check:

```text
rent totals
vacancy treatment
operating expense assumptions
NOI formula
price basis
cap rate formula
debt assumption consistency
currency/unit consistency
missing data flags
```

---

## 10. Financial Consistency Violation Schema

```ts
export const FinancialConsistencyViolationSchema = z.object({
  issue_type: z.enum([
    "missing_assumption",
    "formula_mismatch",
    "unit_mismatch",
    "unsupported_noi",
    "unsupported_yield",
    "unsupported_debt",
    "unsupported_valuation",
    "overconfident_language"
  ]),
  severity: z.enum(["low", "medium", "high", "p0"]),
  section_type: z.string(),
  message: z.string(),
  recommended_action: z.string()
});
```

---

## 11. Expert Review Triggers

Financial expert or reviewer review is required when:

```text
NOI is used for buyer-ready Full IM
debt sensitivity is included
valuation logic is included
rent roll has incomplete data
operating expense assumptions are missing
large value-add scenario affects income
```

---

## 12. AI Agent Requirements

FinancialCommentaryAgent must output:

```text
assumptions_used
missing_assumptions
caution_notes
requires_expert_patch
safe commentary
```

RiskBoundaryAgent must scan financial text.

GateReviewAgent must run financial consistency checks.

---

## 13. Tests

Required tests:

```text
NOI cannot be marked confirmed without operating expense data
debt language cannot say "대출 가능합니다"
valuation language cannot say "적정 가격"
cap rate must include assumption note
buyer-ready export blocked when financial consistency gate fails
```

---

## 14. Acceptance Criteria

Financial guardrails are accepted when:

```text
- all financial outputs are assumption-aware.
- NOI/yield/debt/valuation cannot be overclaimed.
- required financial boundary language is defined.
- financial consistency gate can detect common issues.
- expert review triggers are explicit.
```
