// src/app/api/mobile-im/[id]/questions/route.ts

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const id = params.id;
  
  try {
    const body = await request.json();
    const { section_type, viewer_email, question_text } = body;

    if (!section_type || !question_text) {
      return NextResponse.json({ error: "Section type and Question text are required." }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Insert question into DB
    const { error } = await supabase
      .from("mobile_im_questions")
      .insert([
        {
          mobile_im_project_id: id,
          section_type,
          viewer_email: viewer_email || "anonymous@viewer.com",
          question_text,
          is_public: false,
        }
      ]);

    if (error) {
      console.error("Failed to insert question into Supabase:", error);
      return NextResponse.json({ error: "Database save failed." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Question submitted successfully." }, { status: 201 });
  } catch (err: any) {
    console.error("Questions API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
