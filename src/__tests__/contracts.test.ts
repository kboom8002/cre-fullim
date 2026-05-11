import { describe, it, expect } from "vitest";
import { 
  BuildingSSoTFullSchema, 
  IMProjectSchema, 
  IMSectionSchema, 
  ExpertPatchSchema,
  detectForbiddenClaims,
  validateSchema
} from "@js-ssot/contracts";

describe("Contracts and Schemas", () => {
  it("BuildingSSoTFull fixture validates", () => {
    const validFixture = {
      id: "bldg-123",
      created_by: "user-1",
      created_at: new Date().toISOString(),
      readiness_status: "lite_imported"
    };

    const result = validateSchema(BuildingSSoTFullSchema, validFixture);
    expect(result.success).toBe(true);

    const invalidFixture = {
      id: 123, // should be string
      created_by: "user-1"
    };
    
    const invalidResult = validateSchema(BuildingSSoTFullSchema, invalidFixture);
    expect(invalidResult.success).toBe(false);
  });

  it("IMProject fixture validates", () => {
    const validFixture = {
      id: "proj-123",
      source_app: "js-building-ssot-mvp",
      building_ssot_full_id: "bldg-123",
      created_by: "user-1",
      project_type: "ai_self_authoring",
      target_output: "buyer_ready_full_im",
      created_at: new Date().toISOString()
    };

    const result = validateSchema(IMProjectSchema, validFixture);
    expect(result.success).toBe(true);

    const invalidFixture = { ...validFixture, project_type: "unknown" };
    expect(validateSchema(IMProjectSchema, invalidFixture).success).toBe(false);
  });

  it("IMSection fixture validates", () => {
    const validFixture = {
      id: "sec-123",
      project_id: "proj-123",
      section_type: "executive_summary",
      section_order: 1,
      title: "Executive Summary",
      created_at: new Date().toISOString()
    };

    const result = validateSchema(IMSectionSchema, validFixture);
    expect(result.success).toBe(true);
  });

  it("ExpertPatch fixture validates", () => {
    const validFixture = {
      id: "patch-123",
      project_id: "proj-123",
      expert_id: "exp-1",
      expert_role: "cre_consultant",
      patch_type: "fact_correction",
      after_text: "Updated text here.",
      created_at: new Date().toISOString()
    };

    const result = validateSchema(ExpertPatchSchema, validFixture);
    expect(result.success).toBe(true);
  });

  it("forbidden claim detector flags unsafe statement", () => {
    const text = "이 매물은 투자 가치가 높습니다. 그리고 매수 추천합니다.";
    const claims = detectForbiddenClaims(text);
    
    expect(claims).toContain("투자 가치가 높습니다");
    expect(claims).toContain("매수 추천");
    expect(claims.length).toBe(2);
    
    const safeText = "본 분석은 예비 검토입니다.";
    expect(detectForbiddenClaims(safeText).length).toBe(0);
  });
});
