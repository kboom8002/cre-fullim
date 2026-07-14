// src/app/api/og/mobile-im/[slug]/route.ts

import { ImageResponse } from "next/og";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "edge";

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const slug = params.slug;
  let title = "모바일 투자설명서";
  let area = "서울 핵심 권역";
  let price = "가격 협의";
  let yieldStr = "약 4.2~4.8%";

  try {
    const supabase = createServiceClient();
    const { data: project } = await supabase
      .from("mobile_im_projects")
      .select("title, key_metrics")
      .eq("slug", slug)
      .maybeSingle();

    if (project) {
      title = project.title || title;
      area = project.key_metrics?.area_signal || area;
      price = project.key_metrics?.price_band || price;
      
      const yVal = project.key_metrics?.estimated_yield_pct;
      yieldStr = yVal ? `약 ${yVal}%` : yieldStr;
    }
  } catch (e) {
    console.error("Failed to query DB for OG Image data:", e);
  }

  // Draw premium HTML content
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          background: "linear-gradient(135deg, #0f172a 0%, #020617 100%)",
          fontFamily: "sans-serif",
          color: "#f8fafc",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow Effects */}
        <div
          style={{
            position: "absolute",
            top: "-150px",
            right: "-150px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0) 70%)",
          }}
        />

        {/* Top Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#60a5fa",
                background: "rgba(96, 165, 250, 0.15)",
                border: "1px solid rgba(96, 165, 250, 0.3)",
                borderRadius: "30px",
                padding: "4px 16px",
                letterSpacing: "2px",
              }}
            >
              PREMIUM INVESTMENT TEASER
            </span>
          </div>
          <span
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              color: "#64748b",
            }}
          >
            JS부동산중개 • Mobile IM Studio
          </span>
        </div>

        {/* Main Body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "20px",
            maxWidth: "900px",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#94a3b8",
            }}
          >
            📍 {area}
          </div>
          <h2
            style={{
              fontSize: "52px",
              fontWeight: "black",
              color: "#ffffff",
              lineHeight: "1.2",
              margin: 0,
              letterSpacing: "-1px",
            }}
          >
            {title}
          </h2>
        </div>

        {/* Bottom Metrics Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #1e293b",
            paddingTop: "32px",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "60px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold" }}>희망 가격대</span>
              <span style={{ fontSize: "28px", color: "#fbbf24", fontWeight: "black" }}>{price}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold" }}>예상 연수익률</span>
              <span style={{ fontSize: "28px", color: "#34d399", fontWeight: "black" }}>{yieldStr}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold" }}>공공데이터 연동</span>
              <span style={{ fontSize: "28px", color: "#60a5fa", fontWeight: "black" }}>정밀 보강 완료</span>
            </div>
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#ef4444",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              padding: "6px 14px",
              borderRadius: "8px",
              fontWeight: "bold",
            }}
          >
            ⚠️ STRICTLY CONFIDENTIAL
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
