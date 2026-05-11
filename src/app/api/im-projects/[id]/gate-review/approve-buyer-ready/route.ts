/**
 * POST /api/im-projects/[id]/gate-review/approve-buyer-ready
 *
 * Reviewer/admin approves buyer-ready status.
 * Guards enforced: role check, P0 check, gate status check.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { canApproveBuyerReady, buildGateOverride, type GateStatus } from "@/domain/gate/gate-review-service";

const ApproveSchema = z.object({
  actor_role: z.enum(["reviewer", "admin"]),
  override_reason: z.string().optional(),
  risk_acknowledged: z.boolean().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const body = ApproveSchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json({ error: true, code: "VALIDATION_ERROR", message: "요청이 유효하지 않습니다." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();
    const userId = userAuth?.user?.id || null;

    // Load latest gate review result
    const { data: gateReview } = await supabase
      .from("gate_reviews").select("*").eq("project_id", projectId).single();

    if (!gateReview) {
      return NextResponse.json({ error: true, code: "NO_GATE_REVIEW", message: "Gate Review를 먼저 실행하세요." }, { status: 422 });
    }

    const gates = (gateReview.gates ?? []) as { gate_type: string; status: GateStatus }[];
    const missingPatches = (gateReview.violations ?? [])
      .filter((v: { gate_type: string; issue_type: string }) => v.gate_type === "expert_scope_gate" && v.issue_type === "missing_expert_patch")
      .map((v: { section_id?: string }) => v.section_id ?? "unknown") as string[];

    const approval = canApproveBuyerReady({
      actor_role: body.data.actor_role,
      gate_results: gates.map(g => ({ gate_type: g.gate_type, status: g.status })),
      has_p0_violation: gateReview.has_p0_violation,
      missing_required_patches: missingPatches,
    });

    if (!approval.can_approve) {
      // If override provided, try to log it
      if (body.data.override_reason && !gateReview.has_p0_violation) {
        if (!body.data.risk_acknowledged) {
          return NextResponse.json({ error: true, code: "RISK_ACK_REQUIRED", message: "risk_acknowledged가 필요합니다." }, { status: 422 });
        }
        const override = buildGateOverride({
          reviewer_id: body.data.actor_role,
          gate_type: "buyer_ready_approval_gate",
          section_id: projectId,
          reason: body.data.override_reason,
          risk_acknowledged: true,
          is_p0_disclosure: false,
        });
        await supabase.from("gate_overrides").insert({ ...override, project_id: projectId });
        await supabase.from("activity_events").insert({
          actor_id: userId,
          actor_role: body.data.actor_role,
          event_type: "reviewer_override_created", entity_type: "im_project", entity_id: projectId,
          source_app: "js-full-im-studio",
          metadata: { gate_type: "buyer_ready_approval_gate", reason: override.reason },
        });
      } else {
        await supabase.from("activity_events").insert({
          actor_id: userId,
          actor_role: body.data.actor_role,
          event_type: "buyer_ready_blocked", entity_type: "im_project", entity_id: projectId,
          source_app: "js-full-im-studio",
          metadata: { reason: approval.reason, blocking_gates: approval.blocking_gates },
        });
        return NextResponse.json({
          error: true, code: "BUYER_READY_BLOCKED",
          message: approval.reason,
          blocking_gates: approval.blocking_gates,
        }, { status: 422 });
      }
    }

    // Approve
    await supabase.from("im_projects")
      .update({ status: "buyer_ready", updated_at: new Date().toISOString() })
      .eq("id", projectId);

    await supabase.from("activity_events").insert({
      actor_id: userId,
      actor_role: body.data.actor_role,
      event_type: "buyer_ready_approved", entity_type: "im_project", entity_id: projectId,
      source_app: "js-full-im-studio",
      metadata: { gate_overall_status: gateReview.overall_status, has_override: !!body.data.override_reason },
    });

    return NextResponse.json({ ok: true, data: { status: "buyer_ready", project_id: projectId } });
  } catch (err) {
    console.error("[POST approve-buyer-ready]", err);
    return NextResponse.json({ error: true, code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
