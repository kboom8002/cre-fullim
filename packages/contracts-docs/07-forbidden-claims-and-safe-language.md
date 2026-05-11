# 07. Forbidden Claims and Safe Language

## 1. Purpose

This document defines forbidden claims and safe rewrite patterns shared by MVP and Full IM Studio.

The system must not create unsafe, overconfident, legally risky, financially misleading, or investment-advisory statements.

---

## 2. Forbidden Claim Categories

### 2.1 Investment Recommendation

Forbidden:

```text
투자 가치가 높습니다.
매수 추천합니다.
안전한 투자처입니다.
우량 매물입니다.
```

Safe:

```text
검토해볼 수 있는 요소가 있습니다.
매수 여부는 별도 실사와 전문가 검토 후 판단해야 합니다.
```

---

### 2.2 Price / Valuation Certainty

Forbidden:

```text
적정 가격입니다.
저평가되어 있습니다.
시장가보다 저렴합니다.
```

Safe:

```text
가격 수준은 주변 거래사례, 임대수익, 건물 상태, 권리관계 등을 함께 비교해 검토해야 합니다.
```

---

### 2.3 Yield / NOI / Cap Rate Certainty

Forbidden:

```text
수익률이 보장됩니다.
NOI는 확정적으로 개선됩니다.
Cap Rate는 안정적입니다.
```

Safe:

```text
수익성은 입력된 임대차 및 운영비 가정을 기준으로 한 예비 검토이며, 실제 NOI는 자료 확인 후 달라질 수 있습니다.
```

---

### 2.4 Loan / Financing Certainty

Forbidden:

```text
대출 가능합니다.
LTV 60% 가능합니다.
금리 조건이 유리합니다.
```

Safe:

```text
대출 가능성과 조건은 금융기관 심사, 담보평가, 차주 신용도, 시장금리에 따라 달라질 수 있습니다.
```

---

### 2.5 Legal / Tax Certainty

Forbidden:

```text
법적 문제 없습니다.
세금상 유리합니다.
용도변경 가능합니다.
위반건축물 문제가 없습니다.
```

Safe:

```text
법률·세무·인허가 관련 사항은 별도 전문가 검토가 필요한 영역입니다.
```

---

### 2.6 Value-add Overclaim

Forbidden:

```text
리모델링하면 임대료가 상승합니다.
MD 개선으로 가치가 상승합니다.
공실은 쉽게 해소됩니다.
```

Safe:

```text
리모델링 또는 MD 개선 가능성은 공사비, 공실기간, 임차수요, 주변 임대사례 확인 후 검토해야 합니다.
```

---

## 3. Forbidden Claims List

```ts
export const ForbiddenClaims = [
  "투자 가치가 높습니다",
  "매수 추천",
  "안전한 투자처",
  "우량 매물",
  "적정 가격",
  "저평가",
  "시장가보다 저렴",
  "수익률이 보장",
  "NOI는 확정",
  "Cap Rate는 안정",
  "대출 가능합니다",
  "LTV",
  "세금상 유리",
  "법적 문제 없습니다",
  "용도변경 가능합니다",
  "위반건축물 문제가 없습니다",
  "임대료가 상승합니다",
  "공실은 쉽게 해소"
] as const;
```

---

## 4. Safe Language Patterns

```ts
export const SafeLanguagePatterns = {
  preliminaryReview: "본 분석은 제공자료와 공개정보를 바탕으로 한 예비 검토입니다.",
  needsEvidence: "자료 확인이 필요합니다.",
  expertRequired: "전문가 검토가 필요한 영역입니다.",
  cannotConclude: "현재 정보만으로는 단정하기 어렵습니다.",
  conditionDependent: "실제 가능성은 조건 확인 후 달라질 수 있습니다.",
  dueDiligenceRequired: "실제 거래 여부는 별도 실사 후 판단해야 합니다."
} as const;
```

---

## 5. Rewrite Rules

### Rule 1 — Replace Certainty With Review Language

```text
“가능합니다” → “검토 여지가 있으나 확인이 필요합니다”
“확정됩니다” → “입력자료 기준 예비 추정입니다”
“문제 없습니다” → “문제 여부는 별도 확인이 필요합니다”
```

### Rule 2 — Add Missing Data

Every risky statement should include:

```text
- required evidence
- condition
- uncertainty
- expert review need
```

### Rule 3 — Avoid Investment Advice

Never say:

```text
buy
sell
recommended
safe
guaranteed
undervalued
```

---

## 6. Risk Boundary Helper

The contracts package should provide:

```ts
detectForbiddenClaims(text: string): ForbiddenClaimMatch[]
rewriteUnsafeClaim(text: string): string
assertNoForbiddenClaims(text: string): void
```

These helpers should be deterministic and testable.

---

## 7. Acceptance Criteria

This policy is accepted when:

```text
- Forbidden categories are explicit.
- Safe rewrite language is available.
- MVP and Full IM Studio can share the same policy.
- AI outputs can be tested against forbidden claims.
- Risky Full IM language can be rewritten safely.
```
