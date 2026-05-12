import { NextRequest, NextResponse } from "next/server";
import { validateHandoffToken } from "@/domain/handoff/handoff-service";
import { computeMobileIMReadiness } from "@/domain/mobile-im/mobile-im-readiness";
import { generateMobileIM } from "@/domain/mobile-im/mobile-im-writer";
import { runMobileIMLiteGate } from "@/domain/gate/gate-review-service";
import { buildMobileIMCard } from "@/domain/mobile-im/mobile-im-export";
import type { MobileIMProject, MobileIMSupplementalInput } from "@/domain/mobile-im/mobile-im-types";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handoff_token, supplemental = {} } = body as {
      handoff_token: string;
      supplemental?: MobileIMSupplementalInput;
    };

    // 1. 토큰 검증
    const tokenCheck = validateHandoffToken(handoff_token);
    if (!tokenCheck.valid) {
      return NextResponse.json({ error: true, message: tokenCheck.message }, { status: 400 });
    }

    // 2. DealCard DB에서 핸드오프 → BSsoT Lite 조회
    const supabase = await createClient();
    let bssotLite: Record<string, unknown> = {};

    // 핸드오프 토큰으로 원본 건물 정보 조회 시도
    const { data: handoff } = await supabase
      .from("full_im_handoffs")
      .select("source_building_ssot_lite_id")
      .eq("handoff_token", handoff_token)
      .maybeSingle();

    if (handoff?.source_building_ssot_lite_id) {
      const { data: building } = await supabase
        .from("building_ssot_lite")
        .select("layers, area_signal, asset_type, price_band")
        .eq("id", handoff.source_building_ssot_lite_id)
        .maybeSingle();

      if (building) {
        const layers = building.layers as Record<string, unknown> ?? {};
        bssotLite = {
          asset_identity: {
            area_signal: building.area_signal ?? (layers.asset_identity as Record<string, unknown>)?.area_signal ?? "권역 정보 없음",
            price_band:  building.price_band  ?? (layers.asset_identity as Record<string, unknown>)?.price_band  ?? "가격 미정",
            asset_type:  building.asset_type  ?? (layers.asset_identity as Record<string, unknown>)?.asset_type  ?? "상업용",
          },
          disclosure_gate: {
            protected_fields: ["exact_address", "tenant_names", "owner_contact"],
          },
          ...layers,
        };
      }
    }

    // fallback: 데모용 mock
    if (!bssotLite.asset_identity) {
      bssotLite = {
        asset_identity: { area_signal: "성수권역", price_band: "70억~80억", asset_type: "꼬마빌딩" },
        disclosure_gate: { protected_fields: ["exact_address", "tenant_names"] },
      };
    }

    // 3. Lite Readiness 체크
    const readiness = computeMobileIMReadiness(bssotLite, supplemental);
    if (!readiness.can_generate) {
      return NextResponse.json(
        { error: true, message: "준비도가 부족합니다.", missing: readiness.missing },
        { status: 400 }
      );
    }

    // 4. 7섹션 AI 생성
    const generation = await generateMobileIM({ building_ssot_lite: bssotLite, supplemental, readiness });

    // 5. Lite Gate 실행
    const gateResult = runMobileIMLiteGate(generation.sections, bssotLite);
    if (gateResult.disclosure_status === "blocked" || gateResult.risk_status === "blocked") {
      return NextResponse.json(
        { error: true, message: "Gate 검토 실패", gateResult },
        { status: 400 }
      );
    }

    // 6. Supabase mobile_im_projects에 저장
    const slug = "js-" + Math.random().toString(36).substring(2, 8);
    const projectPayload = {
      source_type: "dealcard_handoff",
      source_handoff_token: handoff_token,
      readiness_score: readiness.score,
      status: "published",
      slug,
      sections: generation.sections,
      gate_result: gateResult,
      building_snapshot: bssotLite,
    };

    const card = buildMobileIMCard(
      { ...projectPayload, id: "temp", title: "", key_metrics: {}, supplemental_input: supplemental, building_ssot_lite: bssotLite, created_at: new Date().toISOString() } as MobileIMProject,
      request.nextUrl.origin
    );

    const { data: savedProject, error: saveError } = await supabase
      .from("mobile_im_projects")
      .insert({
        ...projectPayload,
        title: card.title,
        kakao_copy: card.kakao_copy,
      })
      .select("id")
      .single();

    if (saveError || !savedProject) {
      // DB 저장 실패 시 공개 URL에 slug만 반환 (뷰어는 slug로 세션 스토리지에서 읽음)
      console.warn("[mobile-im/create] DB save failed, falling back to URL-based delivery", saveError);
    }

    const publicUrl = `${request.nextUrl.origin}/m/${slug}`;

    return NextResponse.json({
      mobile_im_id: savedProject?.id ?? slug,
      slug,
      status: "published",
      public_url: publicUrl,
      kakao_copy: card.kakao_copy,
      // 뷰어가 DB 없이도 데이터를 받을 수 있도록 전체 섹션 포함
      preview_data: {
        title: card.title,
        slug,
        key_metrics: (generation.sections.find(s => s.section_type === "income_analysis") ? {
          estimated_yield: supplemental.estimated_yield_pct ? `약 ${supplemental.estimated_yield_pct}%` : "실사 후 확인",
          occupancy: supplemental.vacancy_status ?? "확인 필요",
          price_band: (bssotLite.asset_identity as Record<string, unknown>)?.price_band as string ?? "협의",
        } : {
          estimated_yield: "실사 후 확인",
          occupancy: supplemental.vacancy_status ?? "확인 필요",
          price_band: (bssotLite.asset_identity as Record<string, unknown>)?.price_band as string ?? "협의",
        }),
        sections: generation.sections,
        boundary_note: gateResult.boundary_note ?? "본 자료는 예비 검토용이며 투자 권유가 아닙니다.",
        full_im_readiness: { score: readiness.score, missing_for_upgrade: readiness.missing ?? [] },
      },
    });
  } catch (err) {
    console.error("[POST /api/mobile-im/create]", err);
    return NextResponse.json({ error: true, message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
