import React from "react";
import MobileIMViewer from "@/components/mobile-im/MobileIMViewer";

export default function MobileIMPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // Mocking data fetch based on slug
  const mockData = {
    slug,
    title: "성수권역 80억대 근생형",
    key_metrics: {
      estimated_yield: "약 4.8%",
      occupancy: "85%",
      price_band: "80억대"
    },
    sections: [
      {
        section_type: "property_overview",
        title: "물건 개요",
        markdown: "• 자산유형: 근생형 꼬마빌딩\n• 위치: 성수권역 (정확한 주소 비공개)\n• 규모: 연면적 약 850㎡\n• 건축연도: 2005년\n• 현재상태: 일부 임대 중, 1층 공실"
      },
      {
        section_type: "location_access",
        title: "입지·상권",
        markdown: "• 뚝섬역 도보 5분 거리\n• 이면도로 코너 입지로 가시성 우수\n• 주변 F&B 상권 활성화 진행 중"
      },
      {
        section_type: "lease_status",
        title: "임대 현황",
        markdown: "• 1층 공실 (예상 임대료 산정 필요)\n• 2~4층 사무실 임대 중\n• 월 수입(추정): 2,500만원 내외"
      },
      {
        section_type: "income_analysis",
        title: "수익 분석",
        markdown: "• 현재 임대료 기준 추정 수익률 3.5%\n• 1층 리테일 임대 완료 시 4.8% 타겟\n• (주의: 기재된 수치는 예비 검토용입니다.)"
      },
      {
        section_type: "risk_check",
        title: "확인 필요 사항",
        markdown: "• 기존 임차인 명도 조건 확인 요망\n• 자주식 주차 대수 및 상태 확인\n• 불법 증축물 여부 대장 확인 필요"
      },
      {
        section_type: "investment_thesis",
        title: "투자 포인트",
        markdown: "• 1층 F&B 리포지셔닝을 통한 가치 상승 가설\n• 사옥 겸 부분 임대형 매수자에게 적합\n• 뚝섬권역 지속 상승세 반영 기대"
      },
      {
        section_type: "next_steps",
        title: "다음 단계",
        markdown: "• 관심 매수자는 현장 실사 및 Full IM(상세 투자설명서) 요청을 권장합니다."
      }
    ],
    boundary_note: "본 자료는 예비 검토용이며 투자 권유가 아닙니다. 정확한 수치와 리스크는 반드시 상세 실사를 통해 확인하시기 바랍니다.",
    full_im_readiness: {
      score: 52,
      missing_for_upgrade: ["임대차 요약표", "등기부등본"]
    }
  };

  return <MobileIMViewer data={mockData} />;
}
