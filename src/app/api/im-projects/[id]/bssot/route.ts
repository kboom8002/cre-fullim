/**
 * GET /api/im-projects/[id]/bssot
 *
 * Returns the building_ssot_full record for an IM project,
 * including computed missing_data and layer navigation data.
 *
 * Source: docs/10-domain-model.md §3.2, docs/07-import-from-bssot-lite.md §8
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  detectMissingData,
  classifyProtectedFields,
  type BSSoTLiteInput,
} from "@/domain/bssot/upgrade-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    // 1. Load IM project to get building_ssot_full_id
    const { data: project, error: projErr } = await supabase
      .from("im_projects")
      .select("id, building_ssot_full_id, status, source_building_ssot_lite_id")
      .eq("id", id)
      .single();

    if (projErr || !project) {
      return NextResponse.json(
        { error: true, code: "PROJECT_NOT_FOUND", message: "프로젝트를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 2. Load building_ssot_full
    const { data: bssotFull, error: bssotErr } = await supabase
      .from("building_ssot_full")
      .select("*")
      .eq("id", project.building_ssot_full_id)
      .single();

    if (bssotErr || !bssotFull) {
      return NextResponse.json(
        { error: true, code: "BSSOT_NOT_FOUND", message: "BSSoT Full 데이터를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 3. Load source snapshot to compute missing data
    const { data: snapshot } = await supabase
      .from("handoff_source_snapshots")
      .select("source_objects, source_building_ssot_lite_id")
      .eq("handoff_id", bssotFull.source_building_ssot_lite_id ?? "")
      .maybeSingle();

    const liteData = (snapshot?.source_objects?.building_ssot_lite ?? {}) as Partial<BSSoTLiteInput>;

    // 4. Compute missing data from lite source
    const missingData = liteData.id
      ? detectMissingData(liteData as BSSoTLiteInput)
      : [];

    // 5. Build layer summary (which layers have data vs empty)
    const layers = [
      "asset_identity",
      "physical_fact",
      "legal_registry",
      "lease_income",
      "market_location",
      "value_up_hypothesis",
      "risk_unknown",
      "buyer_fit",
      "disclosure_gate",
      "evidence_source",
      "b2c_consumer_demand",
      "space_environmental",
      "tenant_operator_management",
      "ai_answer_document_contract",
    ] as const;

    const layerSummary = layers.map((layer) => ({
      layer,
      has_data: Object.keys(bssotFull[layer] ?? {}).filter((k) => !k.startsWith("_")).length > 0,
      source: (bssotFull[layer] as Record<string, unknown>)?._source ?? null,
    }));

    // 6. Protected fields from disclosure_gate
    const protectedFields = classifyProtectedFields(
      (bssotFull.disclosure_gate as Record<string, unknown>)?.protected_fields as string[] ?? [],
    );

    return NextResponse.json({
      ok: true,
      data: {
        project_id: project.id,
        project_status: project.status,
        bssot_full: bssotFull,
        layer_summary: layerSummary,
        missing_data: missingData,
        protected_fields: protectedFields,
        readiness_status: bssotFull.readiness_status,
      },
    });
  } catch (err) {
    console.error("[GET /api/im-projects/:id/bssot]", err);
    return NextResponse.json(
      { error: true, code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
