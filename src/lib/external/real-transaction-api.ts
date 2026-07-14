// src/lib/external/real-transaction-api.ts

export interface ComparableTransaction {
  address: string;               // 주소
  dealYear: number;
  dealMonth: number;
  dealDay: number;
  dealAmount: number;            // 거래금액 (KRW)
  area: number;                  // 연면적 (sqm)
  pricePerSqm: number;           // 평방미터당 가격 (KRW)
  pricePerPyeong: number;        // 평당 가격 (KRW)
  buildingUse: string;           // 용도
  floors: number;                // 층수
}

export async function fetchComparableTransactions(
  sigunguCd: string,
  yearMonth = "202510"
): Promise<ComparableTransaction[]> {
  const apiKey = process.env.DATA_GO_KR_API_KEY;

  if (apiKey && apiKey !== "") {
    try {
      // 국토교통부 상업업무용 실거래 자료 조회 API
      const url = `http://apis.data.go.kr/1613000/RTMSOBJSvc/getRTMSDataSvcNrgTrade?ServiceKey=${apiKey}&LAWD_CD=${sigunguCd}&DEAL_YMD=${yearMonth}&numOfRows=10&pageNo=1&_type=json`;
      
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();

      const item = data?.response?.body?.items?.item;
      let itemsArray: any[] = [];
      if (Array.isArray(item)) {
        itemsArray = item;
      } else if (item) {
        itemsArray = [item];
      }

      if (itemsArray.length > 0) {
        return itemsArray.map((t: any) => {
          // 거래금액 예: "  1,250,000 " -> 12500000000 (KRW 단위 환산 주의. API는 만원 단위)
          const dealAmtTenThousand = parseInt(String(t.dealAmount).replace(/,/g, "").trim(), 10) || 0;
          const dealAmount = dealAmtTenThousand * 10000;
          const area = parseFloat(t.totArea || "1");
          const pricePerSqm = dealAmount / area;
          const pricePerPyeong = pricePerSqm * 3.30578;

          return {
            address: `${t.sigungu || ""} ${t.dong || ""} ${t.jibun || ""}`.trim(),
            dealYear: parseInt(t.dealYear || "2025", 10),
            dealMonth: parseInt(t.dealMonth || "10", 10),
            dealDay: parseInt(t.dealDay || "1", 10),
            dealAmount,
            area,
            pricePerSqm,
            pricePerPyeong,
            buildingUse: String(t.buildingUse || "근린생활"),
            floors: parseInt(t.floor || "5", 10),
          };
        });
      }
    } catch (err) {
      console.warn("Comparable Transactions API failed, falling back to mock:", err);
    }
  }

  // DETERMINISTIC MOCK DATA FOR DEVELOPMENT
  // 강남구(11680)와 기타 지역 구분
  const isTeheran = sigunguCd === "11680";
  
  if (isTeheran) {
    return [
      {
        address: "서울특별시 강남구 역삼동 824-2",
        dealYear: 2025,
        dealMonth: 8,
        dealDay: 12,
        dealAmount: 38500000000,
        area: 2450,
        pricePerSqm: 15714285,
        pricePerPyeong: 51948051,
        buildingUse: "업무시설",
        floors: 8,
      },
      {
        address: "서울특별시 강남구 역삼동 736-4",
        dealYear: 2025,
        dealMonth: 6,
        dealDay: 24,
        dealAmount: 29000000000,
        area: 1820,
        pricePerSqm: 15934065,
        pricePerPyeong: 52674311,
        buildingUse: "근린생활시설",
        floors: 6,
      },
      {
        address: "서울특별시 강남구 삼성동 143-12",
        dealYear: 2025,
        dealMonth: 5,
        dealDay: 30,
        dealAmount: 42000000000,
        area: 2750,
        pricePerSqm: 15272727,
        pricePerPyeong: 50487012,
        buildingUse: "업무시설",
        floors: 9,
      },
    ];
  } else {
    return [
      {
        address: "서울특별시 서초구 서초동 1308-4",
        dealYear: 2025,
        dealMonth: 9,
        dealDay: 15,
        dealAmount: 18500000000,
        area: 1250,
        pricePerSqm: 14800000,
        pricePerPyeong: 48925586,
        buildingUse: "근린생활시설",
        floors: 5,
      },
      {
        address: "서울특별시 서초구 서초동 1321-2",
        dealYear: 2025,
        dealMonth: 7,
        dealDay: 11,
        dealAmount: 22000000000,
        area: 1500,
        pricePerSqm: 14666666,
        pricePerPyeong: 48484814,
        buildingUse: "업무시설",
        floors: 6,
      },
    ];
  }
}
