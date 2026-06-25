import {
  LayoutDashboard,
  Users,
  Camera,
  DollarSign,
  BarChart3,
  UserCircle,
  Tag,
} from "lucide-react";
import type { AppRole } from "@/lib/auth-context";
import type { PlanFeatures } from "@/lib/usePlan";

export type AppTab = "home" | "team" | "screens" | "payroll" | "reports" | "profile" | "pricing";

export type NavItem = {
  id: AppTab;
  label: string;
  icon: React.ElementType;
  /** route target */
  to: "/" | "/profile" | "/pricing";
  /** tab to activate inside the home shell when `to === "/"` */
  tab?: "home" | "team" | "screens" | "payroll" | "reports";
  allow: AppRole[];
  gate?: (plan: PlanFeatures) => boolean;
};

const STORAGE_KEY = "tilltask:active-tab";

export function setPendingTab(tab: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, tab);
  } catch {}
}

export function consumePendingTab(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.sessionStorage.getItem(STORAGE_KEY);
    if (v) window.sessionStorage.removeItem(STORAGE_KEY);
    return v;
  } catch {
    return null;
  }
}

export const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Dashboard", icon: LayoutDashboard, to: "/", tab: "home", allow: ["super_admin", "company_admin", "employee"] },
  { id: "team", label: "Team", icon: Users, to: "/", tab: "team", allow: ["super_admin", "company_admin"] },
  { id: "screens", label: "Screens", icon: Camera, to: "/", tab: "screens", allow: ["super_admin", "company_admin", "employee"] },
  { id: "payroll", label: "Payroll", icon: DollarSign, to: "/", tab: "payroll", allow: ["super_admin", "company_admin", "employee"], gate: (p) => p.payroll },
  { id: "reports", label: "Reports", icon: BarChart3, to: "/", tab: "reports", allow: ["super_admin", "company_admin"], gate: (p) => p.advancedReports },
  { id: "profile", label: "Profile", icon: UserCircle, to: "/profile", allow: ["super_admin", "company_admin", "employee"] },
  { id: "pricing", label: "Pricing", icon: Tag, to: "/pricing", allow: ["super_admin", "company_admin"] },
];

export function visibleNav(role: AppRole | null, plan: PlanFeatures): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter(
    (i) => i.allow.includes(role) && (!i.gate || i.gate(plan)),
  );
}

export function planDisplay(plan: PlanFeatures): { label: string; sublabel: string } {
  if (plan.status === "trial" && plan.isActive) {
    return { label: "Free Trial", sublabel: `${plan.daysLeft} day${plan.daysLeft === 1 ? "" : "s"} left` };
  }
  if (plan.tier && plan.isActive) {
    return {
      label: plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1),
      sublabel: plan.daysLeft ? `Renews in ${plan.daysLeft}d` : "Active",
    };
  }
  return { label: "Free", sublabel: "Upgrade to unlock" };
}
