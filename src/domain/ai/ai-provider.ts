/**
 * AI Provider Abstraction (docs/15-ai-agent-contracts.md §2)
 *
 * Abstracts OpenAI calls behind a provider interface.
 * Mock mode is activated when OPENAI_API_KEY is not set or NODE_ENV=test.
 *
 * Rules:
 *   - All prompts include Global System Instruction (docs/16 §3)
 *   - Model is always logged in ai_runs.model
 *   - Output must pass FullIMWriterOutputSchema Zod validation
 */

// ─── System instruction (docs/16 §3) ─────────────────────────────────

export const GLOBAL_SYSTEM_INSTRUCTION = `You are assisting with commercial real estate investment memorandum production.
You must not invent facts.
You must ground claims in provided Building SSoT, source_refs, and evidence_refs.
You must mark uncertainty and missing data explicitly.
You must not provide investment recommendation, final valuation, legal advice, tax advice, loan approval judgment, or guaranteed yield.
You must use safe language for finance, legal, tax, debt, valuation, and value-add scenarios.
You must respect disclosure policy and protected fields.
All outputs must match the requested structured schema.`;

// ─── Section Writer Prompt (docs/16 §7 prompt_full_im_section_writer_v1) ──

export interface SectionWriterInput {
  project_id: string;
  section_id: string;
  section_type: string;
  section_title: string;
  building_ssot_full: Record<string, unknown>;
  source_refs: Record<string, unknown>[];
  evidence_refs: Record<string, unknown>[];
  target_output: string;
  writing_style?: string;
  template_structure?: string;
}

export interface SectionWriterRawOutput {
  markdown: string;
  content_json: Record<string, unknown>;
  confidence: string;
  risk_level: string;
  missing_data: string[];
  requires_expert_patch: boolean;
  source_refs: Record<string, unknown>[];
  evidence_refs: Record<string, unknown>[];
}

// ─── Mock Provider ────────────────────────────────────────────────────

