import { describe, it, expect } from "vitest";
import { buildMobileIMCard, buildKakaoCopy } from "./mobile-im-export";
import type { MobileIMProject } from "./mobile-im-types";

describe("Mobile IM Export", () => {
  const dummyProject: MobileIMProject = {
    id: "test-id",
    source_type: "dealcard_handoff",
    building_ssot_lite: {
      asset_identity: {
        area_signal: "성수권역",
        price_band: "80억대",
        asset_type: "근생형 자산"
      }
    },
    supplemental_input: {
      vacancy_status: "85%"
    },
    readiness_score: 50,
    status: "published",
    slug: "test-slug",
    title: "",
    key_metrics: {},
    sections: [
      {
        section_type: "risk_check",
        section_order: 5,
        title: "확인 필요",
        markdown: "임대차 만기와 주차 조건, 위반건축물 여부 확인 요망",
        confidence: "inferred",
        boundary_note: "예비 검토용"
      }
    ],
    gate_result: {
      disclosure_status: "pass",
      risk_status: "pass",
      redacted_fields: [],
      risk_issues: []
    },
    full_im_readiness_score: 52,
    full_im_missing_data: ["등기부등본"],
    created_at: new Date().toISOString()
  };

  it("should build mobile IM card data correctly", () => {
    const card = buildMobileIMCard(dummyProject, "http://localhost:3000");
    
    expect(card.title).toBe("성수권역 80억대 근생형 자산");
    expect(card.caution_items).toContain("임대차 만기 확인");
    expect(card.caution_items).toContain("주차 조건");
    expect(card.public_url).toBe("http://localhost:3000/m/test-slug");
    expect(card.full_im_readiness.score).toBe(52);
  });

  it("should generate correct kakao copy", () => {
    const card = buildMobileIMCard(dummyProject, "http://localhost:3000");
    const copy = buildKakaoCopy(card);

    expect(copy).toContain("성수권역 80억대 근생형 자산");
    expect(copy).toContain("임대율: 85%");
    expect(copy).toContain("http://localhost:3000/m/test-slug");
  });
});
