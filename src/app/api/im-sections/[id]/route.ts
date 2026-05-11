import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transitionSectionStatus, SectionStatus } from "@/domain/sections/status-transition";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: section, error } = await supabase
      .from("im_sections")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !section) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "섹션을 찾을 수 없습니다." } }, { status: 404 });
    }

    return NextResponse.json(section, { status: 200 });
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

    const allowedFields = ["markdown", "content_json", "confidence", "risk_level"];
    const updates: Record<string, any> = {};

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    // Status transition if requested
    if (body.status) {
      const { data: section } = await supabase.from("im_sections").select("status").eq("id", id).single();
      if (section && section.status !== body.status) {
         try {
           const transition = transitionSectionStatus({
             from: section.status as SectionStatus,
             to: body.status as SectionStatus,
             actor_role: request.headers.get("x-actor-role") || "system"
           });
           updates.status = transition.status;
         } catch (e: any) {
           return NextResponse.json({ error: { code: e.code || "INVALID_TRANSITION", message: e.message } }, { status: 400 });
         }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "수정할 필드가 없습니다." } }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from("im_sections")
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
