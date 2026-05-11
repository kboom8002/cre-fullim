/**
 * POST /api/im-projects/[id]/qna-pack/generate
 *
 * Generates Q&A pack from project sections.
 * Persists to dealroom_qna_packs + dealroom_qna_items.
 * Emits activity event.
 *
 * Rules:
 *   - Protected fields are redacted (docs/15 §2 rule 5)
 *   - AI output is always draft (docs/15 §2 rule 8)
 *   - event metadata must not contain raw content
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateQAPack, buildEvidenceIndex, buildDealRoomPayload } from "@/domain/dealroom/qna-pack-service";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const supabase = createServiceClient();

    // Load project
    const { data: project } = await supabase
      .from("im_projects")
      .select("id, status, created_by, building_ssot_full_id")
      .eq("id", projectId).single();

    if (!project) return NextResponse.json({ error: true, code: "NOT_FOUND" }, { status: 404 });

    // Load sections
    const { data: sections } = await supabase
      .from("im_sections")
      .select("id, section_type, title, markdown, status, missing_data")
      .eq("project_id", projectId)
      .order("section_order");

    // Load BSSoT
    const { data: bssot } = await supabase
      .from("building_ssot_full").select("*")
      .eq("id", project.building_ssot_full_id ?? "").single();

    // Load evidence
    const { data: evidence } = await supabase
      .from("project_evidence")
      .select("id, title, evidence_type, review_status, visibility, linked_sections, storage_path, contains_sensitive_data")
      .eq("project_id", projectId);

    // Generate Q&A pack
    const pack = generateQAPack({
      project_id: projectId,
      sections: (sections ?? []).map(s => ({
        id: s.id,
        section_type: s.section_type ?? "",
        title: s.title ?? s.section_type,
        markdown: s.markdown ?? "",
        missing_data: s.missing_data ?? [],
        status: s.status ?? "planned",
      })),
      building_ssot_full: (bssot ?? {}) as Record<string, unknown>,
    });

    // Build evidence index
    const evidenceIndex = buildEvidenceIndex({
      project_id: projectId,
      evidence: (evidence ?? []).map(e => ({
        id: e.id,
        title: e.title ?? "",
        evidence_type: e.evidence_type ?? "other",
        review_status: e.review_status ?? "uploaded",
        visibility: e.visibility ?? "internal_only",
        linked_sections: e.linked_sections ?? [],
        storage_path: e.storage_path ?? "",
        contains_sensitive_data: e.contains_sensitive_data ?? false,
      })),
    });

    // Persist QA pack
    const { data: savedPack } = await supabase
      .from("dealroom_qna_packs")
      .insert({
        project_id: projectId,
        status: "draft",
        questions_count: pack.questions.length,
        generated_at: pack.generated_at,
        created_at: new Date().toISOString(),
      })
      .select("id").single();

    const packId = savedPack?.id ?? "unknown";

    // Persist QA items
    if (pack.questions.length > 0) {
      await supabase.from("dealroom_qna_items").insert(
        pack.questions.map(q => ({
          pack_id: packId,
          project_id: projectId,
          section_id: q.section_id,
          section_type: q.section_type,
          question: q.question,
          answer_status: q.answer_status,
          draft_answer: q.draft_answer ?? null,
          required_evidence: q.required_evidence,
          visibility: q.visibility,
          expert_required: q.expert_required,
          created_at: new Date().toISOString(),
        })),
      );
    }

    // Emit event
    await supabase.from("activity_events").insert({
      actor_id: project.created_by,
      actor_role: "system",
      event_type: "qna_pack_generated",
      entity_type: "dealroom_qna_pack",
      entity_id: packId,
      source_app: "js-full-im-studio",
      metadata: {
        project_id: projectId,
        questions_count: pack.questions.length,
        evidence_count: evidenceIndex.items.length,
      },
    });

    // Build dealroom payload if project is buyer_ready
    let dealroomPayload = null;
    if (project.status === "buyer_ready") {
      try {
        dealroomPayload = buildDealRoomPayload({
          project_id: projectId,
          project_status: project.status,
          qna_pack_id: packId,
          questions: pack.questions,
          evidence_index: evidenceIndex.items.map(i => ({
            id: i.id,
            title: i.title,
            evidence_type: i.evidence_type,
            review_status: i.review_status,
            visibility: i.visibility,
            available_to_buyer: i.available_to_buyer,
          })),
        });
      } catch (_e) { /* not buyer_ready — skip */ }
    }

    return NextResponse.json({
      ok: true,
      data: {
        pack_id: packId,
        questions_count: pack.questions.length,
        evidence_index: evidenceIndex,
        dealroom_payload: dealroomPayload,
      },
    });
  } catch (err) {
    console.error("[POST /qna-pack/generate]", err);
    return NextResponse.json({ error: true, code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// GET — load existing Q&A pack
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const supabase = createServiceClient();

    const { data: pack } = await supabase
      .from("dealroom_qna_packs")
      .select("id, status, questions_count, generated_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1).single();

    if (!pack) return NextResponse.json({ ok: true, data: null });

    const { data: items } = await supabase
      .from("dealroom_qna_items")
      .select("id, section_type, question, answer_status, draft_answer, required_evidence, visibility, expert_required")
      .eq("pack_id", pack.id);

    return NextResponse.json({ ok: true, data: { pack, questions: items ?? [] } });
  } catch (err) {
    console.error("[GET /qna-pack]", err);
    return NextResponse.json({ ok: true, data: null });
  }
}
