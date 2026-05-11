/**
 * GET /api/im-projects
 * Returns the current user's IM projects (RLS enforced)
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: userAuth } = await supabase.auth.getUser();

  if (!userAuth?.user) {
    return NextResponse.json({ error: true, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("im_projects")
    .select("id, status, readiness_score, project_type, target_output, title, created_at, created_by")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: true, code: "DB_ERROR", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: data ?? [] });
}
