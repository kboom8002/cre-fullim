// src/app/api/mobile-im/[id]/analytics/route.ts

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
    const { session_id, events } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "Events array is required." }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Map and insert view logs in bulk
    const logs = events.map((ev: any) => ({
      mobile_im_project_id: id,
      session_id: session_id || "unknown",
      viewer_fingerprint: ev.viewer_fingerprint || null,
      viewer_email: ev.viewer_email || null,
      section_viewed: ev.section_viewed || "unknown",
      dwell_time_seconds: parseInt(ev.dwell_time_seconds, 10) || 0,
      device_type: ev.device_type || "mobile",
      event_type: ev.event_type || "section_view",
      metadata: ev.metadata || {},
    }));

    const { error } = await supabase
      .from("mobile_im_view_logs")
      .insert(logs);

    if (error) {
      console.error("Failed to batch save analytics logs into Supabase:", error);
      return NextResponse.json({ error: "Failed to write logs to database." }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: logs.length }, { status: 201 });
  } catch (err: any) {
    console.error("Analytics logging API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
