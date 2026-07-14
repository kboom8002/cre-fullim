// src/app/api/mobile-im/[id]/interest/route.ts

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
    const { name, email, phone, message } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and Email are required." }, { status: 400 });
    }

    const supabase = createServiceClient();
    
    // Insert interest record
    const { error } = await supabase
      .from("mobile_im_interests")
      .insert([
        {
          mobile_im_project_id: id,
          viewer_name: name,
          viewer_email: email,
          viewer_phone: phone || null,
          message: message || null,
          interest_level: "interested",
        }
      ]);

    if (error) {
      console.error("Failed to insert interest into Supabase:", error);
      return NextResponse.json({ error: "Database save failed." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Interest saved successfully." }, { status: 201 });
  } catch (err: any) {
    console.error("Interest API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
