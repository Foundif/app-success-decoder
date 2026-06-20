import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Loader2, Sparkles, ArrowLeft, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { listPlans, createOrder, verifyPayment, getBillingStatus } from "@/lib/billing.functions";
import { formatINR } from "@/lib/format";
import { SecondaryShell } from "@/components/side-nav";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — TillTask" },
      {
        name: "description",
        content: "Simple INR pricing for TillTask — Starter, Growth, and Business plans.",
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
  max_staff: number | null;
  features: Record<string, boolean>;
  sort_order: number;
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

  useEffect(() => {
    fetchPlans().then((r) => setPlans(r.plans as Plan[]));
    if (user) status().then(setBilling).catch(() => {});
  }, [user]);

  async function subscribe(plan: Plan) {
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
    setBusyId(plan.id);
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error("Failed to load Razorpay");
      const o = await order({ data: { planId: plan.id, companyId } });
      const rzp = new window.Razorpay({
        key: o.keyId,
        amount: o.amount,
        currency: o.currency,
        name: "TillTask",
        description: `${plan.name} plan — monthly`,
        order_id: o.orderId,
        prefill: {
          name: profile?.full_name ?? "",
          email: profile?.email ?? user.email ?? "",
          contact: profile?.phone ?? "",
        },
        theme: { color: "#0F172A" },
        handler: async (resp: any) => {
          try {
            await verify({
              data: {
                companyId,
                planId: plan.id,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              },
            });
            toast.success(`${plan.name} activated`);
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

  return (
    <SecondaryShell active="pricing">
    <div className="min-h-screen bg-background">
      <header className="border-b">

        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          {billing && (
            <div className="text-xs px-3 py-1.5 rounded-full bg-muted">
              {billing.status === "active"
                ? `${billing.plan?.toUpperCase()} · renews in ${billing.daysLeft}d`
                : billing.status === "trial" && billing.isActive
                  ? `Trial · ${billing.daysLeft} day${billing.daysLeft === 1 ? "" : "s"} left`
                  : "No active plan"}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Simple INR pricing
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Pick a plan that grows with your team
          </h1>
          <p className="text-muted-foreground mt-3 text-sm sm:text-base">
            Every plan includes attendance, screen recording, and audit log. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((p) => {
            const isCurrent = billing?.plan === p.id && billing.isActive;
            const isHighlight = p.id === "growth";
            return (
              <Card
                key={p.id}
                className={`p-6 flex flex-col ${
                  isHighlight ? "border-primary shadow-lg ring-1 ring-primary/30" : ""
                }`}
              >
                {isHighlight && (
                  <div className="text-[10px] font-bold tracking-wider uppercase text-primary mb-2">
                    Most popular
                  </div>
                )}
                <h3 className="text-lg font-bold">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{formatINR(p.price_inr)}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.max_staff ? `Up to ${p.max_staff} staff` : "Unlimited staff"}
                </p>
                <ul className="mt-5 space-y-2.5 text-sm flex-1">
                  <FeatureRow text="Attendance & time tracking" on />
                  <FeatureRow text="Screen recording (1 fps + clips)" on={!!p.features.recording} />
                  <FeatureRow text="Activity alerts" on={!!p.features.alerts} />
                  <FeatureRow text="On-demand video clips" on={!!p.features.clips} />
                  <FeatureRow text="Payroll automation" on={!!p.features.payroll} />
                  <FeatureRow text="Full audit log" on={!!p.features.audit} />
                  <FeatureRow
                    text="Priority support"
                    on={!!p.features.priority_support}
                  />
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={isHighlight ? "default" : "outline"}
                  disabled={busyId === p.id || isCurrent}
                  onClick={() => subscribe(p)}
                >
                  {busyId === p.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrent ? (
                    "Current plan"
                  ) : (
                    `Subscribe — ${formatINR(p.price_inr)}/mo`
                  )}
                </Button>
              </Card>
            );
          })}
        </div>

        <div className="mt-10 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-success" />
          Secured by Razorpay · GST invoices · No setup fee
        </div>
      </main>
    </div>
    </SecondaryShell>
  );
}

function FeatureRow({ text, on }: { text: string; on: boolean }) {
  return (
    <li className={`flex items-start gap-2 ${on ? "" : "opacity-40"}`}>
      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${on ? "text-success" : ""}`} />
      <span>{text}</span>
    </li>
  );
}
