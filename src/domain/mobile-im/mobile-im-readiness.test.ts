import { describe, it, expect } from "vitest";
import { computeMobileIMReadiness, MOBILE_IM_READINESS_THRESHOLD } from "./mobile-im-readiness";
import type { MobileIMSupplementalInput } from "./mobile-im-types";

describe("Mobile IM Readiness Engine", () => {
  it("should return correct score and missing data for empty input", () => {
    const result = computeMobileIMReadiness({}, {});
    expect(result.score).toBe(0);
    expect(result.can_generate).toBe(false);
    expect(result.missing.length).toBe(7);
  });

  it("should allow generation with just basic BSSoT Lite data (score 45)", () => {
    const bssotLite = {
      asset_identity: {
        area_signal: "성수권역",
        price_band: "80억대",
        asset_type: "근생형 꼬마빌딩"
      }
    };
    const supplemental: MobileIMSupplementalInput = {};

    const result = computeMobileIMReadiness(bssotLite, supplemental);
    expect(result.score).toBe(45); // 15 + 15 + 15
    expect(result.can_generate).toBe(true);
    expect(result.missing).toContain("월세 총액");
    expect(result.missing).toContain("건물 사진");
  });

  it("should return 100 for fully populated input", () => {
    const bssotLite = {
      asset_identity: {
        area_signal: "성수권역",
        price_band: "80억대",
        asset_type: "근생형 꼬마빌딩"
      },
      physical_fact: {
        vacancy_signal: "일부 공실"
      },
      address: "서울 성동구"
    };
    const supplemental: MobileIMSupplementalInput = {
      monthly_rent_total_krw: 5000000,
      photo_urls: ["http://example.com/photo.jpg"]
    };

    const result = computeMobileIMReadiness(bssotLite, supplemental);
    expect(result.score).toBe(100);
    expect(result.can_generate).toBe(true);
    expect(result.missing.length).toBe(0);
  });
});
