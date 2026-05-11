/**
 * Unit Tests: AI Section Draft (Slice 6)
 *
 * Tests for:
 *   - docs/15-ai-agent-contracts.md §7 FullIMWriterAgent
 *   - docs/18-risk-boundary-policy.md §4/§5 Forbidden patterns + safe rewrites
 *   - docs/19-disclosure-guard-policy.md §9 P0 failures
 *   - docs/17-financial-analysis-guardrails.md §5/§7 NOI + Debt guardrails
 *
 * Rules:
 *   - draft schema is valid (docs/15 FullIMWriterOutputSchema)
 *   - unsafe investment claims → blocked or revised
 *   - exact_address in blind output → P0 block
 *   - debt certainty → rewrites required
 *   - ai_run recorded (prompt_version, status, latency)
 *   - section version created on draft generation
 *   - AI cannot approve buyer_ready (ever)
 */
import { describe, it, expect } from "vitest";
import {
  runRiskBoundaryCheck,
  runDisclosureGuard,
  buildDraftOutput,
  createAiRunRecord,
  type RiskBoundaryResult,
  type DisclosureGuardResult,
  type AiRunRecord,
} from "@/domain/ai/draft-guardrails";
import { FullIMWriterOutputSchema } from "@/domain/ai/writer-schema";

// ─── Fixtures ─────────────────────────────────────────────────────────

const SAFE_DRAFT = `
## 입지 및 접근성

성수권역 소재 자산으로, 2호선 역세권에 위치하며 보행 접근성이 양호합니다.
현재 임대차 현황은 내부 자료 기준이며, 실제 임대조건은 별도 확인이 필요합니다.
`;

const UNSAFE_INVESTMENT = `
## 핵심 요약

이 자산은 투자 가치가 매우 높습니다.
매수를 강력히 추천드립니다.
수익률이 보장됩니다.
`;

const UNSAFE_DEBT = `
## 대출 민감도

LTV 60% 대출이 가능합니다.
금리 4.5%로 확정될 예정입니다.
DSCR이 충분하여 대출 승인이 예상됩니다.
`;

const UNSAFE_EXACT_ADDRESS = `
## 물건 정보

서울 성동구 성수동2가 123-45번지에 위치한 건물입니다.
1층 스타벅스 임차인의 월세는 450만원입니다.
`;

const SAFE_FINANCIAL = `
## NOI 분석

입력자료 기준 추정 NOI는 약 X억원 수준입니다.
본 NOI는 제공자료와 제한된 운영비 가정을 바탕으로 한 예비 추정이며,
실제 NOI는 임대차계약서, 관리비 구조, 수선비, 공실기간 확인 후 달라질 수 있습니다.
`;

// ─── 1. RiskBoundary: investment claims ───────────────────────────────

describe("runRiskBoundaryCheck", () => {
  it("passes safe draft without issues", () => {
    const result = runRiskBoundaryCheck(SAFE_DRAFT, "executive_summary");
    expect(result.status).toBe("pass");
    expect(result.issues).toHaveLength(0);
  });

  it("blocks unsafe investment recommendation (P0)", () => {
    const result = runRiskBoundaryCheck(UNSAFE_INVESTMENT, "executive_summary");
    expect(result.status).toBe("blocked");
    const p0 = result.issues.find((i) => i.severity === "p0");
    expect(p0).toBeDefined();
    expect(p0!.issue_type).toBe("investment_recommendation");
  });

  it("flags '매수 추천' as P0 investment_recommendation", () => {
    const result = runRiskBoundaryCheck("매수를 강력히 추천드립니다.", "executive_summary");
    const issue = result.issues.find((i) => i.issue_type === "investment_recommendation");
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("p0");
  });

  it("flags '수익률 보장' as P0 financial_certainty", () => {
    const result = runRiskBoundaryCheck("수익률이 보장됩니다.", "income_noi_yield_analysis");
    const issue = result.issues.find((i) => i.issue_type === "financial_certainty");
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("p0");
  });

  it("flags debt certainty as P0 and provides rewrite", () => {
    const result = runRiskBoundaryCheck(UNSAFE_DEBT, "debt_sensitivity_cash_flow");
    expect(result.status).toBe("blocked");
    const debtIssue = result.issues.find((i) => i.issue_type === "loan_certainty");
    expect(debtIssue).toBeDefined();
    expect(debtIssue!.recommended_text).toContain("금융기관");
  });

  it("flags '대출 가능합니다' as loan_certainty", () => {
    const result = runRiskBoundaryCheck("LTV 60% 대출이 가능합니다.", "debt_sensitivity_cash_flow");
    const issue = result.issues.find((i) => i.issue_type === "loan_certainty");
    expect(issue).toBeDefined();
  });

  it("safe financial text with NOI disclaimer passes", () => {
    const result = runRiskBoundaryCheck(SAFE_FINANCIAL, "income_noi_yield_analysis");
    expect(result.status).toBe("pass");
  });

  it("issues have required_text fields", () => {
    const result = runRiskBoundaryCheck(UNSAFE_INVESTMENT, "executive_summary");
    for (const issue of result.issues) {
      expect(typeof issue.message).toBe("string");
      expect(issue.message.length).toBeGreaterThan(0);
    }
  });
});

