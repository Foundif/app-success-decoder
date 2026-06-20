import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const body = await request.text();
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) return new Response("Not configured", { status: 500 });

        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const sig = Buffer.from(signature);
        const exp = Buffer.from(expected);
        if (sig.length !== exp.length || !timingSafeEqual(sig, exp)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const event = JSON.parse(body) as {
          event: string;
          payload: Record<string, { entity: any }>;
        };

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (event.event === "payment.captured") {
          const p = event.payload.payment.entity;
          const companyId = p.notes?.company_id as string | undefined;
          const planId = p.notes?.plan_id as string | undefined;
          if (companyId && planId) {
            const periodEnd = new Date();
            periodEnd.setMonth(periodEnd.getMonth() + 1);
            await supabaseAdmin
              .from("companies")
              .update({
                plan: planId,
                subscription_status: "active",
                current_period_end: periodEnd.toISOString(),
              })
              .eq("id", companyId);
            await supabaseAdmin.from("payments").upsert(
              {
                company_id: companyId,
                razorpay_payment_id: p.id,
                razorpay_order_id: p.order_id,
                amount_inr: Math.round(p.amount / 100),
                status: "captured",
                method: p.method ?? "razorpay",
                raw: p,
              },
              { onConflict: "razorpay_payment_id" },
            );
          }
        }

        return new Response("ok");
      },
    },
  },
});
