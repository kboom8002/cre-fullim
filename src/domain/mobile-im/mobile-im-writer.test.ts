import { describe, it, expect } from "vitest";
import { generateMobileIM } from "./mobile-im-writer";
import { MOBILE_IM_SECTIONS_7 } from "./mobile-im-types";
import { STANDARD_DISCLAIMER } from "@/domain/export/export-service";

describe("Mobile IM Writer", () => {
  it("should generate exactly 7 sections", async () => {
    const output = await generateMobileIM({
      building_ssot_lite: {},
      supplemental: {},
      readiness: { score: 45, missing: [] }
    });

    expect(output.sections.length).toBe(7);
    expect(output.boundary_note).toBe(STANDARD_DISCLAIMER);
    
    // Check order and types
    MOBILE_IM_SECTIONS_7.forEach((type, index) => {
      expect(output.sections[index].section_type).toBe(type);
      expect(output.sections[index].section_order).toBe(index + 1);
    });
  });

  it("should include broker highlight in investment_thesis", async () => {
    const output = await generateMobileIM({
      building_ssot_lite: {},
      supplemental: { broker_highlight: "이 물건은 정말 좋습니다." },
      readiness: { score: 45, missing: [] }
    });

    const thesisSection = output.sections.find(s => s.section_type === "investment_thesis");
    expect(thesisSection?.markdown).toContain("이 물건은 정말 좋습니다.");
  });
});
