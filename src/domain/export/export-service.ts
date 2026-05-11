/**
 * Export Service (Slice 10)
 *
 * Implements:
 *   - docs/27-export-preview-spec.md §4 Export Modes, §8-§11, §14 Job Lifecycle
 *   - docs/13-status-transition.md §12 Export Guard
 *
 * Rules:
 *   - Draft export: always allowed, includes DRAFT_LABEL (docs/27 §4)
 *   - Buyer-ready export: requires project_status == "buyer_ready",
 *     no P0 violation, gate pass, reviewer approval (docs/27 §4)
 *   - Disclaimer REQUIRED in all outputs (docs/27 §8, §9)
 *   - export_job always recorded (docs/27 §14)
 *   - Markdown frontmatter: project_id, export_type, status, generated_at (docs/27 §10)
 *   - PPTX-ready: slide outline placeholder (docs/27 §11)
 */

// ─── Constants ────────────────────────────────────────────────────────

/** docs/27 §4 — visible on every draft export */
export const DRAFT_LABEL =
  "[DRAFT — AI 초안] 본 문서는 외부 공유용이 아닙니다. (NOT FOR REVIEW-APPROVED USE)";

/** docs/27 §8, §9 — must appear in all export outputs */
export const STANDARD_DISCLAIMER =
  "본 자료는 제공자료와 공개정보를 바탕으로 한 예비 검토 자료이며, " +
  "투자 권유, 감정평가, 법률·세무·대출 가능성 판단을 목적으로 하지 않습니다. " +
  "실제 거래 여부는 별도 실사와 전문가 검토를 통해 판단해야 합니다. " +
  "본 자료의 무단 복제, 배포 및 외부 공유를 금합니다.";

// ─── Types ────────────────────────────────────────────────────────────

export type ExportMode = "draft" | "buyer_ready" | "internal";
export type ExportType = "markdown" | "pdf" | "pptx" | "web" | "dealroom_payload" | "evidence_index";
export type ExportJobStatus = "queued" | "processing" | "completed" | "failed" | "blocked";

export interface ExportEligibilityInput {
  project_id: string;
  project_status: string;
  has_p0_violation: boolean;
  gate_overall_status: string;
  sections_count: number;
  buyer_ready_approved: boolean;
}

export interface ExportEligibilityResult {
  project_id: string;
  can_export_draft: boolean;
  can_export_buyer_ready: boolean;
  can_export_internal: boolean;
  blocking_reasons: string[];
  export_mode: ExportMode;
}

export interface MarkdownExportInput {
  project_id: string;
  project_status: string;
  export_mode: ExportMode;
  sections: { section_order: number; title: string; markdown: string }[];
  boundary_note: string;
  generated_at: string;
}

export interface PptxOutlineInput {
  project_id: string;
  sections: { section_order: number; title: string; section_type: string }[];
}

export interface PptxSlide {
  slide_number: number;
  title: string;
  section_type: string;
  speaker_notes: string;
  visual_assets: string[];
  layout: string;
}

export interface PptxOutline {
  project_id: string;
  generated_at: string;
  slides: PptxSlide[];
  notes: string;
}

export interface ExportJobInput {
  project_id: string;
  export_type: ExportType;
  export_mode: ExportMode;
  requested_by: string;
}

export interface ExportJobRecord {
  project_id: string;
  export_type: ExportType;
  export_mode: ExportMode;
  status: ExportJobStatus;
  requested_by: string;
  created_at: string;
  output_url?: string;
  error?: string;
}

// ─── checkExportEligibility ───────────────────────────────────────────

/**
 * Determines what export modes are available.
 * Draft export is always allowed.
 * Buyer-ready export requires: project == buyer_ready, no P0, gate pass, approved.
 */
