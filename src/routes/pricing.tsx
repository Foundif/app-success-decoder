import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, X, Loader2, Sparkles, ArrowLeft, ShieldCheck, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import {
  listPlans,
  createOrder,
  verifyPayment,
  getBillingStatus,
} from "@/lib/billing.functions";
import { formatINR } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { SecondaryShell } from "@/components/side-nav";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — TillTask" },
      {
        name: "description",
        content:
          "Simple per-user INR pricing for TillTask — Starter, Growth, Scale and Enterprise plans.",
      },
    ],
  }),
  component: PricingPage,
});

declare global {
  interface Window {
    Razorpay: any;
  }
}

type Plan = {
  id: string;
  name: string;
  price_inr: number;
  price_inr_yearly: number | null;
  max_staff: number | null;
  features: Record<string, any>;
  sort_order: number;
  contact_only: boolean | null;
  per_user: boolean | null;
};

const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    "Up to 10 team members",
    "Time tracking & attendance",
    "Screenshots & screen clips",
    "Idle & offline alerts",
    "Basic reports",
  ],
  growth: [
    "Everything in Starter",
    "Up to 50 team members",
    "Payroll with INR salary",
    "Advanced reports & exports",
    "Audit log & project tracking",
  ],
  scale: [
    "Everything in Growth",
    "Up to 200 team members",
    "API access",
    "Priority support",
  ],
  enterprise: [
    "Unlimited team members",
    "Dedicated account manager",
    "Custom SLA & billing",
  ],
};

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function PricingPage() {
  const navigate = useNavigate();
  const { user, profile, companyId, isAdmin } = useAuth();
  const fetchPlans = useServerFn(listPlans);
  const order = useServerFn(createOrder);
  const verify = useServerFn(verifyPayment);
  const status = useServerFn(getBillingStatus);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [billing, setBilling] = useState<Awaited<ReturnType<typeof status>> | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [seats, setSeats] = useState<number>(1);

  useEffect(() => {
    fetchPlans().then((r) => setPlans(r.plans as Plan[]));
    if (user) status().then(setBilling).catch(() => {});
  }, [user]);

  // Seats default to 1 — admin can adjust. (Auto-count was misleading when
  // the company had old/test profiles around.)


  function priceFor(p: Plan) {
    if (p.contact_only) return null;
    return cycle === "yearly" ? p.price_inr_yearly ?? p.price_inr * 12 : p.price_inr;
  }

  async function subscribe(p: Plan) {
    if (p.contact_only) {
      window.location.href = `mailto:sales@tilltask.com?subject=TillTask Enterprise enquiry`;
      return;
    }
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (!companyId) {
      toast.error("Set up your company first");
      navigate({ to: "/onboarding" });
      return;
    }
    if (!isAdmin) {
      toast.error("Only company admins can subscribe");
      return;
    }
    setBusyId(p.id);
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error("Failed to load Razorpay");
      const o = await order({
        data: { planId: p.id, companyId, billingCycle: cycle, seats },
      });
      const rzp = new window.Razorpay({
        key: o.keyId,
        amount: o.amount,
        currency: o.currency,
        name: "TillTask",
        description: `${p.name} · ${cycle} · ${seats} user${seats === 1 ? "" : "s"}`,
        order_id: o.orderId,
        prefill: {
          name: profile?.full_name ?? "",
          email: profile?.email ?? user.email ?? "",
          contact: profile?.phone ?? "",
        },
        theme: { color: "#F26B2A" },
        handler: async (resp: any) => {
          try {
            await verify({
              data: {
                companyId,
                planId: p.id,
                billingCycle: cycle,
                seats,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              },
            });
            toast.success(`${p.name} activated`);
            const fresh = await status();
            setBilling(fresh);
          } catch (e) {
            toast.error((e as Error).message);
          }
        },
        modal: { ondismiss: () => setBusyId(null) },
      });
      rzp.open();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const featureRows = useMemo(
    () => [
      { key: "tracking", label: "Employee time tracking", always: true },
      { key: "alerts", label: "Activity monitoring" },
      { key: "screenshot", label: "Screenshots", special: "screenshots" },
      { key: "attendance", label: "Attendance management", always: true },
      { key: "web_app_tracking", label: "Web & App tracking" },
      { key: "reports", label: "Productivity Reports", special: "reports" },
      { key: "team_dashboard", label: "Team Dashboard", always: true },
      { key: "export", label: "Export Reports" },
      { key: "projects", label: "Project Tracking" },
      { key: "payroll", label: "Payroll Reports" },
      { key: "api", label: "API Access" },
      { key: "priority_support", label: "Priority Support" },
      { key: "dedicated_am", label: "Dedicated Account Manager" },
    ],
    [],
  );

  function cellFor(p: Plan, row: (typeof featureRows)[number]) {
    if (row.always) return <Check className="w-4 h-4 text-success mx-auto" />;
    if (row.special === "screenshots") {
      const mins = p.features?.screenshot_interval_minutes;
      if (p.id === "scale" || p.id === "enterprise") return "Custom";
      if (!mins) return <X className="w-4 h-4 text-muted-foreground/50 mx-auto" />;
      return `Every ${mins} min`;
    }
    if (row.special === "reports") {
      if (p.id === "enterprise") return "Custom";
      if (p.features?.reports_advanced) return "Advanced";
      if (p.features?.reports_basic) return "Basic";
      return <X className="w-4 h-4 text-muted-foreground/50 mx-auto" />;
    }
    const v = p.features?.[
      row.key === "tracking"
        ? "tracking"
        : row.key === "web_app_tracking"
          ? "web_app_tracking"
          : row.key
    ];
    return v ? (
      <Check className="w-4 h-4 text-success mx-auto" />
    ) : (
      <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
    );
  }

  return (
    <SecondaryShell active="pricing">
      <div className="min-h-screen bg-background">
        <header className="border-b hidden lg:block">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Back to dashboard
            </Link>
            {billing && (
              <div className="text-xs px-3 py-1.5 rounded-full bg-muted font-medium">
                {billing.status === "active"
                  ? `${billing.plan?.toUpperCase()} · renews in ${billing.daysLeft}d`
                  : billing.status === "trial" && billing.isActive
                    ? `Trial · ${billing.daysLeft} day${billing.daysLeft === 1 ? "" : "s"} left`
                    : "No active plan"}
              </div>
            )}
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Pay per active user · INR
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Plans that scale with your team
            </h1>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base">
              Every plan includes attendance, screen recording and audit log. Cancel anytime.
            </p>
          </div>

          {/* Cycle toggle + seats */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <div className="inline-flex rounded-full bg-muted p-1 text-sm font-medium">
              <button
                onClick={() => setCycle("monthly")}
                className={`px-4 py-1.5 rounded-full transition ${
                  cycle === "monthly" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setCycle("yearly")}
                className={`px-4 py-1.5 rounded-full transition flex items-center gap-1.5 ${
                  cycle === "yearly" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                Yearly
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                  -20%
                </span>
              </button>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Users:</span>
                <input
                  type="number"
                  min={1}
                  value={seats}
                  onChange={(e) =>
                    setSeats(Math.max(1, Math.min(500, Number(e.target.value) || 1)))
                  }
                  className="w-20 h-9 rounded-md border bg-background px-3 text-sm"
                />
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((p) => {
              const isCurrent = billing?.plan === p.id && billing.isActive;
              const isHighlight = p.id === "growth";
              const unit = priceFor(p);
              const cap = p.max_staff ?? Infinity;
              const overCap = seats > cap;
              const effectiveSeats = Math.min(seats, cap === Infinity ? seats : cap);
              const total = unit != null ? unit * effectiveSeats : null;
              return (
                <Card
                  key={p.id}
                  className={`p-5 flex flex-col relative ${
                    isHighlight ? "border-primary shadow-lg ring-1 ring-primary/30" : ""
                  }`}
                >
                  {isHighlight && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-wider uppercase text-primary-foreground bg-primary px-2.5 py-0.5 rounded-full">
                      Most popular
                    </div>
                  )}
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <p className="text-xs text-muted-foreground min-h-[2.5em]">
                    {p.id === "starter" && "For small teams getting started"}
                    {p.id === "growth" && "Best for growing companies"}
                    {p.id === "scale" && "For larger teams"}
                    {p.id === "enterprise" && "100+ employees · custom"}
                  </p>
                  <div className="mt-3 flex items-baseline gap-1 min-h-[3rem]">
                    {p.contact_only ? (
                      <span className="text-3xl font-bold">Custom</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold">{formatINR(unit ?? 0)}</span>
                        <span className="text-xs text-muted-foreground">
                          /user/{cycle === "monthly" ? "mo" : "yr"}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.max_staff ? `Up to ${p.max_staff} staff` : "Unlimited staff"}
                  </p>
                  {!p.contact_only && total != null && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {overCap ? (
                        <span className="text-destructive">
                          Exceeds {p.max_staff} staff cap — choose a higher plan
                        </span>
                      ) : (
                        <>
                          {effectiveSeats} user{effectiveSeats === 1 ? "" : "s"} ={" "}
                          <strong className="text-foreground">{formatINR(total)}</strong>/
                          {cycle === "monthly" ? "mo" : "yr"}
                        </>
                      )}
                    </p>
                  )}
                  <Button
                    className="mt-4 w-full"
                    variant={isHighlight ? "default" : "outline"}
                    disabled={busyId === p.id || isCurrent || overCap}
                    onClick={() => subscribe(p)}
                  >
                    {busyId === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrent ? (
                      "Current plan"
                    ) : p.contact_only ? (
                      <>
                        <Mail className="w-4 h-4" /> Contact sales
                      </>
                    ) : (
                      `Subscribe`
                    )}
                  </Button>
                  <ul className="mt-5 space-y-2 text-sm">
                    {(PLAN_FEATURES[p.id] ?? []).map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>


          {/* Feature comparison */}
          {plans.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold mb-4">Compare features</h2>
              <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead className="bg-muted/40 text-xs">
                      <tr>
                        <th className="text-left p-3 font-semibold">Features</th>
                        {plans.map((p) => (
                          <th key={p.id} className="p-3 font-semibold text-center">
                            {p.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {featureRows.map((row) => (
                        <tr key={row.key} className="border-t">
                          <td className="p-3 text-sm">{row.label}</td>
                          {plans.map((p) => (
                            <td key={p.id} className="p-3 text-xs text-center">
                              {cellFor(p, row)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          <div className="mt-10 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-success" />
            Secured by Razorpay · GST invoices · Cancel anytime
          </div>
        </main>
      </div>
    </SecondaryShell>
  );
}
