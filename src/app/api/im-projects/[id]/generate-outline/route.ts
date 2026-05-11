/**
 * POST /api/im-projects/[id]/generate-outline
 *
 * Creates (or refreshes) the 18-section IM plan.
 * Idempotent: re-running does not duplicate sections.
 *
 * Side effects (docs/12-api-contracts.md §6.1):
 *   - upserts 18 im_sections rows
 *   - emits im_outline_generated activity_event
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { planSections, mergeSectionUpdates } from "@/domain/sections/section-planner";
import { computeReadiness } from "@/domain/readiness/readiness-service";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Load project + bssot_full
    const { data: project, error: projErr } = await supabase
      .from("im_projects")
      .select("id, building_ssot_full_id, target_output, created_by, readiness_score")
      .eq("id", id)
      .single();

    if (projErr || !project) {
      return NextResponse.json(
        { error: true, code: "PROJECT_NOT_FOUND", message: "프로젝트를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

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

    // 2. Run readiness (needed for section statuses)
    const readinessResult = computeReadiness({
      project_id: id,
      target_output: project.target_output ?? "buyer_ready_full_im",
      building_ssot_full: bssotFull as Record<string, unknown>,
      evidence_refs: [],
    });

    // 3. Plan sections
    const planned = planSections({
      project_id: id,
      target_output: project.target_output ?? "buyer_ready_full_im",
      building_ssot_full: bssotFull as Record<string, unknown>,
      readiness_result: readinessResult,
    });

    // 4. Load existing sections for idempotency check
    const { data: existing } = await supabase
      .from("im_sections")
      .select("section_type, section_order, status, confidence, risk_level, requires_expert_patch, required_expert_roles, missing_data, required_evidence, title")
      .eq("project_id", id);

    // 5. Merge (idempotent)
    const existingPlans = (existing ?? []).map((s) => ({
      section_type: s.section_type,
      section_order: s.section_order,
      title: s.title,
      status: s.status,
      confidence: s.confidence,
      risk_level: s.risk_level,
      requires_expert_patch: s.requires_expert_patch,
      required_expert_roles: s.required_expert_roles ?? [],
      missing_data: s.missing_data ?? [],
      required_evidence: s.required_evidence ?? [],
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const merged = mergeSectionUpdates(existingPlans as any, planned);

    // 6. Upsert all 18 sections
    const upsertRows = merged.map((s) => ({
      project_id: id,
      section_type: s.section_type,
      section_order: s.section_order,
      title: s.title,
      status: s.status,
      confidence: s.confidence,
      risk_level: s.risk_level,
      requires_expert_patch: s.requires_expert_patch,
      required_expert_roles: s.required_expert_roles,
      missing_data: s.missing_data,
      required_evidence: s.required_evidence,
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertErr } = await supabase
      .from("im_sections")
      .upsert(upsertRows, { onConflict: "project_id,section_type" });

    if (upsertErr) {
      console.error("[generate-outline] upsert error:", upsertErr);
      return NextResponse.json(
        { error: true, code: "DB_ERROR", message: "섹션 저장에 실패했습니다." },
        { status: 500 },
      );
    }

    // 7. Update project status
    await supabase
      .from("im_projects")
      .update({ status: "outline_generated", updated_at: new Date().toISOString() })
      .eq("id", id);

    // 8. Emit im_outline_generated event
    await supabase.from("activity_events").insert({
      actor_id: project.created_by ?? null,
      actor_role: "system",
      event_type: "im_outline_generated",
      entity_type: "im_project",
      entity_id: id,
      source_app: "js-full-im-studio",
      metadata: {
        sections_created: merged.length,
        readiness_score: project.readiness_score,
        was_idempotent: existingPlans.length > 0,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        project_id: id,
        sections_created: merged.length,
        was_idempotent: existingPlans.length > 0,
      },
    });
  } catch (err) {
    console.error("[POST /api/im-projects/:id/generate-outline]", err);
    return NextResponse.json(
      { error: true, code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

/**
 * GET /api/im-projects/[id]/generate-outline
 * Returns current section list (alias for /sections)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: sections, error } = await supabase
      .from("im_sections")
      .select("id, section_type, section_order, title, status, confidence, risk_level, requires_expert_patch, required_expert_roles, missing_data")
      .eq("project_id", id)
      .order("section_order");

    if (error) throw error;

    return NextResponse.json({ ok: true, data: { sections: sections ?? [] } });
  } catch (err) {
    console.error("[GET /api/im-projects/:id/generate-outline]", err);
    return NextResponse.json(
      { error: true, code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
