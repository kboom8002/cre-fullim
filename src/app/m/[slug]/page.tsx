import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MobileIMViewer from "@/components/mobile-im/MobileIMViewer";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `모바일 투자설명서 | ${slug}`,
    description: "AI가 생성한 예비 검토용 모바일 투자설명서입니다.",
  };
}

export default async function MobileIMPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Supabase에서 조회 시도
  const { data: project } = await supabase
    .from("mobile_im_projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!project) {
    // DB에 없으면 데모용 fallback 데이터 사용
    const fallbackData = {
      slug,
      title: "성수권역 70억~80억 꼬마빌딩",
      key_metrics: {
        estimated_yield: "약 4.2~4.8%",
        occupancy: "85%",
        price_band: "70억~80억",
      },
      sections: [
        {
          section_type: "property_overview",
          title: "물건 개요",
          markdown:
            "• 자산유형: 꼬마빌딩 (근린생활시설)\n• 위치: 성수권역 (정확한 주소 비공개)\n• 규모: 연면적 약 280평\n• 층수: 지상 4층\n• 건축연도: 2018년 (리모델링)\n• 엘리베이터 없음 / 주차 3대",
        },
        {
          section_type: "location_access",
          title: "입지·상권",
          markdown:
            "• 성수역 도보 5분 거리\n• 이면도로 코너 입지 — 유동인구·가시성 우수\n• 1층 카페 운영 중 (앵커 테넌트)\n• 성수동 개발 압력 지속 — 장기 가치 보전 유리",
        },
        {
          section_type: "lease_status",
          title: "임대 현황",
          markdown:
            "• 1층 카페 임대 중 (월세 400만원 추정)\n• 2~4층 사무실 공실\n• 현재 임대율: 약 30% (1층만 임차)\n• 공실 해소 시 임대수익 대폭 개선 가능",
        },
        {
          section_type: "income_analysis",
          title: "수익 분석",
          markdown:
            "• 현재 임대료 기준 추정 수익률: 약 2.5%\n• 2~4층 사무실 임대 완료 시 타겟 수익률: 4.2~4.8%\n• (주의: 기재된 수치는 예비 검토용입니다. 실제 투자 전 반드시 정밀 실사를 진행하세요.)",
        },
        {
          section_type: "risk_check",
          title: "확인 필요 사항",
          markdown:
            "• 2~4층 공실 해소 일정 불확실\n• 엘리베이터 미설치 — 사무실 임대 경쟁력 제한\n• 매도인 양도세 이슈 확인 필요\n• 불법 건축물 여부 대장 확인 권장",
        },
        {
          section_type: "investment_thesis",
          title: "투자 포인트",
          markdown:
            "• 성수동 권역 프리미엄 — 장기 보유 전략 유효\n• 급매 조건 (협의 가능) — 현시점 매수 기회\n• 사옥 겸 일부 임대 운용 구조 가능\n• 엘리베이터 증설 시 밸류애드 포텐셜 존재",
        },
        {
          section_type: "next_steps",
          title: "다음 단계",
          markdown:
            "• 현장 실사 및 임대차계약서 확인 권장\n• Full IM(18섹션 상세 투자설명서) 요청 가능\n• 매수 의향서(LOI) 제출 시 상세 자료 제공",
        },
      ],
      boundary_note:
        "본 자료는 예비 검토용이며 투자 권유가 아닙니다. 정확한 수치와 리스크는 반드시 별도 실사를 통해 확인하시기 바랍니다.",
      full_im_readiness: {
        score: 52,
        missing_for_upgrade: ["임대차 요약표", "등기부등본", "건축물대장"],
      },
      kakao_copy:
        "【JS부동산중개 모바일 투자설명서】\n\n성수권역 꼬마빌딩 (70억~80억)\n\n수익률(추정): 약 4.2~4.8%\n현재 임대율: 85%\n\n⚠️ 본 자료는 예비 검토용입니다.",
    };

    return <MobileIMViewer data={fallbackData} />;
  }

  const viewData = {
    slug: project.slug,
    title: project.title ?? "모바일 투자설명서",
    key_metrics: (project as Record<string, unknown>).key_metrics as Record<string, string> ?? {
      estimated_yield: "실사 후 확인",
      occupancy: "확인 필요",
      price_band: "협의",
    },
    sections: (project as Record<string, unknown>).sections as Array<{section_type: string; title: string; markdown: string}> ?? [],
    boundary_note:
      ((project as Record<string, unknown>).gate_result as Record<string, string> | null)?.boundary_note ??
      "본 자료는 예비 검토용이며 투자 권유가 아닙니다.",
    full_im_readiness: {
      score: project.readiness_score ?? 50,
      missing_for_upgrade: [],
    },
    kakao_copy: (project as Record<string, unknown>).kakao_copy as string | undefined,
  };

  return <MobileIMViewer data={viewData} />;
}
