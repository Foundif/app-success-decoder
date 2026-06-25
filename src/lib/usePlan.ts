import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBillingStatus } from "@/lib/billing.functions";
import { useAuth } from "@/lib/auth-context";

export type PlanTier = "starter" | "growth" | "scale" | "enterprise" | null;

export type PlanFeatures = {
  tier: PlanTier;
  staffLimit: number; // 0 = unlimited
  payroll: boolean;
  auditLog: boolean;
  advancedReports: boolean;
  recording: boolean;
  alerts: boolean;
  exportReports: boolean;
  projectTracking: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  readonly: boolean;
  isActive: boolean;
  status: string | null;
  daysLeft: number;
};

type BaseFeatures = Omit<PlanFeatures, "tier" | "readonly" | "isActive" | "status" | "daysLeft">;

const MATRIX: Record<string, BaseFeatures> = {
  starter: {
    staffLimit: 10,
    payroll: false,
    auditLog: false,
    advancedReports: false,
    recording: true,
    alerts: true,
    exportReports: false,
    projectTracking: false,
    apiAccess: false,
    prioritySupport: false,
  },
  growth: {
    staffLimit: 50,
    payroll: true,
    auditLog: true,
    advancedReports: true,
    recording: true,
    alerts: true,
    exportReports: true,
    projectTracking: true,
    apiAccess: false,
    prioritySupport: false,
  },
  scale: {
    staffLimit: 200,
    payroll: true,
    auditLog: true,
    advancedReports: true,
    recording: true,
    alerts: true,
    exportReports: true,
    projectTracking: true,
    apiAccess: true,
    prioritySupport: true,
  },
  enterprise: {
    staffLimit: 0,
    payroll: true,
    auditLog: true,
    advancedReports: true,
    recording: true,
    alerts: true,
    exportReports: true,
    projectTracking: true,
    apiAccess: true,
    prioritySupport: true,
  },
};

// Trial users get Growth-level features so they can evaluate the product.
const TRIAL_DEFAULT = MATRIX.growth;

export function usePlan(): PlanFeatures {
  const { user } = useAuth();
  const fetchStatus = useServerFn(getBillingStatus);
  const { data } = useQuery({
    enabled: !!user,
    queryKey: ["billing-status"],
    queryFn: () => fetchStatus(),
    staleTime: 60_000,
  });

  const tier = (data?.plan as PlanTier) ?? null;
  const isTrial = data?.status === "trial" && data?.isActive;
  const base = tier && MATRIX[tier] ? MATRIX[tier] : isTrial ? TRIAL_DEFAULT : MATRIX.starter;
  return {
    tier,
    ...base,
    readonly: !!data?.isReadonly,
    isActive: !!data?.isActive,
    status: data?.status ?? null,
    daysLeft: data?.daysLeft ?? 0,
  };
}
