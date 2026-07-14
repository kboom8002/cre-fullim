// src/app/api/mobile-im/[id]/gate/route.ts

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
    const { gate_level, viewer_email, nda_agreed, nda_signed_at } = body;

    if (!gate_level || !viewer_email) {
      return NextResponse.json({ error: "Gate level and Viewer email are required." }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Log the gate pass event for regulatory audits
    const { error } = await supabase
      .from("mobile_im_view_logs")
      .insert([
        {
          mobile_im_project_id: id,
          viewer_email,
          event_type: "gate_pass",
          section_viewed: gate_level,
          dwell_time_seconds: 0,
          device_type: "mobile",
          metadata: {
            gate_level,
            nda_agreed: !!nda_agreed,
            nda_signed_at: nda_signed_at || null,
            timestamp: new Date().toISOString(),
          },
        }
      ]);

    if (error) {
      console.error("Failed to save gate pass log into Supabase:", error);
      return NextResponse.json({ error: "Failed to write gate log to database." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Gate ${gate_level} pass recorded.` }, { status: 201 });
  } catch (err: any) {
    console.error("Gate API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
