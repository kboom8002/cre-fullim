import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: project, error } = await supabase
      .from("im_projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "프로젝트를 찾을 수 없습니다." } }, { status: 404 });
    }
    
    return NextResponse.json({
      ...project,
      permissions: {
        can_edit: true,
        can_run_gate: true,
        can_export: true,
      }
    }, { status: 200 });

  } catch (error: unknown) {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "서버 에러가 발생했습니다." } }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    const allowedFields = ["title", "description", "project_type", "target_output", "package_intent"];
    const updates: Record<string, any> = {};

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "수정할 필드가 없습니다." } }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from("im_projects")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: { code: "UPDATE_FAILED", message: "수정에 실패했습니다." } }, { status: 400 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "서버 에러가 발생했습니다." } }, { status: 500 });
  }
}
