import { type MobileIMProject } from "./mobile-im-types";
import { STANDARD_DISCLAIMER } from "@/domain/export/export-service";

export interface MobileIMCardData {
  slug: string;
  title: string;           
  subtitle: string;        
  key_metrics: {
    estimated_yield?: string;  
    occupancy?: string;        
    price_band?: string;       
  };
  caution_items: string[];  
  public_url: string;       
  kakao_copy: string;       
  boundary_note: string;
  full_im_readiness: {
    score: number;           
    missing_for_upgrade: string[];
  };
}

export function buildMobileIMCard(project: MobileIMProject, baseUrl: string = "https://js.im"): MobileIMCardData {
  const assetIdentity = (project.building_ssot_lite.asset_identity ?? {}) as Record<string, any>;
  const title = `${assetIdentity.area_signal || "주요 권역"} ${assetIdentity.price_band || ""} ${assetIdentity.asset_type || "건물"}`;
  
  const cautions: string[] = [];
  const riskSection = project.sections.find(s => s.section_type === "risk_check");
  if (riskSection) {
    if (riskSection.markdown.includes("임대차 만기")) cautions.push("임대차 만기 확인");
    if (riskSection.markdown.includes("주차")) cautions.push("주차 조건");
    if (riskSection.markdown.includes("위반건축물")) cautions.push("위반건축물 여부");
  }
  if (cautions.length === 0) cautions.push("상세 리스크 확인 필요");

  const publicUrl = `${baseUrl}/m/${project.slug}`;

  // Build kakao copy
  const kakaoCopy = 
`📋 ${title}
   투자 메모 (Mobile IM)

✅ 수익률(추정): 상세 분석 요망
✅ 임대율: ${project.supplemental_input.vacancy_status || "현황 미상"}
⚠️ 확인 필요: ${cautions.join(", ")}

👉 상세 보기: ${publicUrl}

※ 본 자료는 예비 검토용이며 투자 권유가 아닙니다.`;

  return {
    slug: project.slug,
    title,
    subtitle: "투자 메모 (Mobile IM)",
    key_metrics: {
      price_band: assetIdentity.price_band,
      occupancy: project.supplemental_input.vacancy_status,
    },
    caution_items: cautions,
    public_url: publicUrl,
    kakao_copy: kakaoCopy,
    boundary_note: STANDARD_DISCLAIMER,
    full_im_readiness: {
      score: project.full_im_readiness_score || 0,
      missing_for_upgrade: project.full_im_missing_data || []
    }
  };
}

export function buildKakaoCopy(card: MobileIMCardData): string {
  return card.kakao_copy;
}
