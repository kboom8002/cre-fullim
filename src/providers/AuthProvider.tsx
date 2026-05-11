"use client";
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// ─── Types ───────────────────────────────────────────────────────────
export type UserRole = "admin" | "reviewer" | "im_editor" | "expert" | "broker" | "unknown";

interface AuthState {
  user: User | null;
  role: UserRole;
  loading: boolean;
  isAdmin: boolean;
  isReviewer: boolean;
  isExpert: boolean;
  isBroker: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  role: "unknown",
  loading: true,
  isAdmin: false,
  isReviewer: false,
  isExpert: false,
  isBroker: false,
  signOut: async () => {},
});

function deriveRole(user: User | null): UserRole {
  if (!user) return "unknown";
  const meta = user.app_metadata ?? {};
  const role = meta.role as UserRole;
  if (role) return role;
  // Dev fallback: check user_metadata
  const uRole = user.user_metadata?.role as UserRole;
  if (uRole) return uRole;
  return "broker";
}

// ─── Provider ────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>("unknown");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    // Initial session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setRole(deriveRole(data.user ?? null));
      setLoading(false);
    });
    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setRole(deriveRole(session?.user ?? null));
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  }, []);

  const value: AuthState = {
    user,
    role,
    loading,
    isAdmin: role === "admin",
    isReviewer: role === "admin" || role === "reviewer",
    isExpert: role === "expert",
    isBroker: role === "broker",
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────
export function useAuth() {
  return useContext(AuthContext);
}
