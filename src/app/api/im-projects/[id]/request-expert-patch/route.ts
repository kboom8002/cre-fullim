import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const supabase = await createClient();

    const { section_id, expert_id, expert_role, assignment_type, instructions, due_at } = body;

    if (!section_id || !expert_id || !expert_role || !assignment_type) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "필수 필드가 누락되었습니다." } }, { status: 400 });
    }

    const { data: userAuth } = await supabase.auth.getUser();
    const userId = userAuth?.user?.id || "00000000-0000-0000-0000-000000000000";

    const { data: assignment, error } = await supabase
      .from("expert_assignments")
      .insert({
        project_id: id,
        section_id,
        expert_id,
        expert_role,
        assignment_type,
        instructions: instructions || null,
        due_at: due_at || null,
        status: "assigned",
        created_by: userId
      })
      .select("*")
      .single();

    if (error || !assignment) {
      return NextResponse.json({ error: { code: "CREATE_FAILED", message: `전문가 배정에 실패했습니다: ${error?.message}` } }, { status: 400 });
    }

    // Update section status
    await supabase.from("im_sections").update({ status: "needs_expert_patch" }).eq("id", section_id);

    return NextResponse.json({
      assignment_id: assignment.id,
      status: assignment.status
    }, { status: 201 });

  } catch (error: unknown) {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "서버 에러가 발생했습니다." } }, { status: 500 });
  }
}
