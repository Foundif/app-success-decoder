import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBillingStatus } from "@/lib/billing.functions";
import { useAuth } from "@/lib/auth-context";

export type PlanTier = "starter" | "growth" | "business" | null;

export type PlanFeatures = {
  tier: PlanTier;
  staffLimit: number; // 0 = unlimited
  payroll: boolean;
  auditLog: boolean;
  advancedReports: boolean;
  recording: boolean;
  alerts: boolean;
  readonly: boolean;
  isActive: boolean;
  status: string | null;
  daysLeft: number;
};

const MATRIX: Record<string, Omit<PlanFeatures, "tier" | "readonly" | "isActive" | "status" | "daysLeft">> = {
  starter: {
    staffLimit: 5,
    payroll: false,
    auditLog: false,
    advancedReports: false,
    recording: true,
    alerts: true,
  },
  growth: {
    staffLimit: 25,
    payroll: true,
    auditLog: false,
    advancedReports: true,
    recording: true,
    alerts: true,
  },
  business: {
    staffLimit: 0,
    payroll: true,
    auditLog: true,
    advancedReports: true,
    recording: true,
    alerts: true,
  },
};

const TRIAL_DEFAULT = MATRIX.business; // give full features during trial

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
