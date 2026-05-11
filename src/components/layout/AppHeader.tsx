"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FolderOpen, ShieldCheck, BarChart3, Briefcase,
  Building2, Menu, LogOut, ChevronDown, Star
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

// ─── Nav Link ─────────────────────────────────────────────────────────
function NavLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  admin:     "bg-violet-950/80 text-violet-300 border-violet-800/50",
  reviewer:  "bg-amber-950/80 text-amber-300 border-amber-800/50",
  im_editor: "bg-blue-950/80 text-blue-300 border-blue-800/50",
  expert:    "bg-emerald-950/80 text-emerald-300 border-emerald-800/50",
  broker:    "bg-cyan-950/80 text-cyan-300 border-cyan-800/50",
  unknown:   "bg-muted text-muted-foreground border-border",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin", reviewer: "Reviewer", im_editor: "IM Editor",
  expert: "Expert", broker: "Broker", unknown: "Guest",
};

// ─── Simple Dropdown ─────────────────────────────────────────────────
function UserDropdown() {
  const { user, role, loading, isAdmin, isReviewer, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (loading) return <div className="h-7 w-28 rounded-md bg-muted animate-pulse" />;
  if (!user) {
    return (
      <Button asChild size="sm">
        <Link href="/login">로그인</Link>
      </Button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/50 transition-colors text-sm"
      >
        <span className={cn(
          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
          ROLE_COLORS[role]
        )}>
          {ROLE_LABELS[role]}
        </span>
        <span className="text-xs text-muted-foreground max-w-[100px] truncate hidden sm:block">
          {user.email?.split("@")[0] ?? "User"}
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden">
          {/* User info */}
          <div className="px-3 py-3 border-b border-border">
            <p className="text-xs font-semibold text-foreground truncate">{user.email}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{ROLE_LABELS[role]}</p>
          </div>
          {/* Links */}
          <div className="p-1">
            {isAdmin && (
              <>
                <Link
                  href="/admin/analytics"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                  Analytics
                </Link>
                <Link
                  href="/admin/golden-candidates"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  <Star className="h-3.5 w-3.5 text-muted-foreground" />
                  Golden Candidates
                </Link>
                <div className="my-1 border-t border-border" />
              </>
            )}
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors w-full text-left"
            >
              <LogOut className="h-3.5 w-3.5" />
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AppHeader ────────────────────────────────────────────────────────
export function AppHeader() {
  const pathname = usePathname();
  const { isAdmin, isReviewer } = useAuth();
  const isActive = (href: string) => pathname?.startsWith(href) ?? false;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-sm text-foreground hidden sm:block">JS Full IM Studio</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1 flex-1 px-4">
          <NavLink href="/im-projects" icon={<FolderOpen className="h-3.5 w-3.5" />} label="IM 프로젝트" active={isActive("/im-projects")} />
          <NavLink href="/expert/assignments" icon={<Briefcase className="h-3.5 w-3.5" />} label="전문가 배정" active={isActive("/expert")} />
          {isReviewer && (
            <NavLink href="/reviewer/gate-reviews" icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Gate 검토" active={isActive("/reviewer")} />
          )}
          {isAdmin && (
            <NavLink href="/admin" icon={<BarChart3 className="h-3.5 w-3.5" />} label="Admin" active={isActive("/admin")} />
          )}
        </nav>

        {/* Right: User */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <UserDropdown />
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
