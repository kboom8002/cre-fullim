import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createClient();

    const { data: sections, error } = await supabase
      .from("im_sections")
      .select("*")
      .eq("project_id", id)
      .order("section_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: { code: "FETCH_FAILED", message: "섹션 목록을 불러오지 못했습니다." } }, { status: 400 });
    }

    return NextResponse.json({ sections }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "서버 에러가 발생했습니다." } }, { status: 500 });
  }
}
