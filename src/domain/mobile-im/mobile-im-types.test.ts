import { describe, it, expect } from "vitest";
import { MOBILE_IM_SECTIONS_7 } from "./mobile-im-types";
import { MOBILE_IM_SECTION_TEMPLATES } from "./section-templates";
import { IM_SECTIONS_18 } from "@/domain/readiness/readiness-service";

describe("Mobile IM Types and Templates", () => {
  it("should have exactly 7 sections defined", () => {
    expect(MOBILE_IM_SECTIONS_7.length).toBe(7);
  });

  it("should have templates mapping for all 7 sections", () => {
    MOBILE_IM_SECTIONS_7.forEach((section) => {
      expect(MOBILE_IM_SECTION_TEMPLATES[section]).toBeDefined();
    });
  });

  it("should map all mobile IM sections to valid Full IM sources", () => {
    MOBILE_IM_SECTIONS_7.forEach((section) => {
      const fullImSource = MOBILE_IM_SECTION_TEMPLATES[section].full_im_source;
      expect((IM_SECTIONS_18 as readonly string[]).includes(fullImSource)).toBe(true);
    });
  });
});
