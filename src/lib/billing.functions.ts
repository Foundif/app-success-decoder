import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RZP_BASE = "https://api.razorpay.com/v1";

function authHeader() {
  const id = process.env.RAZORPAY_KEY_ID!;
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

// Public — list plans
export const listPlans = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("plans")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return { plans: data ?? [] };
});

// Auth — create a Razorpay order for the chosen plan (one-month payment).
// We use one-time orders (not subscriptions) for simplicity & guaranteed live-mode support.
export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      planId: z.string().min(1),
      companyId: z.string().uuid(),
      billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
      seats: z.number().int().min(1).max(2000).default(1),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: isAdmin } = await supabaseAdmin.rpc("is_company_admin", {
      _user_id: context.userId,
      _company_id: data.companyId,
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("id", data.planId)
      .single();
    if (!plan) throw new Error("Plan not found");
    if (plan.contact_only) throw new Error("Enterprise plans require contacting sales");

    const unitInr =
      data.billingCycle === "yearly"
        ? plan.price_inr_yearly ?? plan.price_inr * 12
        : plan.price_inr;
    const totalInr = unitInr * data.seats;
    const amountPaise = totalInr * 100;
    const receipt = `c_${data.companyId.slice(0, 8)}_${Date.now()}`;

    const r = await fetch(`${RZP_BASE}/orders`, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt,
        notes: {
          company_id: data.companyId,
          plan_id: data.planId,
          user_id: context.userId,
          billing_cycle: data.billingCycle,
          seats: String(data.seats),
        },
      }),
    });
    if (!r.ok) {
      const txt = await r.text();
      throw new Error("Razorpay order failed: " + txt);
    }
    const order = (await r.json()) as { id: string; amount: number; currency: string };

    await supabaseAdmin.from("subscriptions").insert({
      company_id: data.companyId,
      plan_id: data.planId,
      amount_inr: totalInr,
      status: "created",
      billing_cycle: data.billingCycle,
      seats: data.seats,
      raw: { razorpay_order_id: order.id },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID!,
      planName: plan.name,
      totalInr,
    };
  });

// Auth — verify signature client-returned from Razorpay Checkout, then mark active.
export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      companyId: z.string().uuid(),
      planId: z.string(),
      billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
      seats: z.number().int().min(1).max(2000).default(1),
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { createHmac } = await import("crypto");
    const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");
    if (expected !== data.razorpay_signature) throw new Error("Invalid signature");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await supabaseAdmin.rpc("is_company_admin", {
      _user_id: context.userId,
      _company_id: data.companyId,
    });
    if (!isAdmin) throw new Error("Forbidden");

    const periodEnd = new Date();
    if (data.billingCycle === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("price_inr,price_inr_yearly")
      .eq("id", data.planId)
      .single();
    const unit =
      data.billingCycle === "yearly"
        ? plan?.price_inr_yearly ?? (plan?.price_inr ?? 0) * 12
        : plan?.price_inr ?? 0;
    const total = unit * data.seats;


    await supabaseAdmin
      .from("companies")
      .update({
        plan: data.planId,
        subscription_status: "active",
        current_period_end: periodEnd.toISOString(),
      })
      .eq("id", data.companyId);

    await supabaseAdmin.from("payments").insert({
      company_id: data.companyId,
      razorpay_payment_id: data.razorpay_payment_id,
      razorpay_order_id: data.razorpay_order_id,
      amount_inr: total,
      status: "captured",
      method: "razorpay",
    });

    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .eq("company_id", data.companyId)
      .eq("plan_id", data.planId)
      .eq("status", "created");

    await supabaseAdmin.from("audit_logs").insert({
      company_id: data.companyId,
      actor_id: context.userId,
      action: "billing.subscription_activated",
      entity_type: "subscription",
      metadata: { plan: data.planId, payment_id: data.razorpay_payment_id },
    });

    return { ok: true, periodEnd: periodEnd.toISOString() };
  });

// Auth — fetch company billing status
export const getBillingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: prof } = await supabase
      .from("profiles").select("company_id").eq("id", userId).maybeSingle();
    if (!prof?.company_id)
      return {
        companyId: null,
        companyName: null,
        plan: null,
        status: null,
        trialEndsAt: null,
        currentPeriodEnd: null,
        isActive: false,
        isReadonly: true,
        daysLeft: 0,
      };
    const { data: c } = await supabase
      .from("companies")
      .select("id,name,plan,subscription_status,trial_ends_at,current_period_end")
      .eq("id", prof.company_id)
      .single();
    if (!c) return { companyId: prof.company_id, companyName: null, plan: null, status: null, trialEndsAt: null, currentPeriodEnd: null, isActive: false, isReadonly: true, daysLeft: 0 };
    const now = Date.now();
    const trialEnd = c.trial_ends_at ? new Date(c.trial_ends_at).getTime() : 0;
    const periodEnd = c.current_period_end ? new Date(c.current_period_end).getTime() : 0;
    const isActive =
      (c.subscription_status === "active" && (!periodEnd || periodEnd > now)) ||
      (c.subscription_status === "trial" && trialEnd > now);
    return {
      companyId: c.id,
      companyName: c.name,
      plan: c.plan,
      status: c.subscription_status,
      trialEndsAt: c.trial_ends_at,
      currentPeriodEnd: c.current_period_end,
      isActive,
      isReadonly: !isActive,
      daysLeft: Math.max(
        0,
        Math.ceil(((isActive ? Math.max(trialEnd, periodEnd) : 0) - now) / 86400000),
      ),
    };
  });
