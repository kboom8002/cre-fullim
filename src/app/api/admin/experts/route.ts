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
  const access = checkAdminAccess({ actor_role: actorRole, resource: "admin_experts" });
  if (!access.allowed) {
    return NextResponse.json({ error: true, code: "FORBIDDEN", message: access.reason }, { status: 403 });
  }
  const { data } = await supabase
    .from("expert_assignments")
    .select("id, project_id, section_type, expert_role, status, created_at, expert_id")
    .order("created_at", { ascending: false })
    .limit(200);

  return NextResponse.json({ ok: true, data: data ?? [] });
}