export function checkExportEligibility(input: ExportEligibilityInput): ExportEligibilityResult {
  const blocking_reasons: string[] = [];

  // Buyer-ready checks
  if (input.has_p0_violation) {
    blocking_reasons.push("P0 공시 위반");
  }

  if (input.project_status !== "buyer_ready") {
    blocking_reasons.push(`프로젝트 상태가 buyer_ready가 아닙니다 (현재: ${input.project_status})`);
  }

  if (input.gate_overall_status === "blocked") {
    blocking_reasons.push("Gate 검토 차단 상태");
  }

  if (!input.buyer_ready_approved) {
    blocking_reasons.push("Reviewer/Admin의 Buyer-ready 승인이 필요합니다");
  }

  const can_export_buyer_ready = blocking_reasons.length === 0;
  const can_export_draft = true; // always allowed (docs/27 §4)
  const can_export_internal = true;

  const export_mode: ExportMode = can_export_buyer_ready ? "buyer_ready" : "draft";

  return {
    project_id: input.project_id,
    can_export_draft,
    can_export_buyer_ready,
    can_export_internal,
    blocking_reasons,
    export_mode,
  };
}

// ─── buildMarkdownExport ──────────────────────────────────────────────

/**
 * Builds a Markdown string export.
 * All exports include disclaimer.
 * Draft exports include DRAFT_LABEL.
 * docs/27 §10 frontmatter format.
 */
export function buildMarkdownExport(input: MarkdownExportInput): string {
  const isDraft = input.export_mode === "draft";
  const sections = [...input.sections].sort((a, b) => a.section_order - b.section_order);

  // Frontmatter (docs/27 §10)
  const frontmatter = [
    "---",
    `project_id: ${input.project_id}`,
    `export_type: markdown`,
    `status: ${input.project_status}`,
    `export_mode: ${input.export_mode}`,
    `generated_at: ${input.generated_at}`,
    "---",
  ].join("\n");

  // Draft header
  const draftHeader = isDraft
    ? `\n> ⚠️ **${DRAFT_LABEL}**\n`
    : "";

  // Disclaimer block (required in all outputs)
  const disclaimerBlock = `\n---\n\n## ⚖️ 면책 조항\n\n${STANDARD_DISCLAIMER}\n\n---\n`;

  // Boundary note
  const boundaryBlock = input.boundary_note
    ? `\n> 📋 ${input.boundary_note}\n`
    : "";

  // Section content
  const sectionContent = sections
    .map(s => `\n## ${s.title}\n\n${s.markdown || "_(내용 없음)_"}\n`)
    .join("\n");

  return [frontmatter, draftHeader, disclaimerBlock, boundaryBlock, sectionContent].join("\n");
}

// ─── buildPptxOutline ─────────────────────────────────────────────────

const PPTX_LAYOUT_MAP: Partial<Record<string, string>> = {
  cover_confidentiality:    "title_slide",
  executive_summary:        "content_slide",
  property_fact_sheet:      "two_column",
  income_noi_yield_analysis:"table_slide",
  debt_sensitivity_cash_flow:"chart_slide",
  valuation_logic_comparables:"table_slide",
  location_access:          "image_slide",
  building_condition_physical_review: "content_slide",
  risk_factors_dd_checklist:"checklist_slide",
  disclaimer_contact:       "footer_slide",
};

const SPEAKER_NOTE_TEMPLATE =
  "발표자: 이 슬라이드는 {title} 내용을 다룹니다. 세부 내용은 Full IM 문서를 참조하세요.";

/**
 * Builds PPTX-ready slide outline (placeholder in P0).
 * docs/27 §11
 */
export function buildPptxOutline(input: PptxOutlineInput): PptxOutline {
  const slides: PptxSlide[] = input.sections.map(s => ({
    slide_number: s.section_order,
    title: s.title,
    section_type: s.section_type,
    speaker_notes: SPEAKER_NOTE_TEMPLATE.replace("{title}", s.title),
    visual_assets: [], // populated when actual evidence attached
    layout: PPTX_LAYOUT_MAP[s.section_type] ?? "content_slide",
  }));

  return {
    project_id: input.project_id,
    generated_at: new Date().toISOString(),
    slides,
    notes: "PPTX-ready outline (P0 placeholder). 실제 PPTX 파일은 추후 생성 도구 연동 필요.",
  };
}

// ─── buildExportJobRecord ─────────────────────────────────────────────

/**
 * Creates an export_job record to be inserted into DB.
 * All export attempts must create a job (docs/27 §14).
 */
export function buildExportJobRecord(input: ExportJobInput): ExportJobRecord {
  return {
    project_id: input.project_id,
    export_type: input.export_type,
    export_mode: input.export_mode,
    status: "queued",
    requested_by: input.requested_by,
    created_at: new Date().toISOString(),
  };
}
