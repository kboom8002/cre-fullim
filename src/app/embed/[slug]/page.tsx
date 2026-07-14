// src/app/embed/[slug]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import MobileIMViewer from "@/components/mobile-im/MobileIMViewer";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function MobileIMEmbedPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("mobile_im_projects")
    .select(`
      *,
      external_data:external_data_cache(*)
    `)
    .eq("slug", slug)
    .maybeSingle();

  if (!project) {
    return notFound();
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
    boundary_note: project.boundary_note ?? "본 자료는 예비 검토용 자산 설명서입니다.",
    full_im_readiness: {
      score: project.readiness_score ?? 50,
      missing_for_upgrade: project.full_im_missing_data ?? [],
    },
    kakao_copy: project.kakao_copy,
    supplemental_input: project.supplemental_input || {},
    external_data: externalData || null,
  };

  return (
    <div className="w-full h-full bg-[#0a0f1e] overflow-y-auto">
      {/* Minimized shell, hides header and renders embed viewer */}
      <MobileIMViewer data={viewData} />
    </div>
  );
}
