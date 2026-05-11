import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch im_project and building_ssot_full to find vacancies
    const { data: project, error: projErr } = await supabase
      .from("im_projects")
      .select(`
        id, 
        source_building_ssot_lite_id,
        building_ssot_full_id,
        building_ssot_full (
          physical_fact,
          value_up_hypothesis,
          buyer_fit
        )
      `)
      .eq("id", id)
      .single();

    if (projErr || !project || !project.building_ssot_full) {
      return NextResponse.json(
        { error: "프로젝트를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const bssotFull = project.building_ssot_full as any;
    const physicalFact = bssotFull.physical_fact || {};
    
    // In a real scenario, we'd parse bssotFull to extract precise space candidates.
    // For MVP, we'll create a candidate based on physical_fact.vacancy_signal
    const vacancySignal = physicalFact.vacancy_signal || "공실 상태를 확인해주세요.";

    const payload = {
      payload_version: "1.0",
      source_app: "js-full-im-studio",
      building_id: project.source_building_ssot_lite_id,
      source_im_project_id: project.id,
      space_candidates: [
        {
          floor: "미정",
          vacancy_context: vacancySignal,
          value_add_note: "Full IM 기반 공실 채우기 전략",
        }
      ],
      target_tenant_strategy: [], // could be extracted from buyer_fit
      value_add_context: "",
      disclosure_level: "internal_only",
    };

    const spaceAiBaseUrl = process.env.SPACE_AI_PAGE_URL || "http://localhost:3003";

    // 2. Call Space AI Page
    const res = await fetch(`${spaceAiBaseUrl}/api/handoffs/from-full-im`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-api-key": process.env.INTER_SERVICE_API_KEY || "mock-inter-service-key",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: "Space AI 연동 실패", details: errText },
        { status: 502 },
      );
    }

    const spaceAiResponse = await res.json();

    // 3. Emit event and optionally record the space_ai_handoff_id in metadata
    const { data: userAuth } = await supabase.auth.getUser();
    const actorId = userAuth?.user?.id;

    await supabase.from("activity_events").insert({
      actor_id: actorId || null,
      actor_role: "broker",
      event_type: "space_ai_triggered_from_full_im",
      entity_type: "im_project",
      entity_id: project.id,
      source_app: "js-full-im-studio",
      metadata: { 
        space_ai_handoff_id: spaceAiResponse.handoff_id,
        space_drafts: spaceAiResponse.space_drafts
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        handoff_id: spaceAiResponse.handoff_id,
        space_drafts: spaceAiResponse.space_drafts,
      }
    });

  } catch (error) {
    console.error("[POST /api/im-projects/:id/trigger-space-ai]", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
