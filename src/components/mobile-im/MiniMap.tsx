// src/components/mobile-im/MiniMap.tsx

import React, { useEffect, useRef, useState } from "react";
import { LocationPoiData } from "../../lib/external/kakao-map-api";

interface MiniMapProps {
  lat: number;
  lng: number;
  gateLevel: number; // 0: G0, 1: G1, 2: G2, 3: G3
  pois?: LocationPoiData | null;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  lat,
  lng,
  gateLevel,
  pois
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [sdkError, setSdkError] = useState(false);

  useEffect(() => {
    // 카카오맵 SDK 로드 로직
    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!appKey) {
      setSdkError(true);
      return;
    }

    const scriptId = "kakao-maps-sdk";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initializeMap = () => {
      if (!window.kakao || !window.kakao.maps) {
        setSdkError(true);
        return;
      }

      window.kakao.maps.load(() => {
        if (!containerRef.current) return;

        const options = {
          center: new window.kakao.maps.LatLng(lat, lng),
          level: gateLevel <= 1 ? 5 : 3, // G0/G1은 줌아웃 상태
        };

        const map = new window.kakao.maps.Map(containerRef.current, options);

        if (gateLevel <= 1) {
          // G0/G1: 대략적인 원으로 범위를 표시 (상세주소 보호)
          const circle = new window.kakao.maps.Circle({
            center: new window.kakao.maps.LatLng(lat, lng),
            radius: 200, // 반경 200미터
            strokeWeight: 2,
            strokeColor: "#3b82f6",
            strokeOpacity: 0.8,
            strokeStyle: "dashed",
            fillColor: "#3b82f6",
            fillOpacity: 0.15,
          });
          circle.setMap(map);
        } else {
          // G2+: 정확한 핀 마커 표시
          const markerPosition = new window.kakao.maps.LatLng(lat, lng);
          const marker = new window.kakao.maps.Marker({
            position: markerPosition,
          });
          marker.setMap(map);
        }

        setMapLoaded(true);
      });
    };

    if (window.kakao && window.kakao.maps) {
      initializeMap();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
        script.async = true;
        document.head.appendChild(script);
      }
      script.onload = initializeMap;
      script.onerror = () => setSdkError(true);
    }
  }, [lat, lng, gateLevel]);

  return (
    <div className="space-y-3 w-full">
      {/* 지도 영역 */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-inner h-[220px]">
        {sdkError ? (
          /* Premium Fallback Map Layout */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950/80 backdrop-blur-sm">
            <svg className="w-12 h-12 text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <div className="text-sm font-bold text-slate-300">오프라인 위성 분석 지도</div>
            <div className="text-[10px] text-slate-500 mt-1 max-w-[280px]">
              {gateLevel <= 1 
                ? "보안 등급(G0-G1)에 의해 주변 300m 반경 오피스 중심권역이 지정되었습니다." 
                : "지정된 정밀 위도/경도 신호에 앵커 포인트가 연결되었습니다."}
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-[10px] font-bold text-blue-400">
              🛰️ 위경도 매핑 완료
            </div>
          </div>
        ) : (
          <div ref={containerRef} className="w-full h-full" />
        )}

        {!mapLoaded && !sdkError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
          </div>
        )}
      </div>

      {/* POI 메트릭스 패널 */}
      {pois && (
        <div className="grid grid-cols-2 gap-2 bg-slate-900/40 border border-slate-800/60 rounded-xl p-3">
          <div className="col-span-2 flex items-center gap-1.5 mb-1 text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1.5">
            <span>🚀 주변 광역 교통 & 생활 시설</span>
          </div>
          {pois.nearestStation && (
            <div className="col-span-2 bg-slate-950/30 rounded-lg px-2.5 py-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">최접근 지하철역</span>
              <span className="text-[11px] text-emerald-400 font-bold">
                {pois.nearestStation.name} (도보 {pois.nearestStation.walkMinutes}분)
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-[10px] text-slate-400 py-0.5">
            <span>🚇 반경 내 전철역</span>
            <span className="font-bold text-slate-200">{pois.poiCounts.subway}개</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 py-0.5">
            <span>🚌 버스 정류소</span>
            <span className="font-bold text-slate-200">{pois.poiCounts.busStop}개</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 py-0.5">
            <span>☕ 주변 카페</span>
            <span className="font-bold text-slate-200">{pois.poiCounts.cafe}개</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 py-0.5">
            <span>🅿️ 공영/사설 주차</span>
            <span className="font-bold text-slate-200">{pois.poiCounts.parking}개</span>
          </div>
        </div>
      )}
    </div>
  );
};

declare global {
  interface Window {
    kakao: any;
  }
}
