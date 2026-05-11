/**
 * GET /api/expert/assignments/[assignmentId]
 * Returns assignment detail with section content.
 * Assignment-scoped: expert sees only their assigned section.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  try {
    const { assignmentId } = await params;
    const supabase = createServiceClient();

    const { data: assignment, error } = await supabase
      .from("expert_assignments")
      .select("id, project_id, section_id, expert_id, expert_role, assignment_type, status, instructions, due_at")
      .eq("id", assignmentId)
      .single();

    if (error || !assignment) {
      return NextResponse.json({ error: true, code: "NOT_FOUND" }, { status: 404 });
    }

    // Load section content (assignment-scoped — only the assigned section)
    let sectionData = null;
    if (assignment.section_id) {
      const { data: sec } = await supabase
        .from("im_sections")
        .select("title, markdown, risk_level, confidence, missing_data, status")
        .eq("id", assignment.section_id)
        .single();
      sectionData = sec;
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...assignment,
        section_title: sectionData?.title,
        section_markdown: sectionData?.markdown,
        section_risk_level: sectionData?.risk_level,
        section_confidence: sectionData?.confidence,
        section_missing_data: sectionData?.missing_data,
      },
    });
  } catch (err) {
    console.error("[GET /api/expert/assignments/:id]", err);
    return NextResponse.json({ error: true, code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
