/**
 * Unit Tests: Export System (Slice 10)
 *
 * Tests for:
 *   - docs/27-export-preview-spec.md §4 Export Modes, §8 Preview, §10 Markdown, §14 Export Jobs
 *   - docs/13-status-transition.md §12 Export Guard
 *
 * Rules:
 *   - Draft export always includes DRAFT label (docs/27 §4)
 *   - Buyer-ready export blocked before project.status == buyer_ready (docs/27 §4)
 *   - Disclaimer is required in ALL export outputs (docs/27 §8, §9)
 *   - export_job recorded for every export attempt (docs/27 §14)
 *   - Markdown frontmatter includes project_id, export_type, status (docs/27 §10)
 *   - PPTX-ready produces slide outline (placeholder in P0) (docs/27 §11)
 *   - P0 disclosure blocks buyer-ready export (docs/26 §7)
 */
import { describe, it, expect } from "vitest";
import {
  checkExportEligibility,
  buildMarkdownExport,
  buildPptxOutline,
  buildExportJobRecord,
  DRAFT_LABEL,
  STANDARD_DISCLAIMER,
  type ExportEligibilityInput,
  type MarkdownExportInput,
  type ExportJobInput,
} from "@/domain/export/export-service";

// ─── Fixtures ──────────────────────────────────────────────────────────

const DRAFT_PROJECT: ExportEligibilityInput = {
  project_id: "proj_001",
  project_status: "ai_draft",
  has_p0_violation: false,
  gate_overall_status: "revise",
  sections_count: 18,
  buyer_ready_approved: false,
};

const BUYER_READY_PROJECT: ExportEligibilityInput = {
  project_id: "proj_001",
  project_status: "buyer_ready",
  has_p0_violation: false,
  gate_overall_status: "pass",
  sections_count: 18,
  buyer_ready_approved: true,
};

const P0_PROJECT: ExportEligibilityInput = {
  ...BUYER_READY_PROJECT,
  has_p0_violation: true,
  gate_overall_status: "blocked",
};

// ─── 1. Export Eligibility ─────────────────────────────────────────────

describe("checkExportEligibility", () => {
  it("draft project can export draft (always allowed)", () => {
    const result = checkExportEligibility(DRAFT_PROJECT);
    expect(result.can_export_draft).toBe(true);
  });

  it("draft project CANNOT export buyer-ready", () => {
    const result = checkExportEligibility(DRAFT_PROJECT);
    expect(result.can_export_buyer_ready).toBe(false);
  });

  it("buyer_ready project can export buyer-ready", () => {
    const result = checkExportEligibility(BUYER_READY_PROJECT);
    expect(result.can_export_buyer_ready).toBe(true);
  });

  it("P0 disclosure blocks buyer-ready export even if status is buyer_ready", () => {
    const result = checkExportEligibility(P0_PROJECT);
    expect(result.can_export_buyer_ready).toBe(false);
    expect(result.blocking_reasons).toContain("P0 공시 위반");
  });

  it("gate blocked prevents buyer-ready export", () => {
    const input = { ...BUYER_READY_PROJECT, gate_overall_status: "blocked" as const };
    const result = checkExportEligibility(input);
    expect(result.can_export_buyer_ready).toBe(false);
  });

  it("non-approved project cannot buyer-ready export even with pass gate", () => {
    const input: ExportEligibilityInput = { ...BUYER_READY_PROJECT, buyer_ready_approved: false, project_status: "gate_review" };
    const result = checkExportEligibility(input);
    expect(result.can_export_buyer_ready).toBe(false);
  });

  it("eligibility result includes blocking_reasons list", () => {
    const result = checkExportEligibility(DRAFT_PROJECT);
    expect(Array.isArray(result.blocking_reasons)).toBe(true);
  });
});

// ─── 2. Draft label ────────────────────────────────────────────────────

describe("DRAFT_LABEL", () => {
  it("DRAFT_LABEL is defined and non-empty", () => {
    expect(DRAFT_LABEL).toBeTruthy();
    expect(DRAFT_LABEL.length).toBeGreaterThan(0);
  });

  it("DRAFT_LABEL includes 'DRAFT' or '초안'", () => {
    expect(DRAFT_LABEL.toUpperCase().includes("DRAFT") || DRAFT_LABEL.includes("초안")).toBe(true);
  });
});

// ─── 3. Disclaimer ────────────────────────────────────────────────────

