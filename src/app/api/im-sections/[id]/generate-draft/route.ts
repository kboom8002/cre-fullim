/**
 * POST /api/im-sections/[id]/generate-draft
 *
 * Generates a safe AI draft for one IM section.
 *
 * Pipeline (docs/12-api-contracts.md §7.1):
 *   1. Load section + project + bssot_full
 *   2. Generate draft via AI provider (mock or OpenAI)
 *   3. Run RiskBoundary check
 *   4. Run DisclosureGuard check
 *   5. Validate output schema (Zod)
 *   6. Update im_sections
 *   7. Create im_section_versions entry
 *   8. Log ai_runs
 *   9. Emit im_section_draft_generated event
 *
 * Rules:
 *   - buyer_ready is NEVER set by this route (docs/15 §2 rule 9)
 *   - P0 RiskBoundary or Disclosure block → 422 with details
 *   - ai_run always recorded, even on failure
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSectionDraft } from "@/domain/ai/ai-provider";
import {
  runRiskBoundaryCheck,
  runDisclosureGuard,
  buildDraftOutput,
  createAiRunRecord,
} from "@/domain/ai/draft-guardrails";
import { FullIMWriterOutputSchema } from "@/domain/ai/writer-schema";
import { IM_SECTION_DEFINITIONS } from "@/domain/sections/section-planner";
import type { IMSectionType } from "@/domain/readiness/readiness-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startMs = Date.now();
  const { id: sectionId } = await params;
  const supabase = await createClient();
  const { data: userAuth } = await supabase.auth.getUser();
  const userId = userAuth?.user?.id || null;

  let projectId = "";
  let runStatus: "started" | "completed" | "failed" = "started";
  let runError: string | undefined;

  try {
    // 1. Load section
    const { data: section, error: secErr } = await supabase
      .from("im_sections")
      .select("*, project_id, section_type, title, status")
      .eq("id", sectionId)
      .single();

    if (secErr || !section) {
      return NextResponse.json(
        { error: true, code: "SECTION_NOT_FOUND", message: "섹션을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    projectId = section.project_id;

    // 2. Load project + bssot_full
    const { data: project } = await supabase
      .from("im_projects")
      .select("id, building_ssot_full_id, target_output, created_by")
      .eq("id", projectId)
      .single();

    const { data: bssotFull } = await supabase
      .from("building_ssot_full")
      .select("*")
      .eq("id", project?.building_ssot_full_id ?? "")
      .single();

    const bssot = (bssotFull ?? {}) as Record<string, unknown>;
    const sectionDef = IM_SECTION_DEFINITIONS[section.section_type as IMSectionType];
    const sourceRefs =
      ((bssot.evidence_source as Record<string, unknown>)?.source_refs as Record<string, unknown>[]) ?? [];
    const evidenceRefs =
      ((bssot.evidence_source as Record<string, unknown>)?.evidence_refs as Record<string, unknown>[]) ?? [];

    // 3. Generate AI draft
    const { output: rawOutput, model, usedMock } = await generateSectionDraft({
      project_id: projectId,
      section_id: sectionId,
      section_type: section.section_type,
      section_title: section.title ?? sectionDef?.title ?? section.section_type,
      building_ssot_full: bssot,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      target_output: project?.target_output ?? "buyer_ready_full_im",
      template_structure: sectionDef?.structure,
    });

    // 4. RiskBoundary check
    const riskResult = runRiskBoundaryCheck(rawOutput.markdown, section.section_type);

    if (riskResult.status === "blocked") {
      runStatus = "failed";
      runError = `RiskBoundary blocked: ${riskResult.issues.map((i) => i.issue_type).join(", ")}`;

      // Still log the ai_run
      await logAiRun(supabase, {
        projectId,
        sectionId,
        userId,
        model,
        status: "failed",
        latency_ms: Date.now() - startMs,
        error: runError,
        usedMock,
      });

      return NextResponse.json(
        {
          error: true,
          code: "RISK_BOUNDARY_BLOCKED",
          message: "초안에 허용되지 않는 표현이 포함되어 있습니다.",
          issues: riskResult.issues,
        },
        { status: 422 },
      );
    }

    // Use safe_text if risk was revise
    const safeMarkdown = riskResult.status === "revise"
      ? (riskResult.safe_text ?? rawOutput.markdown)
      : rawOutput.markdown;

    // 5. DisclosureGuard check
    const protectedFields =
      ((bssot.disclosure_gate as Record<string, unknown>)?.protected_fields as string[]) ?? [];

    const disclosureResult = runDisclosureGuard({
      text: safeMarkdown,
      target_visibility: "internal_only",
      gate_level: "G3",
      protected_fields_available: protectedFields,
      output_type: "full_im",
    });

    const finalMarkdown = disclosureResult.safe_text;

    // 6. Build structured output
    const draftOutput = buildDraftOutput({
      section_type: section.section_type,
      title: section.title ?? sectionDef?.title ?? section.section_type,
      markdown: finalMarkdown,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_data: rawOutput.missing_data,
      requires_expert_patch: rawOutput.requires_expert_patch,
      confidence: rawOutput.confidence as "confirmed" | "inferred" | "needs_evidence" | "expert_required" | "unknown",
      risk_level: rawOutput.risk_level as "low" | "medium" | "high" | "blocked",
    });

    // 7. Validate schema
    const validated = FullIMWriterOutputSchema.safeParse(draftOutput);
    if (!validated.success) {
      runStatus = "failed";
      runError = "Schema validation failed";
      await logAiRun(supabase, {
        projectId, sectionId, userId, model, status: "failed",
        latency_ms: Date.now() - startMs, error: runError, usedMock,
      });
      return NextResponse.json(
        { error: true, code: "AI_SCHEMA_VALIDATION_FAILED", message: "AI 출력 스키마 검증 실패" },
        { status: 500 },
      );
    }

    const latencyMs = Date.now() - startMs;

    // 8. Update im_sections
    await supabase
      .from("im_sections")
      .update({
        status: "ai_draft",
        confidence: draftOutput.confidence,
        risk_level: draftOutput.risk_level,
        requires_expert_patch: draftOutput.requires_expert_patch,
        missing_data: draftOutput.missing_data,
        markdown: finalMarkdown,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sectionId);

    // 9. Create im_section_versions
    await supabase.from("im_section_versions").insert({
      section_id: sectionId,
      project_id: projectId,
      version_number: 1, // Need to handle auto-increment or similar, assuming handled or defaulting
      version_source: "ai",
      created_by: userId,
      version_type: "ai_draft",
      markdown: finalMarkdown,
      content_json: draftOutput.content_json,
      confidence: draftOutput.confidence,
      risk_level: draftOutput.risk_level,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      prompt_version: "prompt_full_im_section_writer_v1",
      model,
      metadata: {
        risk_boundary_status: riskResult.status,
        disclosure_status: disclosureResult.status,
        risk_issues_count: riskResult.issues.length,
        redacted_fields: disclosureResult.redacted_fields,
        used_mock: usedMock,
      },
    });

    // 10. Log ai_run
    runStatus = "completed";
    const aiRunRec = createAiRunRecord({
      project_id: projectId,
      section_id: sectionId,
      run_type: "section_draft",
      prompt_version: "prompt_full_im_section_writer_v1",
      model,
      status: "completed",
      latency_ms: latencyMs,
      input_summary: { section_type: section.section_type, source_refs_count: sourceRefs.length },
      output_summary: {
        confidence: draftOutput.confidence,
        risk_level: draftOutput.risk_level,
        requires_expert_patch: draftOutput.requires_expert_patch,
        risk_boundary_status: riskResult.status,
        disclosure_status: disclosureResult.status,
        used_mock: usedMock,
      },
    });

    await supabase.from("ai_runs").insert({
      project_id: aiRunRec.project_id,
      section_id: aiRunRec.section_id,
      user_id: userId,
      run_type: aiRunRec.run_type,
      prompt_version: aiRunRec.prompt_version,
      model: aiRunRec.model,
      status: aiRunRec.status,
      latency_ms: aiRunRec.latency_ms,
      input_ref: aiRunRec.input_ref,
      output_ref: aiRunRec.output_ref,
    });

    // 11. Emit event
    await supabase.from("activity_events").insert({
      actor_id: userId ?? project?.created_by ?? null,
      actor_role: "system",
      event_type: "im_section_draft_generated",
      entity_type: "im_section",
      entity_id: sectionId,
      source_app: "js-full-im-studio",
      metadata: {
        section_type: section.section_type,
        confidence: draftOutput.confidence,
        risk_level: draftOutput.risk_level,
        requires_expert_patch: draftOutput.requires_expert_patch,
        risk_boundary_status: riskResult.status,
        latency_ms: latencyMs,
        used_mock: usedMock,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        section_id: sectionId,
        status: "ai_draft",
        confidence: draftOutput.confidence,
        risk_level: draftOutput.risk_level,
        requires_expert_patch: draftOutput.requires_expert_patch,
        markdown: finalMarkdown,
        missing_data: draftOutput.missing_data,
        risk_boundary_status: riskResult.status,
        disclosure_status: disclosureResult.status,
        redacted_fields: disclosureResult.redacted_fields,
        latency_ms: latencyMs,
        used_mock: usedMock,
      },
    });
  } catch (err) {
    console.error("[POST /api/im-sections/:id/generate-draft]", err);
    runStatus = "failed";
    runError = err instanceof Error ? err.message : "Unknown error";

    if (projectId) {
      await logAiRun(supabase, {
        projectId,
        sectionId,
        userId,
        model: "unknown",
        status: "failed",
        latency_ms: Date.now() - startMs,
        error: runError,
        usedMock: false,
      }).catch(() => {});
    }

    return NextResponse.json(
      { error: true, code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

// ─── Helper ───────────────────────────────────────────────────────────

async function logAiRun(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  opts: {
    projectId: string;
    sectionId: string;
    userId: string | null;
    model: string;
    status: "started" | "completed" | "failed";
    latency_ms: number;
    error?: string;
    usedMock: boolean;
  },
) {
  await supabase.from("ai_runs").insert({
    project_id: opts.projectId,
    section_id: opts.sectionId,
    user_id: opts.userId,
    run_type: "section_draft",
    prompt_version: "prompt_full_im_section_writer_v1",
    model: opts.model,
    status: opts.status,
    latency_ms: opts.latency_ms,
    input_ref: { section_id: opts.sectionId },
    output_ref: { status: opts.status, error: opts.error, used_mock: opts.usedMock },
  });
}
