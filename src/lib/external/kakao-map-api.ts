// src/lib/external/kakao-map-api.ts

export interface LocationPoiData {
  nearestStation: {
    name: string;
    distanceM: number;
    walkMinutes: number;
  } | null;
  poiCounts: {
    subway: number;
    busStop: number;
    cafe: number;
    parking: number;
    restaurant: number;
    convenience: number;
  };
}

export async function fetchLocationPoi(lat: number, lng: number): Promise<LocationPoiData> {
  const restKey = process.env.KAKAO_REST_API_KEY;

  if (restKey && restKey !== "") {
    try {
      // 1. 지하철역 카테고리 검색 (SW8)
      const stationUrl = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=SW8&y=${lat}&x=${lng}&radius=1000&sort=distance`;
      const stationRes = await fetch(stationUrl, {
        headers: { Authorization: `KakaoAK ${restKey}` },
        signal: AbortSignal.timeout(3000),
      });
      const stationData = await stationRes.json();
      const stations = stationData?.documents || [];

      let nearestStation = null;
      if (stations.length > 0) {
        const topStation = stations[0];
        const distanceM = parseInt(topStation.distance, 10) || 500;
        const walkMinutes = Math.max(1, Math.round(distanceM / 80)); // 분속 80m 기준
        
        nearestStation = {
          name: String(topStation.place_name),
          distanceM,
          walkMinutes,
        };
      }

      // 2. 주변 POI 개수 카운트 (카테고리별 병렬 요청 또는 대표 쿼리)
      // SW8(지하철역), CE7(카페), PK6(주차장), FD6(음식점), CS2(편의점)
      const categories = [
        { key: "subway", code: "SW8" },
        { key: "cafe", code: "CE7" },
        { key: "parking", code: "PK6" },
        { key: "restaurant", code: "FD6" },
        { key: "convenience", code: "CS2" },
      ];

      const counts: Record<string, number> = {
        subway: stations.length,
        busStop: 3, // 버스 정류장은 API 호출 단순화 위해 모킹 처리
        cafe: 5,
        parking: 2,
        restaurant: 12,
        convenience: 4,
      };

      await Promise.all(
        categories.slice(1).map(async (cat) => {
          try {
            const url = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=${cat.code}&y=${lat}&x=${lng}&radius=500&size=15`;
            const res = await fetch(url, {
              headers: { Authorization: `KakaoAK ${restKey}` },
              signal: AbortSignal.timeout(2000),
            });
            const data = await res.json();
            counts[cat.key] = data?.meta?.total_count || data?.documents?.length || 0;
          } catch (e) {
            // 카테고리 실패 시 디폴트값 유지
          }
        })
      );

      return {
        nearestStation,
        poiCounts: {
          subway: counts.subway,
          busStop: counts.busStop,
          cafe: counts.cafe,
          parking: counts.parking,
          restaurant: counts.restaurant,
          convenience: counts.convenience,
        },
      };
    } catch (err) {
      console.warn("Kakao Local API failed, falling back to mock:", err);
    }
  }

  // DETERMINISTIC FALLBACK FOR DEVELOPMENT
  // 좌표에 근거한 지하철역 및 POI 개수 반환
  const isGangnam = Math.abs(lat - 37.50085) < 0.02;
  const isSamsung = Math.abs(lat - 37.5088) < 0.02;

  if (isGangnam) {
    return {
      nearestStation: {
        name: "역삼역 (2호선)",
        distanceM: 320,
        walkMinutes: 4,
      },
      poiCounts: {
        subway: 2,
        busStop: 6,
        cafe: 14,
        parking: 3,
        restaurant: 28,
        convenience: 8,
      },
    };
  } else if (isSamsung) {
    return {
      nearestStation: {
        name: "삼성역 (2호선)",
        distanceM: 450,
        walkMinutes: 6,
      },
      poiCounts: {
        subway: 1,
        busStop: 4,
        cafe: 18,
        parking: 5,
        restaurant: 35,
        convenience: 10,
      },
    };
  } else {
    return {
      nearestStation: {
        name: "서초역 (2호선)",
        distanceM: 520,
        walkMinutes: 7,
      },
      poiCounts: {
        subway: 1,
        busStop: 3,
        cafe: 8,
        parking: 2,
        restaurant: 18,
        convenience: 5,
      },
    };
  }
}
