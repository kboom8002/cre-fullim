// src/lib/external/land-price-api.ts

export interface LandPriceData {
  pricePerSqm: number;        // 공시지가 (KRW/sqm)
  baseYear: string;           // 기준년도
  landCategory: string;       // 지목 (예: 대)
}

export async function fetchLandPrice(pnu: string): Promise<LandPriceData | null> {
  const apiKey = process.env.DATA_GO_KR_API_KEY;

  if (apiKey && apiKey !== "") {
    try {
      // 국토교통부 개별공시지가 속성 조회 API
      const url = `http://apis.data.go.kr/1611000/IndvdLandPriceService/getIndvdLandPriceAttr?ServiceKey=${apiKey}&pnu=${pnu}&numOfRows=1&pageNo=1&_type=json`;
      
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
        return {
          pricePerSqm: parseFloat(targetItem.pblntfPclnd || "0"),
          baseYear: String(targetItem.crtrYr || "2025"),
          landCategory: String(targetItem.ldcgCdNm || "대"),
        };
      }
    } catch (err) {
      console.warn("Land Price API request failed, falling back to simulation:", err);
    }
  }

  // DETERMINISTIC FALLBACK FOR DEVELOPMENT
  // PNU 번호 기반의 일관성 있는 모킹
  const seed = parseInt(pnu.substring(11, 15), 10) || 500;
  const isTeheran = pnu.startsWith("11680"); // 강남구
  
  const mockPrice = isTeheran 
    ? 25000000 + (seed % 10) * 1500000 
    : 8000000 + (seed % 10) * 500000;

  return {
    pricePerSqm: mockPrice,
    baseYear: "2025",
    landCategory: "대",
  };
}
