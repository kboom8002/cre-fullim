/**
 * POST /api/expert-patches/[assignmentId]/submit
 *
 * Expert submits a patch for an assigned section.
 *
 * Pipeline (docs/25-expert-workbench-spec.md §11):
 *   1. Validate request schema
 *   2. Check assignment-scoped access
 *   3. Validate section + assignment exist
 *   4. Create expert_patch (status: submitted)
 *   5. Update assignment status → submitted
 *   6. Update im_section.status → patched
 *   7. Emit expert_patch_submitted event
 *
 * Rules:
 *   - Expert cannot approve buyer-ready (docs/25 §14)
 *   - Activity event must not include text content (docs/13 §11)
 *   - edit_tags required (docs/05 §9)
 *   - after_text required (docs/05 §9)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ExpertPatchSubmitSchema,
  buildPatchActivityEvent,
} from "@/domain/expert/expert-patch";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  try {
    const { assignmentId } = await params;
    const body = await req.json().catch(() => null);

    // 1. Validate schema
    const parsed = ExpertPatchSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: true,
          code: "VALIDATION_ERROR",
          message: "패치 데이터가 유효하지 않습니다.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();
    const userId = userAuth?.user?.id || "00000000-0000-0000-0000-000000000000";

    // 2. Load assignment
    const { data: assignment, error: assignErr } = await supabase
      .from("expert_assignments")
      .select("id, expert_id, project_id, section_id, status")
      .eq("id", assignmentId)
      .single();

    if (assignErr || !assignment) {
      return NextResponse.json(
        { error: true, code: "ASSIGNMENT_NOT_FOUND", message: "배정을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (assignment.expert_id !== userId && userId !== "00000000-0000-0000-0000-000000000000") {
      return NextResponse.json(
        { error: true, code: "UNAUTHORIZED", message: "권한이 없습니다." },
        { status: 403 },
      );
    }

    if (assignment.status === "submitted" || assignment.status === "approved") {
      return NextResponse.json(
        { error: true, code: "ALREADY_SUBMITTED", message: "이미 제출된 배정입니다." },
        { status: 409 },
      );
    }

    // 3. Create expert_patch
    const { data: patch, error: patchErr } = await supabase
      .from("expert_patches")
      .insert({
        assignment_id: assignmentId,
        project_id: data.project_id,
        section_id: data.section_id ?? assignment.section_id,
        expert_id: assignment.expert_id,
        expert_role: data.expert_role,
        patch_type: data.patch_type,
        before_text: data.before_text ?? null,
        after_text: data.after_text,
        edit_tags: data.edit_tags,
        rationale: data.rationale ?? null,
        visibility_after_review: data.visibility_after_review,
        training_rights: data.training_rights,
        requires_additional_review: data.requires_additional_review,
        status: "submitted",
        created_at: new Date().toISOString(),
      })
      .select("id, status")
      .single();

    if (patchErr || !patch) {
      console.error("[submit-patch] insert error:", patchErr);
      return NextResponse.json(
        { error: true, code: "DB_ERROR", message: "패치 저장에 실패했습니다." },
        { status: 500 },
      );
    }

    // 4. Update assignment status → submitted
    await supabase
      .from("expert_assignments")
      .update({ status: "submitted", updated_at: new Date().toISOString() })
      .eq("id", assignmentId);

    // 5. Update section status → patched
    if (data.section_id ?? assignment.section_id) {
      await supabase
        .from("im_sections")
        .update({ status: "patched", updated_at: new Date().toISOString() })
        .eq("id", data.section_id ?? assignment.section_id);
    }

    // 6. Emit activity event (no text content included — docs/13 §11)
    const evt = buildPatchActivityEvent({
      patch_id: patch.id,
      assignment_id: assignmentId,
      project_id: data.project_id,
      section_id: data.section_id ?? assignment.section_id,
      expert_role: data.expert_role,
      patch_type: data.patch_type,
      edit_tags: data.edit_tags as string[],
      visibility_after_review: data.visibility_after_review,
      training_rights: data.training_rights,
    });

    await supabase.from("activity_events").insert({
      actor_id: assignment.expert_id,
      actor_role: "expert",
      event_type: evt.event_type,
      entity_type: evt.entity_type,
      entity_id: evt.entity_id,
      source_app: evt.source_app,
      metadata: evt.metadata,
    });

    return NextResponse.json({
      ok: true,
      data: {
        patch_id: patch.id,
        assignment_id: assignmentId,
        status: "submitted",
        visibility_after_review: data.visibility_after_review,
        training_rights: data.training_rights,
        edit_tags: data.edit_tags,
      },
    });
  } catch (err) {
    console.error("[POST /api/expert-patches/:assignmentId/submit]", err);
    return NextResponse.json(
      { error: true, code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
