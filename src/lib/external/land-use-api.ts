// src/lib/external/land-use-api.ts

export interface LandUsePlanData {
  zoningDistrict: string;         // 용도지역 (예: 일반상업지역, 제3종일반주거지역)
  zoningOverlap: string[];       // 기타 용도지구 (예: 방화지구, 시가지경관지구)
  buildingCoverageMax: number;    // 법정 건폐율 상한 (%)
  floorAreaRatioMax: number;      // 법정 용적률 상한 (%)
}

export async function fetchLandUsePlan(pnu: string): Promise<LandUsePlanData | null> {
  const apiKey = process.env.DATA_GO_KR_API_KEY;

  if (apiKey && apiKey !== "") {
    try {
      // 국토교통부 토지이용계획 기본정보 조회 API
      const url = `http://apis.data.go.kr/1611000/LandUseInfoService/getLandUseInfoAttr?ServiceKey=${apiKey}&pnu=${pnu}&numOfRows=1&pageNo=1&_type=json`;
      
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();

      const item = data?.response?.body?.items?.item;
      let targetItem = null;
      if (Array.isArray(item)) {
        targetItem = item[0];
      } else if (item) {
        targetItem = item;
      }

      if (targetItem) {
        const zoningDistrict = String(targetItem.prposAreaDstrcCodeNm || "일반상업지역");
        const zoningOverlap = targetItem.etcCodeNm ? [String(targetItem.etcCodeNm)] : ["방화지구"];
        
        // 법정 상한 매핑 (서울시 조례 기준 개략적 매핑)
        let buildingCoverageMax = 60;
        let floorAreaRatioMax = 250;
        if (zoningDistrict.includes("상업")) {
          buildingCoverageMax = 60;
          floorAreaRatioMax = 800;
        } else if (zoningDistrict.includes("준주거")) {
          buildingCoverageMax = 60;
          floorAreaRatioMax = 400;
        } else if (zoningDistrict.includes("3종")) {
          buildingCoverageMax = 50;
          floorAreaRatioMax = 250;
        } else if (zoningDistrict.includes("2종")) {
          buildingCoverageMax = 60;
          floorAreaRatioMax = 200;
        }

        return {
          zoningDistrict,
          zoningOverlap,
          buildingCoverageMax,
          floorAreaRatioMax,
        };
      }
    } catch (err) {
      console.warn("Land Use Plan API request failed, falling back to simulation:", err);
    }
  }

  // DETERMINISTIC FALLBACK FOR DEVELOPMENT
  // PNU 번호 기반의 일관성 있는 모킹
  const seed = parseInt(pnu.substring(11, 15), 10) || 500;
  const isCommercial = seed % 3 !== 0;

  if (isCommercial) {
    return {
      zoningDistrict: "일반상업지역",
      zoningOverlap: ["방화지구", "중심지미관지구"],
      buildingCoverageMax: 60,
      floorAreaRatioMax: 800,
    };
  } else {
    return {
      zoningDistrict: "제3종일반주거지역",
      zoningOverlap: ["시가지경관지구"],
      buildingCoverageMax: 50,
      floorAreaRatioMax: 250,
    };
  }
}
