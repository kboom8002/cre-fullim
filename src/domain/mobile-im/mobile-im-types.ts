export const MOBILE_IM_SECTIONS_7 = [
  "property_overview",        // Full IM: property_fact_sheet
  "location_access",          // Full IM: location_access
  "lease_status",             // Full IM: rent_roll_lease_quality
  "income_analysis",          // Full IM: income_noi_yield_analysis
  "risk_check",               // Full IM: risk_factors_dd_checklist
  "investment_thesis",        // Full IM: investment_thesis_buyer_fit
  "next_steps",               // Full IM: deal_process_next_steps
] as const;

export type MobileIMSectionType = (typeof MOBILE_IM_SECTIONS_7)[number];

export interface MobileIMProject {
  id: string;
  source_type: "dealcard_handoff" | "direct_create";
  source_handoff_token?: string;
  source_building_ssot_lite_id?: string;
  building_ssot_lite: Record<string, unknown>;
  supplemental_input: MobileIMSupplementalInput;
  readiness_score: number;
  status: "draft" | "generating" | "generated" | "published" | "archived";
  slug: string;
  title: string;
  key_metrics: Record<string, unknown>;
  sections: MobileIMSection[];
  gate_result: MobileIMLiteGateResult;
  kakao_copy?: string;
  boundary_note?: string;
  full_im_readiness_score?: number;
  full_im_missing_data?: string[];
  created_at: string;
  published_at?: string;
}

export interface MobileIMSupplementalInput {
  monthly_rent_total_krw?: number;   // 월세 총액
  vacancy_status?: string;           // 공실 현황 간단 입력
  photo_urls?: string[];             // 대표 사진 3~5장
  broker_highlight?: string;         // 브로커 한줄 코멘트
}

export interface MobileIMSection {
  section_type: MobileIMSectionType;
  section_order: number;
  title: string;
  markdown: string;
  confidence: "confirmed" | "inferred" | "needs_check";
  boundary_note: string;
}

export interface MobileIMLiteGateResult {
  disclosure_status: "pass" | "redacted" | "blocked";
  risk_status: "pass" | "revise" | "blocked";
  redacted_fields: string[];
  risk_issues: { severity: string; message: string }[];
}
