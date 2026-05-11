import { NextRequest, NextResponse } from "next/server";
import { validateHandoffToken } from "@/domain/handoff/handoff-service";
import { computeMobileIMReadiness } from "@/domain/mobile-im/mobile-im-readiness";
import { generateMobileIM } from "@/domain/mobile-im/mobile-im-writer";
import { runMobileIMLiteGate } from "@/domain/gate/gate-review-service";
import { buildMobileIMCard } from "@/domain/mobile-im/mobile-im-export";
import type { MobileIMProject, MobileIMSupplementalInput } from "@/domain/mobile-im/mobile-im-types";

// Mock DB logic
let mockDb: Record<string, MobileIMProject> = {};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handoff_token, supplemental = {} } = body as { handoff_token: string; supplemental?: MobileIMSupplementalInput };

    // 1. handoff_token 검증
    const tokenCheck = validateHandoffToken(handoff_token);
    if (!tokenCheck.valid) {
      return NextResponse.json({ error: true, message: tokenCheck.message }, { status: 400 });
    }

    // MVP mocking: fetch building_ssot_lite based on token
    // In real app: call MVP's GET /api/full-im-handoffs/:token
    const mockBssotLite = {
      asset_identity: {
        area_signal: "성수권역",
        price_band: "80억대",
        asset_type: "근생형 자산"
      },
      disclosure_gate: {
        protected_fields: ["exact_address", "tenant_names"]
      }
    };

    // 2. Lite Readiness 체크
    const readiness = computeMobileIMReadiness(mockBssotLite, supplemental);
    if (!readiness.can_generate) {
      return NextResponse.json({ 
        error: true, 
        message: "Readiness score is too low", 
        missing: readiness.missing 
      }, { status: 400 });
    }

    // 3. 7섹션 AI 생성
    const generation = await generateMobileIM({
      building_ssot_lite: mockBssotLite,
      supplemental,
      readiness
    });

    // 4. Lite Gate 실행
    const gateResult = runMobileIMLiteGate(generation.sections, mockBssotLite);
    if (gateResult.disclosure_status === "blocked" || gateResult.risk_status === "blocked") {
       return NextResponse.json({ 
        error: true, 
        message: "Gate validation failed", 
        gateResult 
      }, { status: 400 });
    }

    // 5. slug 생성 + 저장
    const id = "mim_" + Date.now().toString();
    const slug = "js-" + Math.random().toString(36).substring(2, 8);
    
    const project: MobileIMProject = {
      id,
      source_type: "dealcard_handoff",
      source_handoff_token: handoff_token,
      building_ssot_lite: mockBssotLite,
      supplemental_input: supplemental,
      readiness_score: readiness.score,
      status: "published",
      slug,
      title: "",
      key_metrics: {},
      sections: generation.sections,
      gate_result: gateResult,
      created_at: new Date().toISOString()
    };

    const card = buildMobileIMCard(project, request.nextUrl.origin);
    project.title = card.title;
    project.kakao_copy = card.kakao_copy;
    
    mockDb[id] = project;
    mockDb[slug] = project; // Index by slug for viewer

    return NextResponse.json({
      mobile_im_id: id,
      slug,
      status: project.status,
      public_url: card.public_url,
      kakao_copy: card.kakao_copy
    });
  } catch (err) {
    console.error("[POST /api/mobile-im/create]", err);
    return NextResponse.json({ error: true, message: "Server Error" }, { status: 500 });
  }
}