// ─── 2. DisclosureGuard: exact_address in blind ───────────────────────

describe("runDisclosureGuard", () => {
  it("blocks exact_address in public_blind output (P0)", () => {
    const result = runDisclosureGuard({
      text: UNSAFE_EXACT_ADDRESS,
      target_visibility: "public_blind",
      gate_level: "G0",
      protected_fields_available: ["exact_address", "tenant_name", "unit_rent"],
      output_type: "blind_teaser",
    });
    expect(result.status).toBe("blocked");
    expect(result.redacted_fields).toContain("exact_address");
  });

  it("P0 violation for tenant_name in blind_teaser", () => {
    const result = runDisclosureGuard({
      text: "1층 스타벅스 임차인의 월세는 450만원입니다.",
      target_visibility: "public_blind",
      gate_level: "G0",
      protected_fields_available: ["tenant_name", "unit_rent"],
      output_type: "blind_teaser",
    });
    const v = result.violations.find((v) => v.severity === "p0");
    expect(v).toBeDefined();
  });

  it("unit_rent in public_blind is blocked", () => {
    const result = runDisclosureGuard({
      text: "월세 450만원입니다.",
      target_visibility: "public_blind",
      gate_level: "G0",
      protected_fields_available: ["unit_rent"],
      output_type: "blind_teaser",
    });
    expect(result.redacted_fields).toContain("unit_rent");
  });

  it("safe text passes with no violations", () => {
    const result = runDisclosureGuard({
      text: SAFE_DRAFT,
      target_visibility: "internal_only",
      gate_level: "G3",
      protected_fields_available: [],
      output_type: "full_im",
    });
    expect(result.status).toBe("pass");
    expect(result.violations).toHaveLength(0);
  });

  it("safe_text is always returned", () => {
    const result = runDisclosureGuard({
      text: UNSAFE_EXACT_ADDRESS,
      target_visibility: "public_blind",
      gate_level: "G0",
      protected_fields_available: ["exact_address"],
      output_type: "blind_teaser",
    });
    expect(typeof result.safe_text).toBe("string");
    expect(result.safe_text.length).toBeGreaterThan(0);
  });
});

// ─── 3. FullIMWriterOutput schema ─────────────────────────────────────