function buildMockDraft(input: SectionWriterInput): SectionWriterRawOutput {
  const { section_type, section_title, building_ssot_full } = input;

  const assetIdentity = (building_ssot_full.asset_identity ?? {}) as Record<string, unknown>;
  const areaSignal = assetIdentity.area_signal ?? "대상 지역";

  // High-risk sections always require expert patch
  const highRiskSections = [
    "income_noi_yield_analysis",
    "debt_sensitivity_cash_flow",
    "valuation_logic_comparables",
    "land_zoning_legal_constraints",
    "building_condition_physical_review",
    "risk_factors_dd_checklist",
    "value_add_repositioning_scenario",
  ];
  const requiresExpert = highRiskSections.includes(section_type);

  const sectionMarkdowns: Partial<Record<string, string>> = {
    executive_summary: `## ${section_title}

${areaSignal} 소재 자산으로, 입력자료 기준 핵심 사항을 요약합니다.

본 자료는 제공된 정보를 기반으로 한 예비 검토이며, 실제 투자 적합성은 별도 실사와 전문가 검토를 통해 판단해야 합니다.

**주요 투자 포인트** (예비):
- 위치 신호: ${areaSignal}
- 추가 데이터 확인 필요

**주의사항**: 본 요약은 AI 예비 초안으로, 전문가 검토 전 외부 공유는 권장되지 않습니다.`,

    income_noi_yield_analysis: `## ${section_title}

### 입력 근거
제공된 임대차 자료 기준으로 분석하였습니다.

### 가정 박스
- 임대수입: 제공된 임대차 요약 기준 (미확인 항목 포함)
- 공실: 현재 입력자료 기준
- 운영비: **미확인, 별도 확인 필요**
- 대출조건: 예시 민감도 가정이며 금융기관 심사 결과가 아님

### NOI 예비 추정
본 NOI는 제공자료와 제한된 운영비 가정을 바탕으로 한 예비 추정이며, 실제 NOI는 임대차계약서, 관리비 구조, 수선비, 공실기간 확인 후 달라질 수 있습니다.

> **전문가 검토 필요**: CRE 컨설턴트의 운영비 가정 및 NOI 표현 검토가 필요합니다.`,

    debt_sensitivity_cash_flow: `## ${section_title}

### 대출 민감도 시나리오

아래는 예시 가정 기반 민감도 분석이며, 실제 대출 가능성과 조건을 보장하지 않습니다.

| 시나리오 | LTV 가정 | 금리 가정 | 월 현금흐름 |
|---|---|---|---|
| 보수적 | 50% | 5.0% | 미확인 |
| 기준 | 60% | 4.5% | 미확인 |
| 낙관적 | 70% | 4.0% | 미확인 |

**면책 사항**: 대출 가능성과 조건은 금융기관 심사, 담보평가, 차주 신용도, 시장금리에 따라 달라질 수 있습니다.

> **전문가 검토 필요**: 금융/대출 전문가 검토 후 수치 확정이 필요합니다.`,

    location_access: `## ${section_title}

${areaSignal} 소재 자산으로, 대중교통 접근성 및 주변 인프라 현황을 정리합니다.

입력자료 기준으로 작성된 예비 검토이며, 현장 실사를 통한 확인이 필요합니다.`,
  };

  const markdown =
    sectionMarkdowns[section_type] ??
    `## ${section_title}\n\n${areaSignal} 기준 ${section_title} 섹션 예비 초안입니다.\n\n입력자료 기준으로 작성되었으며, 실사 및 전문가 검토가 필요합니다.`;

  return {
    markdown,
    content_json: { section_type, generated_by: "mock_provider" },
    confidence: requiresExpert ? "expert_required" : "inferred",
    risk_level: requiresExpert ? "high" : "medium",
    missing_data: requiresExpert ? ["전문가 검토 필요"] : [],
    requires_expert_patch: requiresExpert,
    source_refs: input.source_refs,
    evidence_refs: input.evidence_refs,
  };
}

// ─── OpenAI Provider ──────────────────────────────────────────────────

async function callOpenAI(input: SectionWriterInput): Promise<SectionWriterRawOutput> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const assetJson = JSON.stringify({
    asset_identity: input.building_ssot_full.asset_identity,
    physical_fact: input.building_ssot_full.physical_fact,
    lease_income: input.building_ssot_full.lease_income,
    disclosure_gate: input.building_ssot_full.disclosure_gate,
  }, null, 2);

  const userPrompt = `Generate a professional Korean real estate IM section draft.

Section: ${input.section_title} (${input.section_type})
Template: ${input.template_structure ?? "standard"}
Target Output: ${input.target_output}

Building SSoT Context:
${assetJson}

Respond ONLY with a JSON object matching this schema:
{
  "markdown": "string (Korean, professional)",
  "content_json": {},
  "confidence": "confirmed|inferred|needs_evidence|expert_required|unknown",
  "risk_level": "low|medium|high|blocked",
  "missing_data": ["array of missing items"],
  "requires_expert_patch": boolean,
  "source_refs": [],
  "evidence_refs": []
}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: GLOBAL_SYSTEM_INSTRUCTION },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 2000,
  });

  const raw = JSON.parse(response.choices[0].message.content ?? "{}");
  return raw as SectionWriterRawOutput;
}

// ─── Main provider entry ──────────────────────────────────────────────

const USE_MOCK =
  !process.env.OPENAI_API_KEY ||
  process.env.OPENAI_API_KEY === "test" ||
  process.env.NODE_ENV === "test";

export async function generateSectionDraft(
  input: SectionWriterInput,
): Promise<{ output: SectionWriterRawOutput; model: string; usedMock: boolean }> {
  if (USE_MOCK) {
    return { output: buildMockDraft(input), model: "mock-provider", usedMock: true };
  }

  const output = await callOpenAI(input);
  return { output, model: "gpt-4o", usedMock: false };
}
