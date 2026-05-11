"use client";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import {
  FolderOpen, Users, Star, BarChart3, ShieldCheck,
  ArrowRight, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/admin/projects",
    icon: <FolderOpen className="h-5 w-5" />,
    label: "전체 프로젝트",
    desc: "모든 IM 프로젝트 현황 조회",
    roles: ["admin"],
    color: "text-blue-400 border-blue-800/30 bg-blue-950/20 hover:bg-blue-950/40",
  },
  {
    href: "/admin/experts",
    icon: <Users className="h-5 w-5" />,
    label: "전문가 배정",
    desc: "Expert Assignment 관리",
    roles: ["admin"],
    color: "text-violet-400 border-violet-800/30 bg-violet-950/20 hover:bg-violet-950/40",
  },
  {
    href: "/admin/golden-candidates",
    icon: <Star className="h-5 w-5" />,
    label: "Golden Dataset",
    desc: "학습 데이터 후보 승인/반려",
    roles: ["admin", "reviewer"],
    color: "text-amber-400 border-amber-800/30 bg-amber-950/20 hover:bg-amber-950/40",
  },
  {
    href: "/admin/analytics",
    icon: <BarChart3 className="h-5 w-5" />,
    label: "Analytics",
    desc: "퍼널·이벤트·Safety 분석",
    roles: ["admin"],
    color: "text-emerald-400 border-emerald-800/30 bg-emerald-950/20 hover:bg-emerald-950/40",
  },
  {
    href: "/reviewer/gate-reviews",
    icon: <ShieldCheck className="h-5 w-5" />,
    label: "Gate 검토 큐",
    desc: "Buyer-ready 승인 대기 프로젝트",
    roles: ["admin", "reviewer"],
    color: "text-cyan-400 border-cyan-800/30 bg-cyan-950/20 hover:bg-cyan-950/40",
  },
];

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  reviewer: "Reviewer",
  im_editor: "IM Editor",
  expert: "Expert",
  broker: "Broker",
  unknown: "Guest",
};

export default function AdminHomePage() {
  const { role, user } = useAuth();

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(role));
  const lockedItems = NAV_ITEMS.filter(item => !item.roles.includes(role));

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black text-foreground">Admin Console</h1>
          <span className={cn(
            "rounded-full border px-3 py-1 text-xs font-bold",
            role === "admin" ? "border-violet-800/50 bg-violet-950/50 text-violet-300" :
            role === "reviewer" ? "border-amber-800/50 bg-amber-950/50 text-amber-300" :
            "border-border bg-muted text-muted-foreground"
          )}>
            {ROLE_LABEL[role]}
          </span>
        </div>
        {user && (
          <p className="text-sm text-muted-foreground">{user.email}</p>
        )}
      </div>

      {/* Main navigation grid */}
      {visibleItems.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">관리 메뉴</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleItems.map(item => (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "group rounded-xl border p-5 transition-all cursor-pointer",
                  item.color
                )}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/40">
                      {item.icon}
                    </div>
                    <ArrowRight className="h-4 w-4 opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="font-bold text-sm">{item.label}</p>
                  <p className="text-[11px] opacity-70 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Locked items */}
      {lockedItems.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">접근 제한 메뉴</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lockedItems.map(item => (
              <div key={item.href} className="rounded-xl border border-border bg-muted/20 p-5 opacity-40 cursor-not-allowed">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <p className="font-bold text-sm text-muted-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {item.roles.join(", ")} 역할 필요
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">빠른 이동</p>
        <div className="flex flex-wrap gap-3">
          {[
            { href: "/im-projects", label: "내 IM 프로젝트 목록" },
            { href: "/expert/assignments", label: "전문가 배정 내 작업" },
          ].map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              {l.label} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
