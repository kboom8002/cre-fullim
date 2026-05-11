import Link from "next/link";
import { Building2, ArrowRight, Shield, Zap, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JS Full IM Studio — 전문 부동산 IM 플랫폼",
  description: "AI 기반 부동산 투자각서(IM) 생성 및 전문가 협업 플랫폼",
};

const FEATURES = [
  {
    icon: <Zap className="h-5 w-5 text-blue-400" />,
    title: "AI 초안 생성",
    desc: "18개 표준 섹션을 AI가 자동 작성. 리스크 바운더리와 공시 가이드가 내장되어 있습니다.",
  },
  {
    icon: <Users className="h-5 w-5 text-violet-400" />,
    title: "전문가 협업",
    desc: "세무사, CRE 컨설턴트, 감정평가사가 전문 영역에서 검토·패치합니다.",
  },
  {
    icon: <Shield className="h-5 w-5 text-emerald-400" />,
    title: "Gate 검토",
    desc: "8개 Gate로 P0 공시 위반을 차단. Buyer-ready 승인 전 모든 리스크를 검증합니다.",
  },
  {
    icon: <FileText className="h-5 w-5 text-amber-400" />,
    title: "다형식 내보내기",
    desc: "Markdown, PDF, PPTX, Web IM 등 다양한 형식으로 Buyer-ready 문서를 내보냅니다.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center im-gradient-bg">
        {/* Glow orb */}
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-3xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <Building2 className="h-3.5 w-3.5" />
            Pilot Ready — CRE Full IM Studio
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-tight">
            전문가 수준의{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400">
              투자각서(IM)
            </span>
            를 <br className="hidden md:block" />AI와 함께 작성하세요
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            핸드오프 데이터에서 Buyer-ready Full IM까지. AI 초안 + 전문가 검토 + Gate 승인의 
            단계별 워크플로우로 안전하고 신뢰할 수 있는 문서를 생성합니다.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 px-8 text-base font-semibold im-glow-primary">
              <Link href="/im-projects">
                IM 프로젝트 시작 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base border-border">
              <Link href="/im-projects/import">
                핸드오프 가져오기
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground mb-10">
            핵심 기능
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-sm text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Steps */}
      <section className="px-4 py-16 border-t border-border bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground mb-10">
            워크플로우
          </p>
          <div className="flex flex-wrap justify-center items-center gap-2 text-sm">
            {[
              "핸드오프 임포트", "준비도 검토", "B-SSoT 구성",
              "18-섹션 아웃라인", "AI 초안 생성", "전문가 패치",
              "Gate 검토", "Buyer-ready 내보내기"
            ].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{i + 1}</span>
                  <span className="text-xs font-medium text-foreground">{step}</span>
                </div>
                {i < 7 && <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
