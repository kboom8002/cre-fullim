import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAdminAccess } from "@/domain/admin/admin-service";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: userAuth } = await supabase.auth.getUser();
  
  if (!userAuth?.user) {
    return NextResponse.json({ error: true, code: "UNAUTHORIZED", message: "인증이 필요합니다." }, { status: 401 });
  }

  const actorRole = userAuth.user.app_metadata?.role || "broker";
  const access = checkAdminAccess({ actor_role: actorRole, resource: "gate_queue" });
  if (!access.allowed) {
    return NextResponse.json({ error: true, code: "FORBIDDEN", message: access.reason }, { status: 403 });
  }

  // Projects with gate_review status or pending review
  const { data: projects } = await supabase
    .from("im_projects")
    .select("id, status, readiness_score, created_at")
    .in("status", ["gate_review", "ai_draft", "patched"])
    .order("created_at", { ascending: false })
    .limit(100);

  // Enrich with gate review data
  const enriched = await Promise.all(
    (projects ?? []).map(async (p) => {
      const { data: gate } = await supabase
        .from("gate_reviews")
        .select("overall_status, has_p0_violation, buyer_ready_eligible")
        .eq("project_id", p.id)
        .maybeSingle();

      return {
        ...p,
        gate_overall_status: gate?.overall_status ?? "not_run",
        has_p0_violation: gate?.has_p0_violation ?? false,
        buyer_ready_eligible: gate?.buyer_ready_eligible ?? false,
      };
    }),
  );

  return NextResponse.json({ ok: true, data: enriched });
}
