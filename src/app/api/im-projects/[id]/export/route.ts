/**
 * POST /api/im-projects/[id]/export
 *
 * Handles export requests: markdown, pptx-outline, pdf-placeholder.
 *
 * Pipeline (docs/27 §14, §15):
 *   1. Check export eligibility
 *   2. Create export_job (queued)
 *   3. Generate output based on export_type
 *   4. Update export_job (completed/failed)
 *   5. Emit im_export_requested / im_exported / im_export_blocked event
 *
 * Rules:
 *   - buyer_ready export requires project_status == buyer_ready + no P0 (docs/27 §4)
 *   - draft export always allowed but MUST include DRAFT_LABEL (docs/27 §4)
 *   - disclaimer REQUIRED in all outputs (docs/27 §8)
 *   - export_job always persisted (docs/27 §14)
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  checkExportEligibility,
  buildMarkdownExport,
  buildPptxOutline,
  buildExportJobRecord,
  STANDARD_DISCLAIMER,
  type ExportMode,
  type ExportType,
} from "@/domain/export/export-service";

const RequestSchema = z.object({
  export_type: z.enum(["markdown", "pdf", "pptx", "web", "dealroom_payload", "evidence_index"]),
  export_mode: z.enum(["draft", "buyer_ready", "internal"]).default("draft"),
  section_ids: z.array(z.string()).optional(), // subset of sections, all if omitted
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startMs = Date.now();
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: userAuth } = await supabase.auth.getUser();
  const userId = userAuth?.user?.id || null;

  const body = RequestSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json(
      { error: true, code: "VALIDATION_ERROR", message: "요청이 유효하지 않습니다.", details: body.error.flatten() },
      { status: 400 },
    );
  }

  const { export_type, export_mode, section_ids } = body.data;

  // Load project
  const { data: project } = await supabase
    .from("im_projects")
    .select("id, status, created_by, readiness_score, building_ssot_full_id")
    .eq("id", projectId)
    .single();

  if (!project) {
    return NextResponse.json({ error: true, code: "NOT_FOUND" }, { status: 404 });
  }

  // Load gate review
  const { data: gateReview } = await supabase
    .from("gate_reviews").select("overall_status, has_p0_violation, buyer_ready_eligible")
    .eq("project_id", projectId).single();

  // Load sections
  let sectionsQuery = supabase
    .from("im_sections")
    .select("id, section_order, section_type, title, markdown, status, risk_level, missing_data")
    .eq("project_id", projectId)
    .order("section_order");

  if (section_ids?.length) {
    sectionsQuery = sectionsQuery.in("id", section_ids);
  }
  const { data: sections } = await sectionsQuery;

  // 1. Check eligibility
  const eligibility = checkExportEligibility({
    project_id: projectId,
    project_status: project.status,
    has_p0_violation: gateReview?.has_p0_violation ?? false,
    gate_overall_status: gateReview?.overall_status ?? "not_run",
    sections_count: sections?.length ?? 0,
    buyer_ready_approved: project.status === "buyer_ready",
  });

  // Block buyer_ready export if not eligible
  if (export_mode === "buyer_ready" && !eligibility.can_export_buyer_ready) {
    await supabase.from("activity_events").insert({
      actor_id: userId ?? project.created_by,
      actor_role: "system",
      event_type: "im_export_blocked",
      entity_type: "im_project",
      entity_id: projectId,
      source_app: "js-full-im-studio",
      metadata: { export_type, export_mode, blocking_reasons: eligibility.blocking_reasons },
    });

    return NextResponse.json({
      error: true,
      code: "EXPORT_BLOCKED",
      message: "Buyer-ready 내보내기가 차단되었습니다.",
      blocking_reasons: eligibility.blocking_reasons,
    }, { status: 422 });
  }

  // 2. Create export_job record
  const jobRecord = buildExportJobRecord({
    project_id: projectId,
    export_type: export_type as ExportType,
    export_mode: export_mode as ExportMode,
    requested_by: project.created_by ?? "system",
  });

  const { data: job } = await supabase
    .from("export_jobs")
    .insert({
      project_id: jobRecord.project_id,
      export_type: jobRecord.export_type,
      export_mode: jobRecord.export_mode,
      status: "processing",
      requested_by: userId ?? project.created_by,
      created_at: jobRecord.created_at,
    })
    .select("id")
    .single();

  const jobId = job?.id ?? "unknown";

  // Emit export_requested event
  await supabase.from("activity_events").insert({
    actor_id: userId ?? project.created_by,
    actor_role: "system",
    event_type: "im_export_requested",
    entity_type: "export_job",
    entity_id: jobId,
    source_app: "js-full-im-studio",
    metadata: { export_type, export_mode, project_id: projectId },
  });

  try {
    // 3. Generate output
    let output: Record<string, unknown> = {};

    const sectionList = (sections ?? []).map(s => ({
      section_order: s.section_order ?? 0,
      title: s.title ?? s.section_type,
      markdown: s.markdown ?? "",
      section_type: s.section_type,
    }));

    if (export_type === "markdown") {
      const md = buildMarkdownExport({
        project_id: projectId,
        project_status: project.status,
        export_mode: export_mode as ExportMode,
        sections: sectionList,
        boundary_note: STANDARD_DISCLAIMER,
        generated_at: new Date().toISOString(),
      });
      output = { markdown: md, filename: `full-im-${projectId}-${export_mode}.md` };

    } else if (export_type === "pptx") {
      const outline = buildPptxOutline({ project_id: projectId, sections: sectionList });
      output = { pptx_outline: outline, filename: `full-im-${projectId}-outline.json` };

    } else if (export_type === "pdf") {
      // PDF placeholder (P0) — produce markdown that can be converted
      const md = buildMarkdownExport({
        project_id: projectId,
        project_status: project.status,
        export_mode: export_mode as ExportMode,
        sections: sectionList,
        boundary_note: STANDARD_DISCLAIMER,
        generated_at: new Date().toISOString(),
      });
      output = {
        format: "pdf_placeholder",
        markdown_source: md,
        message: "PDF 변환은 별도 렌더링 서비스 연동이 필요합니다.",
        filename: `full-im-${projectId}-${export_mode}.pdf`,
      };

    } else if (export_type === "web") {
      output = {
        format: "web_preview",
        sections: sectionList.map(s => ({ title: s.title, markdown: s.markdown })),
        disclaimer: STANDARD_DISCLAIMER,
        is_draft: export_mode === "draft",
      };

    } else if (export_type === "dealroom_payload") {
      if (export_mode !== "buyer_ready") {
        output = { error: "Deal Room payload는 buyer_ready 상태에서만 생성 가능합니다." };
      } else {
        output = {
          format: "dealroom_payload",
          project_id: projectId,
          sections: sectionList.map(s => ({ title: s.title })),
          disclaimer: STANDARD_DISCLAIMER,
          generated_at: new Date().toISOString(),
        };
      }
    }

    const latencyMs = Date.now() - startMs;

    // 4. Update job to completed
    await supabase
      .from("export_jobs")
      .update({
        status: "completed",
        file_url: null, // Would be storage URL
        metadata: { disclaimer_applied: true },
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    // 5. Emit im_exported
    await supabase.from("activity_events").insert({
      actor_id: userId ?? project.created_by,
      actor_role: "system",
      event_type: "im_exported",
      entity_type: "export_job",
      entity_id: jobId,
      source_app: "js-full-im-studio",
      metadata: { export_type, export_mode, latency_ms: latencyMs },
    });

    return NextResponse.json({
      ok: true,
      data: { job_id: jobId, export_type, export_mode, output, latency_ms: latencyMs },
    });

  } catch (err) {
    console.error("[POST /export]", err);
    if (jobId !== "unknown") {
      await supabase.from("export_jobs").update({ status: "failed", error_message: String(err) }).eq("id", jobId);
    }

    await supabase.from("activity_events").insert({
      actor_id: userId ?? project?.created_by ?? null,
      actor_role: "system",
      event_type: "im_export_blocked",
      entity_type: "export_job",
      entity_id: jobId,
      source_app: "js-full-im-studio",
      metadata: { export_type, export_mode, error: String(err) },
    });

    return NextResponse.json(
      { error: true, code: "EXPORT_FAILED", message: "내보내기 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

// GET — check eligibility only
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("im_projects").select("id, status").eq("id", projectId).single();

  const { data: gateReview } = await supabase
    .from("gate_reviews").select("overall_status, has_p0_violation, buyer_ready_eligible")
    .eq("project_id", projectId).single();

  const { count } = await supabase
    .from("im_sections").select("id", { count: "exact", head: true }).eq("project_id", projectId);

  const eligibility = checkExportEligibility({
    project_id: projectId,
    project_status: project?.status ?? "unknown",
    has_p0_violation: gateReview?.has_p0_violation ?? false,
    gate_overall_status: gateReview?.overall_status ?? "not_run",
    sections_count: count ?? 0,
    buyer_ready_approved: project?.status === "buyer_ready",
  });

  return NextResponse.json({ ok: true, data: eligibility });
}