describe("STANDARD_DISCLAIMER", () => {
  it("is defined and non-empty", () => {
    expect(STANDARD_DISCLAIMER).toBeTruthy();
    expect(STANDARD_DISCLAIMER.length).toBeGreaterThan(20);
  });

  it("contains key disclaimer language", () => {
    expect(
      STANDARD_DISCLAIMER.includes("투자") || STANDARD_DISCLAIMER.includes("disclaimer")
    ).toBe(true);
  });
});

// ─── 4. Markdown export ────────────────────────────────────────────────

describe("buildMarkdownExport", () => {
  const MD_INPUT: MarkdownExportInput = {
    project_id: "proj_001",
    project_status: "ai_draft",
    export_mode: "draft",
    sections: [
      { section_order: 1, title: "커버 및 기밀유지", markdown: "# 커버\n기밀 문서입니다." },
      { section_order: 2, title: "Executive Summary", markdown: "# 요약\n이 자산은..." },
    ],
    boundary_note: "본 자료는 예비 검토 자료입니다.",
    generated_at: "2026-05-10T00:00:00Z",
  };

  it("includes frontmatter with project_id", () => {
    const md = buildMarkdownExport(MD_INPUT);
    expect(md).toContain("project_id: proj_001");
  });

  it("includes export_type in frontmatter", () => {
    const md = buildMarkdownExport(MD_INPUT);
    expect(md).toContain("export_type: markdown");
  });

  it("includes status in frontmatter", () => {
    const md = buildMarkdownExport(MD_INPUT);
    expect(md).toContain("status: ai_draft");
  });

  it("includes generated_at in frontmatter", () => {
    const md = buildMarkdownExport(MD_INPUT);
    expect(md).toContain("generated_at:");
  });

  it("draft export includes DRAFT label in output", () => {
    const md = buildMarkdownExport(MD_INPUT);
    expect(md.toUpperCase().includes("DRAFT") || md.includes("초안")).toBe(true);
  });

  it("includes disclaimer in output", () => {
    const md = buildMarkdownExport(MD_INPUT);
    expect(md).toContain(STANDARD_DISCLAIMER.slice(0, 20));
  });

  it("includes section content", () => {
    const md = buildMarkdownExport(MD_INPUT);
    expect(md).toContain("Executive Summary");
  });

  it("buyer-ready export does NOT include draft label", () => {
    const buyerMd = buildMarkdownExport({ ...MD_INPUT, export_mode: "buyer_ready", project_status: "buyer_ready" });
    expect(buyerMd).not.toContain("NOT FOR EXTERNAL SHARING");
  });
});

// ─── 5. PPTX-ready outline ─────────────────────────────────────────────

describe("buildPptxOutline", () => {
  it("produces slide outline array", () => {
    const outline = buildPptxOutline({
      project_id: "proj_001",
      sections: [
        { section_order: 1, title: "커버", section_type: "cover_confidentiality" },
        { section_order: 2, title: "요약", section_type: "executive_summary" },
      ],
    });
    expect(Array.isArray(outline.slides)).toBe(true);
    expect(outline.slides.length).toBeGreaterThan(0);
  });

  it("each slide has title and slide_number", () => {
    const outline = buildPptxOutline({
      project_id: "proj_001",
      sections: [{ section_order: 1, title: "커버", section_type: "cover_confidentiality" }],
    });
    expect(outline.slides[0]).toHaveProperty("title");
    expect(outline.slides[0]).toHaveProperty("slide_number");
  });

  it("outline includes project_id", () => {
    const outline = buildPptxOutline({ project_id: "proj_002", sections: [] });
    expect(outline.project_id).toBe("proj_002");
  });
});

// ─── 6. Export job record ──────────────────────────────────────────────

describe("buildExportJobRecord", () => {
  const JOB_INPUT: ExportJobInput = {
    project_id: "proj_001",
    export_type: "markdown",
    export_mode: "draft",
    requested_by: "user_001",
  };

  it("creates export job with queued status", () => {
    const job = buildExportJobRecord(JOB_INPUT);
    expect(job.status).toBe("queued");
  });

  it("job has project_id and export_type", () => {
    const job = buildExportJobRecord(JOB_INPUT);
    expect(job.project_id).toBe("proj_001");
    expect(job.export_type).toBe("markdown");
  });

  it("job has created_at timestamp", () => {
    const job = buildExportJobRecord(JOB_INPUT);
    expect(job.created_at).toBeTruthy();
  });

  it("draft job has export_mode draft", () => {
    const job = buildExportJobRecord(JOB_INPUT);
    expect(job.export_mode).toBe("draft");
  });

  it("buyer_ready job has export_mode buyer_ready", () => {
    const job = buildExportJobRecord({ ...JOB_INPUT, export_mode: "buyer_ready" });
    expect(job.export_mode).toBe("buyer_ready");
  });
});