describe("FullIMWriterOutputSchema", () => {
  it("validates a valid draft output", () => {
    const valid = {
      section_type: "location_access",
      title: "입지 및 접근성",
      markdown: SAFE_DRAFT,
      content_json: { summary: "성수권역 역세권" },
      confidence: "inferred",
      risk_level: "low",
      source_refs: [{ type: "building_ssot_lite", id: "bsl_001", source: "lite_import" }],
      evidence_refs: [],
      missing_data: [],
      requires_expert_patch: false,
      boundary_note: "본 자료는 예비 검토용입니다.",
    };
    const result = FullIMWriterOutputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects draft without boundary_note", () => {
    const invalid = {
      section_type: "location_access",
      title: "입지",
      markdown: "content",
      content_json: {},
      confidence: "inferred",
      risk_level: "low",
      source_refs: [],
      evidence_refs: [],
      missing_data: [],
      requires_expert_patch: false,
      // missing boundary_note
    };
    const result = FullIMWriterOutputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects invalid confidence value", () => {
    const invalid = {
      section_type: "location_access",
      title: "입지",
      markdown: "content",
      content_json: {},
      confidence: "guaranteed", // invalid
      risk_level: "low",
      source_refs: [],
      evidence_refs: [],
      missing_data: [],
      requires_expert_patch: false,
      boundary_note: "예비 검토",
    };
    const result = FullIMWriterOutputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

// ─── 4. buildDraftOutput ──────────────────────────────────────────────

describe("buildDraftOutput", () => {
  it("always includes boundary_note", () => {
    const output = buildDraftOutput({
      section_type: "location_access",
      title: "입지 및 접근성",
      markdown: SAFE_DRAFT,
      source_refs: [],
      evidence_refs: [],
      missing_data: [],
      requires_expert_patch: false,
      confidence: "inferred",
      risk_level: "low",
    });
    expect(output.boundary_note).toBeDefined();
    expect(output.boundary_note.length).toBeGreaterThan(10);
  });

  it("buyer_ready is never set by draft builder (AI cannot approve)", () => {
    const output = buildDraftOutput({
      section_type: "executive_summary",
      title: "핵심 요약",
      markdown: SAFE_DRAFT,
      source_refs: [],
      evidence_refs: [],
      missing_data: [],
      requires_expert_patch: false,
      confidence: "inferred",
      risk_level: "medium",
    });
    // status field should be 'ai_draft', never 'buyer_ready'
    expect(output.status).toBe("ai_draft");
    expect(output.status).not.toBe("buyer_ready");
  });

  it("high-risk sections have requires_expert_patch=true", () => {
    const output = buildDraftOutput({
      section_type: "income_noi_yield_analysis",
      title: "NOI 분석",
      markdown: SAFE_FINANCIAL,
      source_refs: [],
      evidence_refs: [],
      missing_data: [],
      requires_expert_patch: true,
      confidence: "expert_required",
      risk_level: "high",
    });
    expect(output.requires_expert_patch).toBe(true);
  });
});

// ─── 5. createAiRunRecord ─────────────────────────────────────────────

describe("createAiRunRecord", () => {
  it("creates a run record with required fields", () => {
    const rec = createAiRunRecord({
      project_id: "proj_001",
      section_id: "sec_001",
      run_type: "section_draft",
      prompt_version: "prompt_full_im_section_writer_v1",
      model: "gpt-4o",
      status: "completed",
      latency_ms: 1240,
    });
    expect(rec.run_type).toBe("section_draft");
    expect(rec.prompt_version).toBe("prompt_full_im_section_writer_v1");
    expect(rec.status).toBe("completed");
    expect(rec.latency_ms).toBe(1240);
  });

  it("ai_run has input_ref and output_ref placeholders", () => {
    const rec = createAiRunRecord({
      project_id: "proj_001",
      section_id: "sec_001",
      run_type: "section_draft",
      prompt_version: "prompt_full_im_section_writer_v1",
      model: "gpt-4o",
      status: "completed",
      latency_ms: 800,
    });
    expect(rec.input_ref).toBeDefined();
    expect(rec.output_ref).toBeDefined();
  });

  it("failed run captures error field", () => {
    const rec = createAiRunRecord({
      project_id: "proj_001",
      section_id: "sec_001",
      run_type: "section_draft",
      prompt_version: "prompt_full_im_section_writer_v1",
      model: "gpt-4o",
      status: "failed",
      latency_ms: 200,
      error: "OpenAI timeout",
    });
    expect(rec.status).toBe("failed");
    expect(rec.error).toBe("OpenAI timeout");
  });
});
