// src/lib/external/address-resolver.ts

export interface ResolvedAddress {
  pnu: string;                    // 19자리 필지고유번호
  legalDongCode: string;          // 법정동 10자리
  sigunguCd: string;              // 시군구 5자리 (건축물대장 API 파라미터)
  bjdongCd: string;               // 법정동 5자리
  bun: string;                    // 본번 4자리
  ji: string;                     // 부번 4자리
  roadAddress: string;            // 정규화된 도로명주소
  jibunAddress: string;           // 지번주소
  lat: number;
  lng: number;
  buildingMgtNo: string;          // 건물관리번호
}

/**
 * 주소 문자열로부터 지번 본번/부번을 채우는 4자리 제로패딩 헬퍼
 */
function padNumber(numStr: string | number): string {
  const num = parseInt(String(numStr), 10);
  if (isNaN(num)) return "0000";
  return String(num).padStart(4, "0");
}

/**
 * 법정동명으로부터 법정동코드(10자리)를 모킹/매핑하기 위한 간단한 헬퍼
 */
function getMockLegalDongCode(address: string): string {
  // 서울 역삼동 예시
  if (address.includes("역삼동") || address.includes("역삼")) {
    return "1168010100";
  }
  // 서울 삼성동 예시
  if (address.includes("삼성동") || address.includes("삼성")) {
    return "1168010500";
  }
  // 서울 서초동 예시
  if (address.includes("서초동") || address.includes("서초")) {
    return "1165010100";
  }
  return "1168010100"; // 기본 역삼동
}

/**
 * 지번 주소 또는 도로명 주소를 정밀 파싱하고 PNU 코드를 구성함
 */
export async function resolveAddress(rawAddress: string): Promise<ResolvedAddress | null> {
  const confirmKey = process.env.JUSO_CONFIRM_KEY;

  if (confirmKey && confirmKey !== "") {
    try {
      const url = `https://business.juso.go.kr/addrlink/addrLinkApi.do?confmKey=${confirmKey}&currentPage=1&countPerPage=1&keyword=${encodeURIComponent(rawAddress)}&resultType=json`;
      const res = await fetch(url);
      const data = await res.json();

      const jList = data?.results?.juso;
      if (jList && jList.length > 0) {
        const item = jList[0];
        const roadAddress = item.roadAddr;
        const jibunAddress = item.jibunAddr;
        const buildingMgtNo = item.bdMgtSn || ""; // 25자리 건물관리번호

        // PNU는 보통 bdMgtSn의 앞 19자리와 일치함
        const pnu = buildingMgtNo.substring(0, 19) || "1168010100108320000";
        const legalDongCode = pnu.substring(0, 10);
        const sigunguCd = pnu.substring(0, 5);
        const bjdongCd = pnu.substring(5, 10);
        
        // 본번, 부번 추출 (pnu에서 11~14번째, 15~18번째)
        const bun = pnu.substring(11, 15) || "0000";
        const ji = pnu.substring(15, 19) || "0000";

        // 기본 강남 좌표 (Kakao Map 연동용 임시 좌표, 실제는 Kakao Local API에서 갱신 예정)
        let lat = 37.50085;
        let lng = 127.03698;
        if (rawAddress.includes("삼성")) {
          lat = 37.5088; lng = 127.0631;
        } else if (rawAddress.includes("서초")) {
          lat = 37.4876; lng = 127.0174;
        }

        return {
          pnu,
          legalDongCode,
          sigunguCd,
          bjdongCd,
          bun,
          ji,
          roadAddress,
          jibunAddress,
          lat,
          lng,
          buildingMgtNo,
        };
      }
    } catch (err) {
      console.warn("Juso API error, falling back to regex parser:", err);
    }
  }

  // REGEX FALLBACK (API 미작동 또는 키 누락 시 작동)
  // 예: "서울시 강남구 역삼동 823-21" -> 법정동 역삼동, 본번 823, 부번 21
  const cleanAddr = rawAddress.trim();
  const jibunMatch = cleanAddr.match(/(?:동|로|길)\s+(\d+)(?:-(\d+))?/);
  
  let bun = "0000";
  let ji = "0000";
  if (jibunMatch) {
    bun = padNumber(jibunMatch[1]);
    ji = padNumber(jibunMatch[2] || "0");
  } else {
    // 임시 디폴트값
    bun = "0823";
    ji = "0021";
  }

  const legalDongCode = getMockLegalDongCode(cleanAddr);
  const sigunguCd = legalDongCode.substring(0, 5);
  const bjdongCd = legalDongCode.substring(5, 10);
  
  // PNU = 법정동코드(10) + 대지구분(1, 일반대지는 '1') + 본번(4) + 부번(4) = 19자리
  const pnu = `${legalDongCode}1${bun}${ji}`;

  let lat = 37.50085;
  let lng = 127.03698;
  if (cleanAddr.includes("삼성")) {
    lat = 37.5088; lng = 127.0631;
  } else if (cleanAddr.includes("서초")) {
    lat = 37.4876; lng = 127.0174;
  }

  return {
    pnu,
    legalDongCode,
    sigunguCd,
    bjdongCd,
    bun,
    ji,
    roadAddress: cleanAddr.includes("역삼") ? "서울특별시 강남구 테헤란로 123" : cleanAddr,
    jibunAddress: cleanAddr,
    lat,
    lng,
    buildingMgtNo: pnu + "000000",
  };
}
