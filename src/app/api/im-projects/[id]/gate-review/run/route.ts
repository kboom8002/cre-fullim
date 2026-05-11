/**
 * POST /api/im-projects/[id]/gate-review/run
 *
 * Runs all gates for the project and persists results.
 * Emits gate_review_started + gate_review_completed events.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runGateCheck, type GateCheckInput } from "@/domain/gate/gate-review-service";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();
    const userId = userAuth?.user?.id || null;

    // Load project
    const { data: project } = await supabase
      .from("im_projects").select("id, building_ssot_full_id, readiness_score, created_by")
      .eq("id", projectId).single();

    if (!project) return NextResponse.json({ error: true, code: "NOT_FOUND" }, { status: 404 });

    // Load sections
    const { data: sections } = await supabase
      .from("im_sections")
      .select("id, section_type, status, requires_expert_patch, missing_data, markdown, risk_level")
      .eq("project_id", projectId)
      .order("section_order");

    // Load BSSoT
    const { data: bssot } = await supabase
      .from("building_ssot_full").select("*").eq("id", project.building_ssot_full_id ?? "").single();

    // Load expert patches
    const { data: patches } = await supabase
      .from("expert_patches")
      .select("section_id, status, visibility_after_review")
      .eq("project_id", projectId);

    const gateInput: GateCheckInput = {
      project_id: projectId,
      sections: (sections ?? []).map(s => ({
        id: s.id, section_type: s.section_type, status: s.status,
        requires_expert_patch: s.requires_expert_patch ?? false,
        missing_data: s.missing_data ?? [],
      })),
      building_ssot_full: (bssot ?? {}) as Record<string, unknown>,
      expert_patches: (patches ?? []).map(p => ({
        section_id: p.section_id, status: p.status, visibility_after_review: p.visibility_after_review,
      })),
      section_markdown_samples: (sections ?? [])
        .filter(s => s.markdown)
        .map(s => ({ section_id: s.id, markdown: s.markdown, visibility: "public_blind" })),
      readiness_score: project.readiness_score ?? 0,
    };

    await supabase.from("activity_events").insert({
      actor_id: userId ?? project.created_by, actor_role: "system",
      event_type: "gate_review_started", entity_type: "im_project", entity_id: projectId,
      source_app: "js-full-im-studio", metadata: { project_id: projectId },
    });

    const result = runGateCheck(gateInput);

    // Persist gate review result
    await supabase.from("gate_reviews").upsert({
      project_id: projectId,
      overall_status: result.overall_status,
      gates: result.gates,
      violations: result.violations,
      has_p0_violation: result.has_p0_violation,
      buyer_ready_eligible: result.buyer_ready_eligible,
      run_at: result.run_at,
    }, { onConflict: "project_id" });

    await supabase.from("activity_events").insert({
      actor_id: userId ?? project.created_by, actor_role: "system",
      event_type: "gate_review_completed", entity_type: "im_project", entity_id: projectId,
      source_app: "js-full-im-studio",
      metadata: {
        overall_status: result.overall_status,
        violation_count: result.violations.length,
        has_p0_violation: result.has_p0_violation,
        buyer_ready_eligible: result.buyer_ready_eligible,
      },
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    console.error("[POST gate-review/run]", err);
    return NextResponse.json({ error: true, code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
