// src/domain/mobile-im/narrative-prompt.ts

import { MobileIMSectionType, MobileIMSupplementalInput } from "./mobile-im-types";
import { ExternalDataEnrichmentResult } from "../../lib/external/external-data-orchestrator";

export const MOBILE_IM_NARRATIVE_SYSTEM = `당신은 한국 상업용 부동산 전문 라이터이자 투자 전략가입니다.
투자자가 "왜 이 건물인가?"를 직관적이고 빠르게 이해할 수 있도록 모바일 화면에 최적화된 매력적인 투자 서사를 작성해 주세요.

[작성 규칙]
1. 글자 수: 모바일 화면에서의 가독성을 위해 각 섹션은 **2~4문장**의 자연스러운 서사(줄글)로 작성합니다.
2. 어조: 매우 전문적이고 객관적이되, 자산의 가치(Value Proposition)를 강조하는 소구력 높은 어조를 유지하세요.
3. 근거: 임의로 수치를 창작하지 말고, 제공된 [BSSoT Lite 데이터] 및 [공공데이터] 수치에 정확히 기초하세요.
4. 금융 경계: 절대로 투자를 유도하거나, 특정 수익률을 확정 보장하는 어휘(예: "무조건", "100% 보장", "수익 확정")를 사용하지 마세요.
5. 마크다운: 불릿 포인트 목록보다는 읽기 쉬운 줄글 위주로 쓰고, 강조할 핵심 키워드는 **두껍게** 표시하세요.`;

export function buildNarrativeUserPrompt(
  sectionType: MobileIMSectionType,
  bssotLite: Record<string, any>,
  externalData: ExternalDataEnrichmentResult | null,
  supplemental: MobileIMSupplementalInput
): string {
  const assetIdentity = bssotLite.asset_identity || {};
  const physicalFact = bssotLite.physical_fact || {};
  const marketLocation = bssotLite.market_location || {};
  const buyerFit = bssotLite.buyer_fit || {};

  const bssotCtx = JSON.stringify({
    asset_type: assetIdentity.asset_type,
    area_signal: assetIdentity.area_signal,
    price_band: assetIdentity.price_band,
    size_signal: physicalFact.size_signal,
    vacancy_signal: physicalFact.vacancy_signal,
    location_analysis: marketLocation.location_analysis,
    fit_summary: buyerFit.fit_summary,
    purchase_price: bssotLite.purchase_price || bssotLite.deal_amount,
  });

  const extCtx = externalData ? JSON.stringify({
    building_register: externalData.buildingRegister,
    land_price: externalData.landPrice,
    land_use: externalData.landUsePlan,
    poi: externalData.locationPoi,
    comparable_transactions_count: externalData.comparableTransactions?.length || 0,
  }) : "없음";

  const suppCtx = JSON.stringify(supplemental);

  let sectionSpecificInstruction = "";

  switch (sectionType) {
    case "property_overview":
      sectionSpecificInstruction = `[개요 섹션 미션]
자산의 종류, 핵심 물리적 제원(연면적, 대지면적, 층수 등)과 **첫 인상을 사로잡는 프리미엄 가치**를 부각하세요.
공공데이터(건축물대장)에서 확보된 명확한 물리적 스펙(예: 구조, 승인년도)을 활용하여 자산의 신뢰도를 높이세요.`;
      break;
    case "location_access":
      sectionSpecificInstruction = `[입지/접근성 섹션 미션]
자산의 물리적 위치와 **대중교통(지하철역 도보 거리 등) 연계성, 주요 상권과의 거리**를 분석하세요.
카카오 API를 통해 수집된 POI(주변 편의시설, 카페 등) 및 버스/지하철 접근성 수치를 녹여서 생생하게 묘사하세요.`;
      break;
    case "lease_status":
      sectionSpecificInstruction = `[임대차 현황 섹션 미션]
현재 자산의 **공실률 현황 및 주요 임차인 구성의 안정성**을 스토리로 만드세요.
임대료 총액과 공실 데이터를 기초로 하되, 우량 임차인(앵커 테넌트) 가능성을 제시하여 리스크가 통제되고 있음을 알리세요.`;
      break;
    case "income_analysis":
      sectionSpecificInstruction = `[수익률/재무 분석 섹션 미션]
개별공시지가 추이, 예상 수익률(Yield) 등을 종합하여 **재무적 매력도와 인플레이션 방어 능력**을 묘사하세요.
다만, "예상 수치이며 실제 계약 조건에 따라 바뀔 수 있음"이라는 금융 리스크 boundary 문구를 자연스럽게 포함하세요.`;
      break;
    case "risk_check":
      sectionSpecificInstruction = `[리스크/공법 제한 섹션 미션]
토지이용계획 상의 용도지역(상업지역 등) 법적 용적률 한도와 현재 용적률을 비교하여 **증축 또는 리모델링 등 가치상승(Value-add) 가능성**이 있는지, 혹은 공법적 규제 경계가 무엇인지 객관적으로 짚어주세요.`;
      break;
    case "investment_thesis":
      sectionSpecificInstruction = `[투자 논거 섹션 미션]
이 건물을 매수해야 하는 **가장 결정적인 핵심 가치제안(Value Proposition)**을 제시하세요.
주변 실거래 사례 대비 매매가의 경쟁력을 언급하고, 어떤 매수 성향(자체 사옥용, 임대수익용 등)에 가장 적합한 자산인지 설명하세요.`;
      break;
    case "next_steps":
      sectionSpecificInstruction = `[다음 단계 섹션 미션]
예비 관심 매수자가 상세 검토를 진행하기 위해 **현장 방문(방문 예약)이나 Full IM(상세 설명서) 열람 등 구체적인 후속 액션**을 취하도록 정중하고 신뢰감 있게 안내하세요.`;
      break;
  }

  return `
[섹션 정보]
섹션 유형: ${sectionType}

[데이터셋]
1. BSSoT Lite 기본데이터:
${bssotCtx}

2. 공공데이터 및 외부 수집 데이터:
${extCtx}

3. 브로커 수동 입력 보강 데이터:
${suppCtx}

[개별 미션]
${sectionSpecificInstruction}
`;
}
