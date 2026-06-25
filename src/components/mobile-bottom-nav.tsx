import { useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, UserCircle, DollarSign } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

/**
 * Bottom nav used by ancillary pages (Profile, Pricing) on mobile so users
 * keep one-tap access back to the main app while away from /.
 */
export function MobileBottomNav() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { primaryRole } = useAuth();
  const isAdmin = primaryRole !== "employee" && !!primaryRole;

  const items = [
    { label: "Home", icon: LayoutDashboard, to: "/" as const, match: "/" },
    ...(isAdmin
      ? [{ label: "Pricing", icon: DollarSign, to: "/pricing" as const, match: "/pricing" }]
      : []),
    { label: "Profile", icon: UserCircle, to: "/profile" as const, match: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-card border-t z-20 lg:hidden">
      <div
        className="max-w-screen-xl mx-auto grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}
      >
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.match;
          return (
            <button
              key={it.to}
              onClick={() => navigate({ to: it.to })}
              className={`flex flex-col items-center gap-1 py-3 text-xs ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {it.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
