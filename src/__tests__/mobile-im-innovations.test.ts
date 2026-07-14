// src/__tests__/mobile-im-innovations.test.ts

import { describe, it, expect } from "vitest";
import { calculateScenario } from "../domain/mobile-im/scenario-calculator";
import { buildProvenanceMap } from "../domain/mobile-im/data-provenance";
import { buildNarrativeUserPrompt } from "../domain/mobile-im/narrative-prompt";

describe("Mobile IM Innovation Logic Tests", () => {
  
  // 1. Scenario Calculator Tests
  describe("Scenario Calculator Engine", () => {
    it("should compute base NOI, Cap Rate, and CoC yield correctly", () => {
      const inputs = {
        baseMonthlyRent: 15000000,   // 15 million KRW / month
        vacancyRatePct: 5,           // 5% vacancy
        opexRatePct: 10,             // 10% OPEX
        purchasePrice: 35000000000,  // 35 billion KRW
        interestRatePct: 4.5,        // 4.5% interest rate
        ltvPct: 60                   // 60% leverage LTV
      };

      const result = calculateScenario(inputs);

      expect(result.grossIncome).toBe(180000000);
      expect(result.effectiveIncome).toBe(171000000);
      expect(result.noi).toBe(153900000);
      expect(result.capRate).toBe(0.44); // 153.9M / 35B = 0.44%
      expect(result.dscr).toBe(0.16);    // Under leverage terms
    });

    it("should handle boundary cases safely", () => {
      const boundaryInputs = {
        baseMonthlyRent: 0,
        vacancyRatePct: 100, // 100% vacancy
        opexRatePct: 0,
        purchasePrice: 10000000000,
        interestRatePct: 5.0,
        ltvPct: 0 // no debt
      };

      const result = calculateScenario(boundaryInputs);
      expect(result.noi).toBe(0);
      expect(result.capRate).toBe(0);
      expect(result.cashOnCash).toBe(0);
      expect(result.dscr).toBe(99.9); // No interest expense
    });
  });

  // 2. Data Provenance Tests
  describe("Data Provenance Mapper", () => {
    it("should map sources correctly when public data is present", () => {
      const bssotLite = {
        asset_identity: { asset_type: "오피스" },
        physical_fact: { vacancy_signal: "공실 없음" },
      };

      const mockExternal = {
        resolvedAddress: {
          pnu: "1168010100108230021",
          legalDongCode: "1168010100",
          sigunguCd: "11680",
          bjdongCd: "10100",
          bun: "0823",
          ji: "0021",
          roadAddress: "테헤란로 123",
          jibunAddress: "역삼동 823-21",
          lat: 37.5008,
          lng: 127.0369,
          buildingMgtNo: "1168010100108230021000000",
        },
        buildingRegister: {
          totalArea: 3500.5,
          platArea: 650.2,
          useAprDay: "20180412",
          mainPurpose: "업무시설",
          structure: "철근콘크리트구조",
          floorsAbove: 8,
          floorsBelow: 2,
          bcRat: 59.5,
          vlRat: 498.2,
        },
        landPrice: {
          pricePerSqm: 18500000,
          baseYear: "2025",
          landCategory: "대",
        },
        landUsePlan: {
          zoningDistrict: "일반상업지역",
          zoningOverlap: ["방화지구"],
          buildingCoverageMax: 60,
          floorAreaRatioMax: 800,
        },
        comparableTransactions: [],
        locationPoi: null,
        enrichedAt: new Date().toISOString(),
        errors: [],
      };

      const supplemental = {
        monthly_rent_total_krw: 22000000,
      };

      const map = buildProvenanceMap(bssotLite, mockExternal, supplemental);

      const totalAreaProv = map.find(p => p.fieldKey === "total_area");
      expect(totalAreaProv).toBeDefined();
      expect(totalAreaProv?.source).toBe("public_data");
      expect(totalAreaProv?.confidence).toBe("confirmed");
      expect(totalAreaProv?.value).toBe(3500.5);

      const opexProv = map.find(p => p.fieldKey === "monthly_rent_total");
      expect(opexProv).toBeDefined();
      expect(opexProv?.source).toBe("broker_input");
      expect(opexProv?.confidence).toBe("confirmed");
      expect(opexProv?.value).toBe(22000000);
    });
  });

  // 3. Narrative Prompt Builder Tests
  describe("Narrative Prompt Builder", () => {
    it("should assemble prompts containing all relevant context", () => {
      const bssotLite = {
        asset_identity: { asset_type: "꼬마빌딩", area_signal: "강남구" },
      };
      const supplemental = {
        broker_highlight: "최고의 코너 입지",
      };

      const prompt = buildNarrativeUserPrompt("property_overview", bssotLite, null, supplemental);
      expect(prompt).toContain("property_overview");
      expect(prompt).toContain("꼬마빌딩");
      expect(prompt).toContain("최고의 코너 입지");
    });
  });
});
