/**
 * POST /api/im-projects/[id]/readiness-check
 *
 * Runs the IM Readiness Engine against the project's building_ssot_full,
 * persists the result to im_projects.readiness_score, and emits
 * im_readiness_checked activity_event.
 *
 * Acceptance: docs/23-full-im-studio-dashboard.md §6, docs/15 §4
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeReadiness } from "@/domain/readiness/readiness-service";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Load project + building_ssot_full
    const { data: project, error: projErr } = await supabase
      .from("im_projects")
      .select("id, building_ssot_full_id, target_output, created_by, status")
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

    // 2. Run readiness engine (pure computation — no AI call)
    const readinessResult = computeReadiness({
      project_id: id,
      target_output: project.target_output ?? "buyer_ready_full_im",
      building_ssot_full: bssotFull as Record<string, unknown>,
      evidence_refs: (bssotFull.evidence_source as Record<string, unknown>)
        ?.evidence_refs as [] ?? [],
    });

    // 3. Persist readiness_score to im_projects
    await supabase
      .from("im_projects")
      .update({
        readiness_score: readinessResult.readiness_score,
        status: project.status === "intake" ? "readiness_checked" : project.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    // 4. Emit im_readiness_checked event (docs/07-import §12 Events)
    await supabase.from("activity_events").insert({
      actor_id: project.created_by ?? null,
      actor_role: "system",
      event_type: "im_readiness_checked",
      entity_type: "im_project",
      entity_id: id,
      source_app: "js-full-im-studio",
      metadata: {
        readiness_score: readinessResult.readiness_score,
        available_outputs: readinessResult.available_outputs,
        blocked_outputs: readinessResult.blocked_outputs,
        missing_count: readinessResult.missing_required_data.length,
        expert_patches_needed: readinessResult.required_expert_patches.length,
      },
    });

    return NextResponse.json({ ok: true, data: readinessResult });
  } catch (err) {
    console.error("[POST /api/im-projects/:id/readiness-check]", err);
    return NextResponse.json(
      { error: true, code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
