// src/app/api/mobile-im/[id]/meeting/route.ts

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
    const { email, phone, meeting_type, date, time } = body;

    if (!email || !meeting_type || !date) {
      return NextResponse.json({ error: "Email, meeting type, and preferred date are required." }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Insert meeting schedule
    const { error } = await supabase
      .from("mobile_im_meetings")
      .insert([
        {
          mobile_im_project_id: id,
          viewer_email: email,
          viewer_phone: phone || null,
          meeting_type,
          preferred_date: date,
          preferred_time: time || null,
          status: "pending",
        }
      ]);

    if (error) {
      console.error("Failed to schedule meeting in Supabase:", error);
      return NextResponse.json({ error: "Database save failed." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Meeting scheduled successfully." }, { status: 201 });
  } catch (err: any) {
    console.error("Meeting scheduling API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
