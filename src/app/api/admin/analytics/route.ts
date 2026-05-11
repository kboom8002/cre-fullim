/**
 * GET /api/admin/analytics
 *
 * Returns analytics summary from activity_events.
 * Admin-only (checked by caller role header).
 * Metadata is safe-filtered before return.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  checkAdminAccess,
  buildAnalyticsSummary,
  filterSafeEventMetadata,
  type AnalyticsEventInput,
} from "@/domain/admin/admin-service";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: userAuth } = await supabase.auth.getUser();
  
  if (!userAuth?.user) {
    return NextResponse.json({ error: true, code: "UNAUTHORIZED", message: "인증이 필요합니다." }, { status: 401 });
  }

  // Retrieve role from JWT app_metadata or fallback to checking a trusted custom header ONLY IF needed
  // In production, Supabase Auth custom claims should be used.
  const actorRole = userAuth.user.app_metadata?.role || "broker";
  
  const access = checkAdminAccess({ actor_role: actorRole, resource: "admin_analytics" });
  if (!access.allowed) {
    return NextResponse.json({ error: true, code: "FORBIDDEN", message: access.reason }, { status: 403 });
  }

  const days = Number(req.nextUrl.searchParams.get("days") ?? 30);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: events } = await supabase
    .from("activity_events")
    .select("event_type, metadata, created_at, source_app")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1000);

  const safeEvents: AnalyticsEventInput[] = (events ?? []).map(e => ({
    event_type: e.event_type ?? "",
    occurred_at: e.created_at ?? "",
    source_app: e.source_app ?? "js-full-im-studio",
    metadata: filterSafeEventMetadata(e.metadata ?? {}),
  }));

  const summary = buildAnalyticsSummary(safeEvents);

  // Load project/expert counts
  const { count: projectCount } = await supabase
    .from("im_projects").select("id", { count: "exact", head: true });

  const { count: expertCount } = await supabase
    .from("expert_assignments").select("id", { count: "exact", head: true });

  const { count: candidateCount } = await supabase
    .from("golden_im_candidates").select("id", { count: "exact", head: true });

  return NextResponse.json({
    ok: true,
    data: {
      ...summary,
      totals: {
        projects: projectCount ?? 0,
        expert_assignments: expertCount ?? 0,
        golden_candidates: candidateCount ?? 0,
      },
      period_days: days,
    },
  });
}
