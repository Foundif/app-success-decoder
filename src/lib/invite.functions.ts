import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Resolve a code to either an employee invite or a company-wide code.
async function resolveCode(code: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const trimmed = code.trim().toUpperCase();

  // 1) Per-employee invite_codes row
  const { data: invite } = await supabaseAdmin
    .from("invite_codes")
    .select("id, company_id, intended_name, intended_email, job_title, used_at")
    .eq("code", trimmed)
    .maybeSingle();

  if (invite) {
    if (invite.used_at) return { kind: "used" as const };
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("id, name")
      .eq("id", invite.company_id)
      .single();
    return {
      kind: "employee" as const,
      invite,
      company: company!,
    };
  }

  // 2) Company-wide companies.invite_code
  const { data: company } = await supabaseAdmin
    .from("companies")
    .select("id, name")
    .eq("invite_code", trimmed)
    .maybeSingle();
  if (company) return { kind: "company" as const, company };

  return { kind: "none" as const };
}

export const lookupInviteCode = createServerFn({ method: "POST" })
  .inputValidator(z.object({ code: z.string().min(4).max(30) }).parse)
  .handler(async ({ data }) => {
    const res = await resolveCode(data.code);
    if (res.kind === "none") return { valid: false as const };
    if (res.kind === "used") return { valid: false as const, reason: "already_used" };
    if (res.kind === "employee") {
      return {
        valid: true as const,
        type: "employee" as const,
        companyId: res.company.id,
        companyName: res.company.name,
        intendedName: res.invite.intended_name,
        intendedEmail: res.invite.intended_email,
        jobTitle: res.invite.job_title,
      };
    }
    return {
      valid: true as const,
      type: "company" as const,
      companyId: res.company.id,
      companyName: res.company.name,
      intendedName: null as string | null,
      intendedEmail: null as string | null,
      jobTitle: null as string | null,
    };
  });

export const joinWithInviteCode = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      code: z.string().min(4).max(30),
      email: z.string().email(),
      password: z.string().min(8).max(72),
      fullName: z.string().min(1).max(120),
      phone: z.string().max(20).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const res = await resolveCode(data.code);
    if (res.kind === "none") throw new Error("Invalid invite code.");
    if (res.kind === "used") throw new Error("This invite code has already been used.");

    const companyId = res.company.id;
    const jobTitle = res.kind === "employee" ? res.invite.job_title : null;

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName, phone: data.phone ?? null },
    });
    if (createErr || !created.user) throw new Error(createErr?.message ?? "Could not create user.");
    const newUserId = created.user.id;

    await supabaseAdmin.from("profiles").upsert({
      id: newUserId,
      company_id: companyId,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone ?? null,
      job_title: jobTitle,
      currency: "INR",
    });
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role: "employee", company_id: companyId });

    if (res.kind === "employee") {
      await supabaseAdmin
        .from("invite_codes")
        .update({ used_by: newUserId, used_at: new Date().toISOString() })
        .eq("id", res.invite.id);
    }

    await supabaseAdmin.from("audit_logs").insert({
      company_id: companyId,
      actor_id: newUserId,
      target_user_id: newUserId,
      action: "staff.joined_via_invite",
      entity_type: res.kind === "employee" ? "invite_code" : "company",
      entity_id: res.kind === "employee" ? res.invite.id : companyId,
      metadata: { code: data.code.trim().toUpperCase(), via: res.kind },
    });

    return { ok: true, companyId };
  });
