/**
 * POST /api/golden-im-candidates/[id]/redact
 * POST /api/golden-im-candidates/[id]/approve
 * POST /api/golden-im-candidates/[id]/reject
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  redactCandidate,
  approveCandidate,
  rejectCandidate,
  buildGoldenCandidateEvent,
  type GoldenCandidateRecord,
} from "@/domain/golden/golden-dataset-service";

async function loadCandidate(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data } = await supabase
    .from("golden_im_candidates")
    .select("*")
    .eq("id", id)
    .single();
  return data as GoldenCandidateRecord | null;
}

async function emitEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | null,
  input: Parameters<typeof buildGoldenCandidateEvent>[0],
) {
  const evt = buildGoldenCandidateEvent(input);
  await supabase.from("activity_events").insert({
    actor_id: userId,
    actor_role: "system",
    event_type: evt.event_type,
    entity_type: evt.entity_type,
    entity_id: evt.entity_id,
    source_app: evt.source_app,
    metadata: evt.metadata,
  });
}

// ─── Redact ────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  const { id, action } = await params;
  const supabase = await createClient();
  const { data: userAuth } = await supabase.auth.getUser();
  const userId = userAuth?.user?.id || null;
  
  const candidate = await loadCandidate(supabase, id);
  if (!candidate) return NextResponse.json({ error: true, code: "NOT_FOUND" }, { status: 404 });

  try {
    if (action === "redact") {
      const redacted = redactCandidate(candidate);
      await supabase.from("golden_im_candidates").update({
        ai_draft: redacted.ai_draft_redacted,
        expert_revision: redacted.expert_revision_redacted ?? null,
        edit_tags: redacted.edit_tags,
        redaction_status: "redacted",
      }).eq("id", id);

      await emitEvent(supabase, userId, {
        event_type: "golden_candidate_redacted",
        candidate_id: id,
        project_id: candidate.project_id,
        section_type: candidate.section_type,
        training_rights: candidate.training_rights,
      });

      return NextResponse.json({ ok: true, data: { redaction_status: "redacted" } });
    }

    if (action === "approve") {
      if (!userId) return NextResponse.json({ error: true, code: "UNAUTHORIZED" }, { status: 401 });

      const approved = approveCandidate(candidate, userId);
      await supabase.from("golden_im_candidates").update({
        review_status: "approved",
        reviewed_at: approved.reviewed_at,
      }).eq("id", id);

      await emitEvent(supabase, userId, {
        event_type: "golden_candidate_approved",
        candidate_id: id,
        project_id: candidate.project_id,
        section_type: candidate.section_type,
        training_rights: candidate.training_rights,
        reviewer_id: userId,
      });

      return NextResponse.json({ ok: true, data: { review_status: "approved" } });
    }

    if (action === "reject") {
      if (!userId) return NextResponse.json({ error: true, code: "UNAUTHORIZED" }, { status: 401 });
      const body = z.object({ reason: z.string().min(1) })
        .safeParse(await req.json().catch(() => ({})));
      if (!body.success) return NextResponse.json({ error: true, code: "REASON_REQUIRED" }, { status: 400 });

      const rejected = rejectCandidate(candidate, userId, body.data.reason);
      await supabase.from("golden_im_candidates").update({
        review_status: "rejected",
        reviewed_at: rejected.reviewed_at,
      }).eq("id", id);

      await emitEvent(supabase, userId, {
        event_type: "golden_candidate_rejected",
        candidate_id: id,
        project_id: candidate.project_id,
        section_type: candidate.section_type,
        training_rights: candidate.training_rights,
        reviewer_id: userId,
        reject_reason: body.data.reason,
      });

      return NextResponse.json({ ok: true, data: { review_status: "rejected" } });
    }

    return NextResponse.json({ error: true, code: "UNKNOWN_ACTION" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: true, code: "GUARD_FAILED", message: msg }, { status: 422 });
  }
}
