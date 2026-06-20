import { useNavigate } from "@tanstack/react-router";
import {
  Briefcase,
  LayoutDashboard,
  DollarSign,
  UserCircle,
  LogOut,
  Crown,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePlan } from "@/lib/usePlan";

type Item = { label: string; icon: React.ElementType; to: string; adminOnly?: boolean };

export function SideNav({ active }: { active: "home" | "pricing" | "profile" | null }) {
  const navigate = useNavigate();
  const { profile, signOut, primaryRole } = useAuth();
  const plan = usePlan();
  const isAdmin = primaryRole !== "employee" && primaryRole !== null;
  const roleLabel = isAdmin ? "Business Operations" : "Team Member";

  const items: Item[] = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/" },
    { label: "Profile", icon: UserCircle, to: "/profile" },
    { label: "Pricing", icon: DollarSign, to: "/pricing", adminOnly: true },
  ];
  const visible = items.filter((i) => !i.adminOnly || isAdmin);

  return (
    <aside className="hidden lg:flex w-72 shrink-0 border-r bg-card flex-col sticky top-0 h-screen">
      <div className="flex items-center gap-3 px-5 py-5 border-b">
        <div className="w-11 h-11 rounded-2xl bg-foreground flex items-center justify-center shadow-sm">
          <Briefcase className="w-5 h-5 text-background" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-lg leading-tight truncate">TillTask</div>
          <div className="text-[10px] tracking-widest uppercase text-muted-foreground font-semibold truncate">
            {roleLabel}
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visible.map((it) => {
          const Icon = it.icon;
          const isActive =
            (it.to === "/" && active === "home") ||
            (it.to === "/pricing" && active === "pricing") ||
            (it.to === "/profile" && active === "profile");
          return (
            <button
              key={it.to}
              onClick={() => navigate({ to: it.to })}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{it.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t space-y-3">
        {isAdmin && (
          <div className="rounded-2xl border bg-muted/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Crown className="w-4 h-4 text-primary" />
                <span className="capitalize">{plan.tier ?? (plan.status === "trial" ? "Trial" : "Free")}</span>
              </div>
              {plan.status === "trial" && (
                <span className="text-[10px] text-muted-foreground font-medium">
                  {plan.daysLeft}d left
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate">{profile?.email}</div>
            {(plan.readonly || !plan.tier) && (
              <button
                onClick={() => navigate({ to: "/pricing" })}
                className="w-full flex items-center justify-center gap-1.5 bg-foreground text-background rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition"
              >
                <Sparkles className="w-4 h-4" /> Upgrade to Pro
              </button>
            )}
          </div>
        )}
        <button
          onClick={async () => {
            await signOut();
            navigate({ to: "/auth" });
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border bg-card hover:bg-muted transition"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}

export function SecondaryShell({
  active,
  children,
}: {
  active: "pricing" | "profile";
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex">
      <SideNav active={active} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
