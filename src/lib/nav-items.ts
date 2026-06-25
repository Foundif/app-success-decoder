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
  /** route target — home tabs go to `/` with a search param */
  to: "/" | "/profile" | "/pricing";
  /** search param when navigating to "/" */
  search?: { tab?: string };
  allow: AppRole[];
  gate?: (plan: PlanFeatures) => boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Dashboard", icon: LayoutDashboard, to: "/", allow: ["super_admin", "company_admin", "employee"] },
  { id: "team", label: "Team", icon: Users, to: "/", search: { tab: "team" }, allow: ["super_admin", "company_admin"] },
  { id: "screens", label: "Screens", icon: Camera, to: "/", search: { tab: "screens" }, allow: ["super_admin", "company_admin", "employee"] },
  { id: "payroll", label: "Payroll", icon: DollarSign, to: "/", search: { tab: "payroll" }, allow: ["super_admin", "company_admin", "employee"], gate: (p) => p.payroll },
  { id: "reports", label: "Reports", icon: BarChart3, to: "/", search: { tab: "reports" }, allow: ["super_admin", "company_admin"], gate: (p) => p.advancedReports },
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
