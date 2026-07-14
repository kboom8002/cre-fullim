// src/lib/external/building-register-api.ts

export interface BuildingRegisterData {
  totalArea: number;          // 연면적 (sqm)
  platArea: number;           // 대지면적 (sqm)
  useAprDay: string;          // 사용승인일 (YYYYMMDD)
  mainPurpose: string;        // 주용도 (예: 업무시설, 근린생활시설)
  structure: string;          // 구조 (예: 철근콘크리트구조)
  floorsAbove: number;        // 지상층수
  floorsBelow: number;        // 지하층수
  bcRat: number;              // 건폐율 (%)
  vlRat: number;              // 용적률 (%)
  buildingName?: string;      // 건물명
}

export async function fetchBuildingRegister(
  sigunguCd: string,
  bjdongCd: string,
  bun: string,
  ji: string
): Promise<BuildingRegisterData | null> {
  const apiKey = process.env.DATA_GO_KR_API_KEY;

  if (apiKey && apiKey !== "") {
    try {
      // 국토교통부 건축물대장 표제부 조회 API
      const url = `http://apis.data.go.kr/1613000/BldRgstService_v2/getBrTitleInfo?ServiceKey=${apiKey}&sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}&bun=${bun}&ji=${ji}&numOfRows=1&pageNo=1&_type=json`;
      
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
          totalArea: parseFloat(targetItem.totArea || "0"),
          platArea: parseFloat(targetItem.platArea || "0"),
          useAprDay: String(targetItem.useAprDay || "20150601"),
          mainPurpose: String(targetItem.mainPurpsCdNm || "업무시설"),
          structure: String(targetItem.strctCdNm || "철근콘크리트구조"),
          floorsAbove: parseInt(targetItem.grndFlrCnt || "0", 10),
          floorsBelow: parseInt(targetItem.ugrndFlrCnt || "0", 10),
          bcRat: parseFloat(targetItem.bcRat || "0"),
          vlRat: parseFloat(targetItem.vlRat || "0"),
          buildingName: targetItem.bldNm || "",
        };
      }
    } catch (err) {
      console.warn("Building Register API request failed, falling back to simulation:", err);
    }
  }

  // DETERMINISTIC FALLBACK FOR DEVELOPMENT
  // 입력 번호 기반으로 일관성 있는 임의의 값 생성 (seed)
  const seed = parseInt(bun + ji, 10) || 1234;
  const isLarge = seed % 2 === 0;
  
  return {
    totalArea: isLarge ? 4850.5 : 1850.2,
    platArea: isLarge ? 550.8 : 280.5,
    useAprDay: isLarge ? "20180425" : "20121015",
    mainPurpose: isLarge ? "업무시설 (사무소)" : "근린생활시설",
    structure: "철근콘크리트조",
    floorsAbove: isLarge ? 10 : 5,
    floorsBelow: isLarge ? 3 : 1,
    bcRat: isLarge ? 58.4 : 59.8,
    vlRat: isLarge ? 598.2 : 249.5,
    buildingName: isLarge ? "강남 센트럴타워" : "테헤란 팰리스",
  };
}
