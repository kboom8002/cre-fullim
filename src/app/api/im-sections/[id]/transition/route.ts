/**
 * POST /api/im-sections/[id]/transition
 *
 * Applies a section status transition via the state machine.
 * Rejects invalid transitions with structured error.
 *
 * docs/13-status-transition.md §10 — status changes via service only.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { transitionSectionStatus, type SectionStatus, type SectionTransitionError } from "@/domain/sections/status-transition";

const RequestSchema = z.object({
  to_status: z.enum(["planned","ai_draft","needs_data","needs_expert_patch","patched","gate_review","buyer_ready","blocked"]),
  reason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = RequestSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: true, code: "VALIDATION_ERROR", message: "유효하지 않은 요청입니다." }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: section, error } = await supabase
      .from("im_sections")
      .select("id, status, project_id")
      .eq("id", id)
      .single();

    if (error || !section) {
      return NextResponse.json({ error: true, code: "SECTION_NOT_FOUND" }, { status: 404 });
    }

    // Apply transition via service (throws on invalid)
    const result = transitionSectionStatus({
      from: section.status as SectionStatus,
      to: body.data.to_status as SectionStatus,
      actor_role: "editor",
      reason: body.data.reason,
    });

    await supabase
      .from("im_sections")
      .update({ status: result.to_status, updated_at: new Date().toISOString() })
      .eq("id", id);

    await supabase.from("activity_events").insert({
      actor_role: "editor",
      event_type: "im_section_status_changed",
      entity_type: "im_section",
      entity_id: id,
      source_app: "js-full-im-studio",
      metadata: { from_status: result.from_status, to_status: result.to_status, reason: result.reason },
    });

    return NextResponse.json({ ok: true, data: { status: result.to_status } });
  } catch (err) {
    const te = err as SectionTransitionError;
    if (te.code === "INVALID_TRANSITION") {
      return NextResponse.json(
        { error: true, code: "INVALID_TRANSITION", message: te.message, from_status: te.from_status, to_status: te.to_status },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: true, code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
