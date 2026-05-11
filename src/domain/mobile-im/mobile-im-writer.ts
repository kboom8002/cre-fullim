import { type MobileIMSection, type MobileIMSupplementalInput, MOBILE_IM_SECTIONS_7 } from "./mobile-im-types";
import { MOBILE_IM_SECTION_TEMPLATES } from "./section-templates";
import { STANDARD_DISCLAIMER } from "@/domain/export/export-service";

export interface MobileIMWriterInput {
  building_ssot_lite: Record<string, unknown>;
  supplemental: MobileIMSupplementalInput;
  readiness: { score: number; missing: string[] };
}

export interface MobileIMWriterOutput {
  sections: MobileIMSection[];
  boundary_note: string;
  generated_at: string;
}

export async function generateMobileIM(
  input: MobileIMWriterInput
): Promise<MobileIMWriterOutput> {
  const { building_ssot_lite, supplemental } = input;
  const sections: MobileIMSection[] = [];
  
  const assetIdentity = (building_ssot_lite.asset_identity ?? {}) as Record<string, any>;
  const physicalFact = (building_ssot_lite.physical_fact ?? {}) as Record<string, any>;
  const marketLocation = (building_ssot_lite.market_location ?? {}) as Record<string, any>;
  const buyerFit = (building_ssot_lite.buyer_fit ?? {}) as Record<string, any>;

  // AI mocking: we generate deterministic strings based on input data
  for (let i = 0; i < MOBILE_IM_SECTIONS_7.length; i++) {
    const sectionType = MOBILE_IM_SECTIONS_7[i];
    const template = MOBILE_IM_SECTION_TEMPLATES[sectionType];
    
    let markdown = "";
    
    switch (sectionType) {
      case "property_overview":
        markdown = `• 자산유형: ${assetIdentity.asset_type || "미정"}\n` +
                   `• 권역: ${assetIdentity.area_signal || "권역 정보 없음"}\n` +
                   `• 가격대: ${assetIdentity.price_band || "미정"}\n` +
                   `• 규모: ${physicalFact.size_signal || "미정"}`;
        if (supplemental.photo_urls && supplemental.photo_urls.length > 0) {
          markdown += `\n\n*(첨부된 사진 참조)*`;
        }
        break;
      case "location_access":
        markdown = marketLocation.location_analysis 
                   ? `• 입지 분석: ${marketLocation.location_analysis}` 
                   : "• 상세 입지 분석은 추가 정보가 필요합니다.";
        break;
      case "lease_status":
        const rentStr = supplemental.monthly_rent_total_krw 
            ? `월 총수입 약 ${supplemental.monthly_rent_total_krw.toLocaleString()}원` 
            : "수입 정보 미정";
        const vacStr = supplemental.vacancy_status || physicalFact.vacancy_signal || "현황 미상";
        markdown = `• 예상 수입: ${rentStr}\n• 공실 현황: ${vacStr}`;
        break;
      case "income_analysis":
        markdown = `• 추정 수익률: 상세 임대차 정보 확보 후 산정\n` +
                   `• (주의: 기재된 월세 총액은 공과금 등을 제외한 예상치입니다.)`;
        break;
      case "risk_check":
        markdown = `• 임대차 만기 확인\n• 주차 및 위반건축물 여부 확인 필요`;
        break;
      case "investment_thesis":
        markdown = buyerFit.fit_summary 
                   ? `• 매수 적합성: ${buyerFit.fit_summary}` 
                   : "• 매수 목적에 따른 가치상승 시나리오 검토 요망";
        break;
      case "next_steps":
        markdown = `• 관심 매수자는 현장 실사 및 Full IM(상세 투자설명서) 요청을 권장합니다.`;
        break;
    }

    // Apply broker highlight if provided
    if (sectionType === "investment_thesis" && supplemental.broker_highlight) {
      markdown += `\n\n**전문가 코멘트**: ${supplemental.broker_highlight}`;
    }

    sections.push({
      section_type: sectionType,
      section_order: i + 1,
      title: template.title,
      markdown: markdown,
      confidence: input.readiness.score >= 70 ? "confirmed" : "inferred",
      boundary_note: "본 섹션의 내용은 예비 검토용입니다."
    });
  }

  return {
    sections,
    boundary_note: STANDARD_DISCLAIMER,
    generated_at: new Date().toISOString()
  };
}
