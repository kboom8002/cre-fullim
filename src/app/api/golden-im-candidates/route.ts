/**
 * POST /api/golden-im-candidates
 *
 * Creates a new Golden Dataset candidate from expert patch.
 * Emits golden_candidate_created event.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  createGoldenCandidate,
  buildGoldenCandidateEvent,
} from "@/domain/golden/golden-dataset-service";

const CreateSchema = z.object({
  project_id: z.string().min(1),
  section_id: z.string().optional(),
  expert_patch_id: z.string().optional(),
  section_type: z.string().optional(),
  ai_draft: z.string().min(1, "ai_draft is required"),
  expert_revision: z.string().optional(),
  edit_tags: z.array(z.string()).min(1, "edit_tags required"),
  issue_categories: z.array(z.string()).optional(),
  training_rights: z.enum(["not_allowed", "allowed_anonymized", "allowed_internal_eval_only", "allowed_golden_dataset"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = CreateSchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json(
        { error: true, code: "VALIDATION_ERROR", details: body.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();
    const userId = userAuth?.user?.id || null;
    
    const candidate = createGoldenCandidate({
      ...body.data,
      issue_categories: (body.data.issue_categories ?? []) as import("@/domain/golden/golden-dataset-service").IssueCategory[],
    });

    const { data: saved } = await supabase
      .from("golden_im_candidates")
      .insert({
        project_id: candidate.project_id,
        section_id: candidate.section_id ?? null,
        expert_patch_id: candidate.expert_patch_id ?? null,
        section_type: candidate.section_type ?? null,
        ai_draft: candidate.ai_draft,
        expert_revision: candidate.expert_revision ?? null,
        edit_tags: candidate.edit_tags,
        issue_categories: candidate.issue_categories,
        training_rights: candidate.training_rights,
        redaction_status: candidate.redaction_status,
        review_status: candidate.review_status,
        created_at: candidate.created_at,
      })
      .select("id")
      .single();

    const candidateId = saved?.id ?? candidate.id;

    const evt = buildGoldenCandidateEvent({
      event_type: "golden_candidate_created",
      candidate_id: candidateId,
      project_id: candidate.project_id,
      section_type: candidate.section_type,
      training_rights: candidate.training_rights,
    });

    await supabase.from("activity_events").insert({
      actor_id: userId,
      actor_role: "system",
      event_type: evt.event_type,
      entity_type: evt.entity_type,
      entity_id: evt.entity_id,
      source_app: evt.source_app,
      metadata: evt.metadata,
    });

    return NextResponse.json({ ok: true, data: { id: candidateId, review_status: candidate.review_status } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: true, code: "VALIDATION_ERROR", message: msg }, { status: 400 });
  }
}

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("golden_im_candidates")
    .select("id, project_id, section_type, edit_tags, training_rights, redaction_status, review_status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return NextResponse.json({ ok: true, data: data ?? [] });
}
