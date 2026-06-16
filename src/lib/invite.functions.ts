import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public: look up invite code (returns company name + intended name)
export const lookupInviteCode = createServerFn({ method: "POST" })
  .inputValidator(z.object({ code: z.string().min(4).max(30) }).parse)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invite } = await supabaseAdmin
      .from("invite_codes")
      .select("id, company_id, intended_name, intended_email, job_title, used_at")
      .eq("code", data.code.trim().toUpperCase())
      .maybeSingle();
    if (!invite) return { valid: false as const };
    if (invite.used_at) return { valid: false as const, reason: "already_used" };
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("id, name")
      .eq("id", invite.company_id)
      .single();
    return {
      valid: true as const,
      inviteId: invite.id,
      companyId: invite.company_id,
      companyName: company?.name,
      intendedName: invite.intended_name,
      intendedEmail: invite.intended_email,
      jobTitle: invite.job_title,
    };
  });

// Public: redeem invite code and create staff account
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
    const code = data.code.trim().toUpperCase();

    const { data: invite } = await supabaseAdmin
      .from("invite_codes")
      .select("id, company_id, used_at, job_title, intended_name")
      .eq("code", code)
      .maybeSingle();
    if (!invite) throw new Error("Invalid invite code.");
    if (invite.used_at) throw new Error("This invite code has already been used.");

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
      company_id: invite.company_id,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone ?? null,
      job_title: invite.job_title,
    });
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role: "employee", company_id: invite.company_id });
    await supabaseAdmin
      .from("invite_codes")
      .update({ used_by: newUserId, used_at: new Date().toISOString() })
      .eq("id", invite.id);
    await supabaseAdmin.from("audit_logs").insert({
      company_id: invite.company_id,
      actor_id: newUserId,
      target_user_id: newUserId,
      action: "staff.joined_via_invite",
      entity_type: "invite_code",
      entity_id: invite.id,
      metadata: { code },
    });

    return { ok: true, companyId: invite.company_id };
  });
