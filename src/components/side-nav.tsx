import { useNavigate } from "@tanstack/react-router";
import {
  Briefcase,
  LayoutDashboard,
  DollarSign,
  UserCircle,
  LogOut,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePlan } from "@/lib/usePlan";

type Item = { label: string; icon: React.ElementType; to: string; adminOnly?: boolean; gate?: boolean };

export function SideNav({ active }: { active: "home" | "pricing" | "profile" | null }) {
  const navigate = useNavigate();
  const { profile, signOut, primaryRole } = useAuth();
  const plan = usePlan();
  const isAdmin = primaryRole !== "employee" && primaryRole !== null;

  const items: Item[] = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/" },
    { label: "Profile", icon: UserCircle, to: "/profile" },
    { label: "Pricing", icon: DollarSign, to: "/pricing", adminOnly: true },
  ];
  const visible = items.filter((i) => !i.adminOnly || isAdmin);

  return (
    <aside className="hidden lg:flex w-60 shrink-0 border-r bg-card flex-col sticky top-0 h-screen">
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <Briefcase className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <div className="font-bold leading-none">TillTask</div>
          <div className="text-xs text-muted-foreground capitalize">
            {primaryRole?.replace("_", " ")}
          </div>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {it.label}
            </button>
          );
        })}
      </nav>
      <div className="p-2 border-t">
        {plan.readonly && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-[11px] font-medium">
            Trial ended — read-only
          </div>
        )}
        <div className="px-3 py-2 text-xs">
          <div className="font-medium truncate">{profile?.full_name ?? profile?.email}</div>
          <div className="text-muted-foreground truncate">{profile?.job_title ?? ""}</div>
        </div>
        <button
          onClick={async () => {
            await signOut();
            navigate({ to: "/auth" });
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted"
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
