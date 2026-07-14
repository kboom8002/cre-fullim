// src/domain/mobile-im/loi-generator.ts

export interface LOIDraftInput {
  propertyTitle: string;
  propertyAddress: string;
  proposedPriceKrw: number;
  dueDiligenceDays: number;
  validityDays: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  additionalTerms?: string;
}

export interface LOIDraftOutput {
  markdown: string;
  generatedAt: string;
  validUntil: string;
  boundaryNote: string;
}

/**
 * 매수 의향서(LOI) 초안 마크다운 양식을 실시간으로 빌드합니다.
 */
export function generateLOIDraft(input: LOIDraftInput): LOIDraftOutput {
  const {
    propertyTitle,
    propertyAddress,
    proposedPriceKrw,
    dueDiligenceDays,
    validityDays,
    buyerName,
    buyerEmail,
    buyerPhone,
    additionalTerms
  } = input;

  const now = new Date();
  const validUntilDate = new Date();
  validUntilDate.setDate(now.getDate() + validityDays);

  const priceInHundredMillion = (proposedPriceKrw / 100000000).toFixed(1);

  const markdown = `
# 매 수 의 향 서 (LOI)
**Letter of Intent**

본 매수의향서(이하 "의향서")는 아래 표시된 대상 부동산에 대하여 매수인(의향 표명인)이 매도인에게 정식 매수의사를 표명하고, 기본적인 거래 조건을 제안하고자 작성되었습니다.

---

### 1. 대상 부동산의 표시
* **물건명**: ${propertyTitle}
* **소재지**: ${propertyAddress}
* **주요 용도**: 상업용 업무시설 및 근린생활시설

### 2. 제안 매수 조건 (Bidding Terms)
* **제안 매수대금**: **일금 ${proposedPriceKrw.toLocaleString()}원** (₩${proposedPriceKrw.toLocaleString()}, 약 **${priceInHundredMillion}억원** 부가세 별도)
* **정밀 실사 기간**: 양사 기본 조건 합의 및 MOU 체결 후 **${dueDiligenceDays} 영업일** 이내 완료
* **의향서 유효기간**: 제출일로부터 **${validityDays}일간** 유효 (만료일: ${validUntilDate.toLocaleDateString("ko-KR")})

### 3. 매수인 정보 (Proposed Buyer)
* **의향인/법인명**: ${buyerName}
* **이메일 연락처**: ${buyerEmail}
* **전화번호**: ${buyerPhone}

### 4. 기타 특약 사항
${additionalTerms ? additionalTerms : "* 본 거래는 통상적인 상업용 부동산 매매 규정에 따르며, 구체적인 계약 조건은 본 실사 완료 후 본 계약(SPA) 체결 단계에서 확정합니다."}

---

### [필수 면책 사항 및 고지]
본 의향서는 최종 계약서가 아니며, 계약의 강제나 구속력을 지니지 않는 예비 합의 문서입니다. 실제 거래 이행은 상세 실사 완료 및 본 계약 체결 시점에 발효됩니다.

**제출일**: ${now.toLocaleDateString("ko-KR")}
**매수 의향인**: ${buyerName} (서명/날인 생략)
`;

  return {
    markdown: markdown.trim(),
    generatedAt: now.toISOString(),
    validUntil: validUntilDate.toISOString(),
    boundaryNote: "본 문서는 예비 합의용 드래프트 초안이며 실제 법적 구속력을 부여하지 않습니다.",
  };
}
