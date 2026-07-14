// src/app/m/[slug]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MobileIMViewer from "@/components/mobile-im/MobileIMViewer";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  // Fetch from Supabase to construct dynamic metadata
  try {
    const supabase = await createClient();
    const { data: project } = await supabase
      .from("mobile_im_projects")
      .select("title, key_metrics")
      .eq("slug", slug)
      .maybeSingle();

    if (project) {
      const area = project.key_metrics?.area_signal || "서울 핵심 권역";
      const price = project.key_metrics?.price_band || "협의";
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://credeal.net";
      const ogImageUrl = `${siteUrl}/api/og/mobile-im/${slug}`;
      return {
        title: `🏢 [JS부동산 추천] ${project.title || "상업용 부동산 모바일 투자설명서"}`,
        description: `📍 입지: ${area} | 💰 가격대: ${price} | 수익률 및 공시지가 분석 문서`,
        openGraph: {
          title: `🏢 [대외비 추천] ${project.title}`,
          description: `입지: ${area} | 가격대: ${price} | 실시간 공공데이터 연동 완료`,
          images: [ogImageUrl],
          type: "website",
        },
        twitter: {
          card: "summary_large_image",
          title: `🏢 [대외비 추천] ${project.title}`,
          description: `입지: ${area} | 가격대: ${price}`,
          images: [ogImageUrl],
        },
      };
    }
  } catch (e) {
    // ignore
  }

  return {
    title: "모바일 투자설명서 | JS부동산중개",
    description: "AI가 생성한 예비 검토용 모바일 투자설명서입니다.",
  };
}

export default async function MobileIMPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Supabase에서 프로젝트 및 캐시된 외부 데이터 조회
  const { data: project } = await supabase
    .from("mobile_im_projects")
    .select(`
      *,
      external_data:external_data_cache(*)
    `)
    .eq("slug", slug)
    .maybeSingle();

  if (!project) {
    // DB에 없을 시 데모용 fallback 대입
    const fallbackData = {
      id: "demo-project-id",
      slug,
      title: "성수권역 70억~80억 꼬마빌딩",
      key_metrics: {
        estimated_yield_pct: 4.5,
        occupancy_pct: 85,
        price_band: "70억~80억",
        area_signal: "성수동",
      },
      sections: [
        {
          section_type: "property_overview",
          title: "🏢 자산 개요 및 제원",
          markdown:
            "• 자산유형: 꼬마빌딩 (근린생활시설)\n• 위치: 성수권역 (정확한 주소 비공개)\n• 규모: 연면적 약 280평\n• 층수: 지상 4층\n• 건축연도: 2018년 (리모델링)\n• 엘리베이터 없음 / 주차 3대",
          confidence: "confirmed" as const,
          boundary_note: "본 섹션은 건축물대장 기준 정보입니다.",
        },
        {
          section_type: "location_access",
          title: "📍 입지 및 대중교통 분석",
          markdown:
            "• 성수역 도보 5분 거리\n• 이면도로 코너 입지 — 유동인구·가시성 우수\n• 1층 카페 운영 중 (앵커 테넌트)\n• 성수동 개발 압력 지속 — 장기 가치 보전 유리",
          confidence: "confirmed" as const,
          boundary_note: "본 입지는 지도 서비스 및 실사 기준입니다.",
        },
        {
          section_type: "lease_status",
          title: "📊 임대차 현황 및 공실 상태",
          markdown:
            "• 1층 카페 임대 중 (월세 400만원 추정)\n• 2~4층 사무실 공실\n• 현재 임대율: 약 30% (1층만 임차)\n• 공실 해소 시 임대수익 대폭 개선 가능",
          confidence: "inferred" as const,
          boundary_note: "공실 수치는 실시간 공실에 따라 변동될 수 있습니다.",
        },
        {
          section_type: "income_analysis",
          title: "💸 수익률 및 공시지가 분석",
          markdown:
            "• 현재 임대료 기준 추정 수익률: 약 2.5%\n• 2~4층 사무실 임대 완료 시 타겟 수익률: 4.2~4.8%\n• (주의: 기재된 수치는 예비 검토용입니다. 실제 투자 전 반드시 정밀 실사를 진행하세요.)",
          confidence: "needs_check" as const,
          boundary_note: "재무제표는 예비 추정치입니다.",
        },
        {
          section_type: "risk_check",
          title: "⚖️ 공법 규제 및 리스크 진단",
          markdown:
            "• 2~4층 공실 해소 일정 불확실\n• 엘리베이터 미설치 — 사무실 임대 경쟁력 제한\n• 매도인 양도세 이슈 확인 필요\n• 불법 건축물 여부 대장 확인 권장",
          confidence: "inferred" as const,
          boundary_note: "공법 규제 등은 실사 확인이 요구됩니다.",
        },
        {
          section_type: "investment_thesis",
          title: "🎯 핵심 투자 메리트",
          markdown:
            "• 성수동 권역 프리미엄 — 장기 보유 전략 유효\n• 급매 조건 (협의 가능) — 현시점 매수 기회\n• 사옥 겸 일부 임대 운용 구조 가능\n• 엘리베이터 증설 시 밸류애드 포텐셜 존재",
          confidence: "confirmed" as const,
          boundary_note: "투자의사결정 전 전문가 세무자문이 필수적입니다.",
        },
        {
          section_type: "next_steps",
          title: "📅 향후 검토 및 진행 절차",
          markdown:
            "• 현장 실사 및 임대차계약서 확인 권장\n• Full IM(18섹션 상세 투자설명서) 요청 가능\n• 매수 의향서(LOI) 제출 시 상세 자료 제공",
          confidence: "confirmed" as const,
          boundary_note: "협상 여부에 따라 스케줄이 다소 달라질 수 있습니다.",
        },
      ],
      boundary_note:
        "본 자료는 제공자료와 공개정보를 바탕으로 한 예비 검토 자료이며, 투자 권유, 감정평가, 법률·세무·대출 가능성 판단을 목적으로 하지 않습니다.",
      full_im_readiness: {
        score: 52,
        missing_for_upgrade: ["임대차 요약표", "등기부등본", "건축물대장"],
      },
      kakao_copy:
        "【JS부동산중개 모바일 투자설명서】\n\n성수권역 꼬마빌딩 (70억~80억)\n\n수익률(추정): 약 4.5%\n현재 임대율: 85%\n\n⚠️ 본 자료는 예비 검토용입니다.",
      supplemental_input: {
        photo_urls: [],
      },
      external_data: null,
    };

    return <MobileIMViewer data={fallbackData} />;
  }

  const externalData = Array.isArray(project.external_data) 
    ? project.external_data[0] 
    : project.external_data;

  const viewData = {
    id: project.id,
    slug: project.slug,
    title: project.title ?? "모바일 투자설명서",
    key_metrics: project.key_metrics ?? {
      estimated_yield_pct: 4.2,
      occupancy_pct: 90,
      price_band: "협의",
      area_signal: "서울 핵심 권역",
    },
    sections: project.sections ?? [],
    boundary_note: project.boundary_note ?? "본 자료는 제공자료와 공개정보를 바탕으로 한 예비 검토 자료입니다.",
    full_im_readiness: {
      score: project.readiness_score ?? 50,
      missing_for_upgrade: project.full_im_missing_data ?? ["임대차 요약표", "등기부등본"],
    },
    kakao_copy: project.kakao_copy,
    supplemental_input: project.supplemental_input || {},
    external_data: externalData || null,
  };

  return <MobileIMViewer data={viewData} />;
}
