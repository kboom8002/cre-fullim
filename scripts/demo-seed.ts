import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Hardcoded IDs for Demo
export const DEMO_IDS = {
  PROJECT_ID: "00000000-0000-0000-0000-000000000010",
  BSSOT_FULL_ID: "00000000-0000-0000-0000-000000000020",
  SNAPSHOT_ID: "00000000-0000-0000-0000-000000000030",
  HANDOFF_ID: "demo-handoff-hof_demo_2026_sungsu_001",
  EXPERT_ID: "00000000-0000-0000-0000-000000000040",
  ASSIGNMENT_ID: "00000000-0000-0000-0000-000000000050",
  PATCH_ID: "00000000-0000-0000-0000-000000000060",
  GOLDEN_ID: "00000000-0000-0000-0000-000000000070",
  SEC_ID_PREFIX: "00000000-0000-0000-0000-0000000001", // + 01 to 18
};

async function seed() {
  console.log("🌱 Seeding Demo Project...");

  // 1. Snapshot
  console.log("  Inserting Snapshot...");
  await supabase.from("handoff_source_snapshots").upsert({
    id: DEMO_IDS.SNAPSHOT_ID,
    handoff_id: DEMO_IDS.HANDOFF_ID,
    source_app: "js-building-ssot-mvp",
    contracts_version: "1.0.0",
    payload_version: "1.0",
    source_building_ssot_lite_id: "bsl_demo_sungsu_001",
    source_objects: {},
    import_status: "pending_import"
  });

  // 2. Building SSoT Full
  console.log("  Inserting Building SSoT Full...");
  await supabase.from("building_ssot_full").upsert({
    id: DEMO_IDS.BSSOT_FULL_ID,
    source_building_ssot_lite_id: "bsl_demo_sungsu_001",
    created_by: "00000000-0000-0000-0000-000000000000",
    asset_identity: {
      disclosure_name: "성수권역 복합 상업시설",
      area_signal: "성동구 성수권역",
      gross_area_sqm: 1850,
      net_leasable_area_sqm: 1320,
      building_type: "mixed_use",
      floors_above_ground: 6,
      construction_year: 2018,
      asking_price_krw: 9500000000
    },
    lease_income: {
      lease_count: 8,
      anchor_tenant_type: "F&B",
      monthly_rent_total_krw: 38000000,
      operating_expense_monthly_krw: 4200000,
      rent_roll_confirmed: true
    },
    legal_registry: {
      land_use_zone: "일반상업지역",
      floor_area_ratio: 0.82,
      registry_confirmed: true
    },
    disclosure_gate: {
      gate_level: "G3",
      protected_fields: ["exact_address", "tenant_name", "unit_rent", "owner_contact"]
    },
    readiness_status: "lite_imported"
  });

  // 3. IM Project
  console.log("  Inserting IM Project...");
  await supabase.from("im_projects").upsert({
    id: DEMO_IDS.PROJECT_ID,
    building_ssot_full_id: DEMO_IDS.BSSOT_FULL_ID,
    created_by: "00000000-0000-0000-0000-000000000000",
    project_type: "ai_expert_review",
    target_output: "buyer_ready_full_im",
    status: "intake", // Set to intake so it starts fresh before outline generation, but let's actually make it readiness_pending so the UI shows Readiness Check button!
    // Wait, if we want to show outline generated from scratch, we can leave sections out or just let them be overwritten?
    // Actually `mergeSectionUpdates` is idempotent. It will keep existing sections. We can pre-seed them.
    readiness_score: 81
  });
  
  // Set to intake to ensure Readiness Check is clickable if UI depends on it, but the plan says "readiness_pending 리셋".
  await supabase.from("im_projects").update({ status: "readiness_pending" }).eq("id", DEMO_IDS.PROJECT_ID);

  // 4. IM Sections
  console.log("  Inserting IM Sections...");
  const sections = [
    { type: "cover_confidentiality", order: 1, title: "표지 및 기밀유지 안내", status: "planned" },
    { type: "executive_summary", order: 2, title: "핵심 요약", status: "ai_draft", draft: "본 자산은 성수권역 핵심 상권에 위치한 우량 자산입니다." },
    { type: "investment_thesis_buyer_fit", order: 3, title: "투자 논거 및 매수자 적합성", status: "ai_draft", draft: "밸류애드 포텐셜이 높은 기관 투자자 적합 물건입니다." },
    { type: "property_fact_sheet", order: 4, title: "물건 기본 팩트 시트", status: "ai_draft", draft: "연면적 1,850㎡ 규모의 6층 건물입니다." },
    { type: "location_market_context", order: 5, title: "Location & Market Context", status: "ai_draft", draft: "지하철역 도보 3분 거리입니다." },
    { type: "building_condition_physical_review", order: 6, title: "건물 상태 및 물리적 검토", status: "planned" },
    { type: "rent_roll_lease_quality", order: 7, title: "임대 현황 및 임대차 품질", status: "needs_expert_patch" },
    { type: "income_noi_yield_analysis", order: 8, title: "임대수입·NOI·수익률 분석", status: "needs_expert_patch", draft: "NOI는 약 4억원으로 추정되며 수익률이 보장됩니다." },
    { type: "operating_expense_noi", order: 9, title: "Operating Expense & NOI", status: "planned" },
    { type: "valuation_logic_comparables", order: 10, title: "가치평가 논리 및 비교사례", status: "planned" },
    { type: "value_add_repositioning_scenario", order: 11, title: "가치상승·리포지셔닝 시나리오", status: "planned" },
    { type: "debt_sensitivity_cash_flow", order: 12, title: "대출 민감도 및 현금흐름", status: "planned" },
    { type: "risk_factors_dd_checklist", order: 13, title: "리스크 요인 및 DD 체크리스트", status: "ai_draft", draft: "1층 공실 해소 방안이 주요 리스크입니다." },
    { type: "tax_structure_note", order: 14, title: "Tax Structure Note", status: "planned" },
    { type: "land_zoning_legal_constraints", order: 15, title: "토지·용도지역·법적 제약", status: "planned" },
    { type: "appendix_evidence_index", order: 16, title: "부록: 증거 자료 인덱스", status: "planned" },
    { type: "deal_process_next_steps", order: 17, title: "딜 프로세스 및 다음 단계", status: "ai_draft", draft: "인수의향서(LOI) 접수 후 상세 자료 제공 예정입니다." },
    { type: "disclaimer_contact", order: 18, title: "면책 사항 및 연락처", status: "planned" },
  ];

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    await supabase.from("im_sections").upsert({
      id: `${DEMO_IDS.SEC_ID_PREFIX}${String(i + 1).padStart(2, "0")}`,
      project_id: DEMO_IDS.PROJECT_ID,
      section_type: s.type,
      section_order: s.order,
      title: s.title,
      status: s.status,
      content_json: s.draft ? { blocks: [{ type: "paragraph", data: { text: s.draft } }] } : {}
    });
  }

  // 5. Expert Profile
  console.log("  Inserting Expert Profile...");
  await supabase.from("expert_profiles").upsert({
    id: DEMO_IDS.EXPERT_ID,
    user_id: "00000000-0000-0000-0000-000000000000",
    expert_role: "cre_consultant",
    display_name: "Demo Consultant",
    organization: "Demo Advisory",
    status: "active"
  });

  // 6. Expert Assignment
  console.log("  Inserting Expert Assignment...");
  await supabase.from("expert_assignments").upsert({
    id: DEMO_IDS.ASSIGNMENT_ID,
    project_id: DEMO_IDS.PROJECT_ID,
    section_id: `${DEMO_IDS.SEC_ID_PREFIX}08`, // income_noi_yield_analysis
    expert_id: DEMO_IDS.EXPERT_ID,
    expert_role: "cre_consultant",
    assignment_type: "section_patch",
    status: "assigned",
    instructions: "NOI 추정치 및 Cap Rate 근거 검토 후 가드레일 준수 여부 확인 요망",
    created_by: "00000000-0000-0000-0000-000000000000"
  });

  // 7. Golden Dataset Candidate (for Admin view)
  console.log("  Inserting Golden Candidate...");
  await supabase.from("golden_im_candidates").upsert({
    id: DEMO_IDS.GOLDEN_ID,
    project_id: DEMO_IDS.PROJECT_ID,
    section_id: `${DEMO_IDS.SEC_ID_PREFIX}08`,
    section_type: "income_noi_yield_analysis",
    ai_draft: "NOI는 약 4억원으로 추정되며 수익률이 보장됩니다.",
    expert_revision: "공개 임대수익(연간 약 4.56억원) 및 추정 운영비(연간 약 0.5억원) 기준 NOI는 약 4억원 내외로 추정됩니다. 실제 수익률은 임대조건, 공실기간, 운영비 변동에 따라 달라질 수 있으며, 별도 실사를 통해 확인하시기 바랍니다.",
    edit_tags: ["overclaim_removed", "risk_balance_added", "financial_assumption_added"],
    redaction_status: "redacted",
    training_rights: "allowed_anonymized",
    review_status: "candidate"
  });

  console.log("✅ Demo Seeding Completed!");
}

seed().catch(console.error);
