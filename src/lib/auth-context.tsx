import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "company_admin" | "employee";

export type AppProfile = {
  id: string;
  company_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  avatar_url: string | null;
};

export type AuthState = {
  loading: boolean;
  identityLoading: boolean;
  session: Session | null;
  user: User | null;
  profile: AppProfile | null;
  roles: AppRole[];
  companyId: string | null;
  primaryRole: AppRole | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isEmployee: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [identityLoading, setIdentityLoading] = useState(true);

  async function loadIdentity(u: User | null) {
    if (!u) {
      setProfile(null);
      setRoles([]);
      setIdentityLoading(false);
      return;
    }
    setIdentityLoading(true);
    const [{ data: prof }, { data: rs }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", u.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", u.id),
    ]);
    setProfile((prof as AppProfile) ?? null);
    setRoles(((rs ?? []) as { role: AppRole }[]).map((r) => r.role));
    setIdentityLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) setIdentityLoading(true);
      setTimeout(() => loadIdentity(s?.user ?? null), 0);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      await loadIdentity(data.session?.user ?? null);
      setLoading(false);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const primaryRole: AppRole | null = roles.includes("super_admin")
    ? "super_admin"
    : roles.includes("company_admin")
      ? "company_admin"
      : roles.includes("employee")
        ? "employee"
        : null;

  const value: AuthState = {
    loading,
    identityLoading,
    session,
    user,
    profile,
    roles,
    companyId: profile?.company_id ?? null,
    primaryRole,
    isSuperAdmin: primaryRole === "super_admin",
    isAdmin: primaryRole === "company_admin" || primaryRole === "super_admin",
    isEmployee: primaryRole === "employee",
    refresh: () => loadIdentity(user),
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
