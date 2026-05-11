import { type MobileIMSectionType } from "./mobile-im-types";

// 7섹션 타이틀 + 구조 정의
// Full IM의 IM_SECTION_DEFINITIONS에서 파생
export const MOBILE_IM_SECTION_TEMPLATES: Record<MobileIMSectionType, {
  title: string;
  structure: string;
  full_im_source: string; // 대응하는 Full IM 섹션
}> = {
  property_overview: {
    title: "물건 개요",
    structure: "자산유형 / 위치 / 규모 / 가격대 / 현재상태",
    full_im_source: "property_fact_sheet",
  },
  location_access: {
    title: "입지·상권",
    structure: "역세권 / 도보 접근성 / 주변 인프라 / 상권 특성",
    full_im_source: "location_access",
  },
  lease_status: {
    title: "임대 현황",
    structure: "임대율 / 월 수입 / 주요 임차 업종 / 공실",
    full_im_source: "rent_roll_lease_quality",
  },
  income_analysis: {
    title: "수익 분석",
    structure: "추정 수익률 / 가정 사항 / 주의점",
    full_im_source: "income_noi_yield_analysis",
  },
  risk_check: {
    title: "확인 필요 사항",
    structure: "주요 리스크 / DD 체크 항목 / 누락 데이터",
    full_im_source: "risk_factors_dd_checklist",
  },
  investment_thesis: {
    title: "투자 포인트",
    structure: "딜 포인트 / 매수자 적합성 / 가치상승 가설",
    full_im_source: "investment_thesis_buyer_fit",
  },
  next_steps: {
    title: "다음 단계",
    structure: "자료 보강 사항 / 전문가 검토 추천 / Full IM 안내",
    full_im_source: "deal_process_next_steps",
  },
};
