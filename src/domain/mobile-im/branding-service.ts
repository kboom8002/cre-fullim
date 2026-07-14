// src/domain/mobile-im/branding-service.ts

export interface BrokerBranding {
  primaryColor: string;       // HEX 또는 HSL
  secondaryColor: string;
  logoUrl: string;
  companyName: string;
  contactPhone: string;
  contactEmail: string;
  disclaimerOverride?: string;
}

/**
 * 브로커 회사 고유 브랜딩 에셋 프로필 로드
 */
export function getBrokerBranding(brokerId: string): BrokerBranding {
  // 예시 매핑 (디폴트 및 특정 제휴사 매핑)
  const brandingProfiles: Record<string, BrokerBranding> = {
    "js-realty": {
      primaryColor: "#3b82f6", // 블루
      secondaryColor: "#1e3a8a",
      logoUrl: "/images/logos/js-realty.png",
      companyName: "JS부동산중개법인",
      contactPhone: "02-555-1234",
      contactEmail: "deal@jsrealty.co.kr",
    },
    "cre-capital": {
      primaryColor: "#10b981", // 에메랄드
      secondaryColor: "#065f46",
      logoUrl: "/images/logos/cre-capital.png",
      companyName: "CRE캐피탈 파트너스",
      contactPhone: "02-777-9900",
      contactEmail: "capital@crepartners.com",
    }
  };

  return brandingProfiles[brokerId] || brandingProfiles["js-realty"];
}

/**
 * 브랜드 테마 색상 변수들을 CSS style object로 인라인 변환
 */
export function buildBrandingCssVariables(branding: BrokerBranding): React.CSSProperties {
  return {
    "--color-primary": branding.primaryColor,
    "--color-primary-dark": branding.secondaryColor,
  } as React.CSSProperties;
}
