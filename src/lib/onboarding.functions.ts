import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function genCode(prefix: string) {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
  return `${prefix}-${s}`;
}

// Step 1: create the company, mark current user as owner + company_admin
export const setupCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      name: z.string().min(2).max(120),
      industry: z.string().max(60).optional(),
      size: z.string().max(40).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    // Reject if user already belongs to a company
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .maybeSingle();
    if (existingProfile?.company_id) {
      throw new Error("You already belong to a company.");
    }

    const inviteCode = genCode("TILL");
    const { data: company, error } = await supabaseAdmin
      .from("companies")
      .insert({
        name: data.name,
        industry: data.industry ?? null,
        size: data.size ?? null,
        invite_code: inviteCode,
        owner_id: userId,
        onboarded: false,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("profiles").upsert({ id: userId, company_id: company.id });
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "company_admin", company_id: company.id });

    await supabaseAdmin.from("audit_logs").insert({
      company_id: company.id,
      actor_id: userId,
      action: "company.created",
      entity_type: "company",
      entity_id: company.id,
      metadata: { name: company.name },
    });

    return { company };
  });

// Step 2: generate invite codes for employees
export const generateInviteCodes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      companyId: z.string().uuid(),
      employees: z
        .array(
          z.object({
            name: z.string().min(1).max(120),
            email: z.string().email().optional().or(z.literal("")),
            jobTitle: z.string().max(80).optional(),
          }),
        )
        .min(1)
        .max(50),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: admin } = await supabaseAdmin
      .rpc("is_company_admin", { _user_id: context.userId, _company_id: data.companyId });
    if (!admin) throw new Error("Forbidden");

    // Enforce staff cap based on the company's current plan
    const { data: co } = await supabaseAdmin
      .from("companies").select("plan").eq("id", data.companyId).maybeSingle();
    const planLimits: Record<string, number> = { starter: 10, growth: 50, scale: 200, enterprise: 0 };
    // Trial / unset plan gets growth-level cap so onboarding doesn't artificially block invites.
    const limit = co?.plan ? (planLimits[co.plan] ?? 0) : 50;
    if (limit > 0) {
      const [{ count: existingStaff }, { count: pendingInvites }] = await Promise.all([
        supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("company_id", data.companyId),
        supabaseAdmin.from("invite_codes").select("id", { count: "exact", head: true }).eq("company_id", data.companyId).is("used_at", null),
      ]);
      const total = (existingStaff ?? 0) + (pendingInvites ?? 0) + data.employees.length;
      if (total > limit) {
        throw new Error(`Your plan allows up to ${limit} staff. Upgrade in Pricing to invite more.`);
      }
    }

    const rows = data.employees.map((e) => ({
      company_id: data.companyId,
      code: genCode("EMP"),
      intended_name: e.name,
      intended_email: e.email || null,
      job_title: e.jobTitle || null,
      created_by: context.userId,
    }));
    const { data: created, error } = await supabaseAdmin
      .from("invite_codes")
      .insert(rows)
      .select("*");
    if (error) throw new Error(error.message);
    return { invites: created };
  });

// Step 3: finalize onboarding
export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ companyId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: admin } = await supabaseAdmin
      .rpc("is_company_admin", { _user_id: context.userId, _company_id: data.companyId });
    if (!admin) throw new Error("Forbidden");
    const { error } = await supabaseAdmin
      .from("companies")
      .update({ onboarded: true })
      .eq("id", data.companyId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
