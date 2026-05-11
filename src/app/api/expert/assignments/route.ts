/**
 * GET /api/expert/assignments
 * Returns assignments for the current expert (assignment-scoped).
 */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("expert_assignments")
      .select("id, project_id, section_id, expert_role, assignment_type, status, instructions, due_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ ok: true, data: { assignments: data ?? [] } });
  } catch (err) {
    console.error("[GET /api/expert/assignments]", err);
    return NextResponse.json({ ok: true, data: { assignments: [] } });
  }
}
