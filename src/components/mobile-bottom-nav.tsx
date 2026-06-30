import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { usePlan } from "@/lib/usePlan";
import { visibleNav, setPendingTab, type AppTab } from "@/lib/nav-items";

/**
 * Bottom nav for mobile. Shows up to 5 primary items based on role + plan.
 * Tapping a home-tab item stores the tab in sessionStorage and navigates to /.
 */
export function MobileBottomNav({ activeTab }: { activeTab?: AppTab } = {}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { primaryRole } = useAuth();
  const plan = usePlan();

  const all = visibleNav(primaryRole, plan);
  // 6 slots: Home, Team, Screens, Payroll, Reports, Profile. Pricing lives in the side drawer.
  const items = all.filter((i) => i.id !== "pricing").slice(0, 6);

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-card border-t z-20 lg:hidden">
      <div
        className="max-w-screen-xl mx-auto grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}
      >
        {items.map((it) => {
          const Icon = it.icon;
          const isHome = it.to === "/";
          const active =
            (isHome && pathname === "/" && (activeTab ?? "home") === it.id) ||
            (!isHome && pathname === it.to);
          return (
            <button
              key={it.id}
              onClick={() => {
                if (it.tab) setPendingTab(it.tab);
                navigate({ to: it.to });
              }}
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
