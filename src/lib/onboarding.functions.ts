import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function genCode(prefix: string) {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";

  for (let i = 0; i < 6; i++) {
    s += alpha[Math.floor(Math.random() * alpha.length)];
  }

  return `${prefix}-${s}`;
}

// ============================================================
// STEP 1: CREATE COMPANY
// Mark current user as owner + company_admin
// ============================================================

export const setupCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z
      .object({
        name: z.string().min(2).max(120),
        industry: z.string().max(60).optional(),
        size: z.string().max(40).optional(),
      })
      .parse,
  )
  .handler(async ({ data, context }) => {
    const {
      supabaseAdmin,
    } = await import("@/integrations/supabase/client.server");

    const userId = context.userId;

    // ----------------------------------------------------------
    // 1. Verify that the authenticated user still exists
    // in Supabase auth.users
    // ----------------------------------------------------------

    const { data: authUser, error: authCheckErr } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (authCheckErr || !authUser?.user) {
      throw new Error(
        "Your session has expired. Please sign out and sign in again.",
      );
    }

    // ----------------------------------------------------------
    // 2. Check whether the user already belongs to a company
    // ----------------------------------------------------------

    const { data: existingProfile, error: profileCheckError } =
      await supabaseAdmin
        .from("profiles")
        .select("company_id")
        .eq("id", userId)
        .maybeSingle();

    if (profileCheckError) {
      throw new Error(profileCheckError.message);
    }

    if (existingProfile?.company_id) {
      throw new Error("You already belong to a company.");
    }

    // ----------------------------------------------------------
    // 3. Generate unique company invite code
    // ----------------------------------------------------------

    const inviteCode = genCode("TILL");

    // ----------------------------------------------------------
    // 4. Create company
    // ----------------------------------------------------------

    const { data: company, error: companyError } = await supabaseAdmin
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

    if (companyError) {
      throw new Error(companyError.message);
    }

    if (!company) {
      throw new Error("Failed to create company.");
    }

    // ----------------------------------------------------------
    // 5. Attach user to company
    // ----------------------------------------------------------

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          company_id: company.id,
        },
        {
          onConflict: "id",
        },
      );

    if (profileError) {
      // Roll back company if profile update fails
      await supabaseAdmin
        .from("companies")
        .delete()
        .eq("id", company.id);

      throw new Error(profileError.message);
    }

    // ----------------------------------------------------------
    // 6. Give user company_admin role
    // ----------------------------------------------------------

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "company_admin",
        company_id: company.id,
      });

    if (roleError) {
      // Clean up if role creation fails
      await supabaseAdmin
        .from("profiles")
        .update({ company_id: null })
        .eq("id", userId);

      await supabaseAdmin
        .from("companies")
        .delete()
        .eq("id", company.id);

      throw new Error(roleError.message);
    }

    // ----------------------------------------------------------
    // 7. Create audit log
    // ----------------------------------------------------------

    const { error: auditError } = await supabaseAdmin
      .from("audit_logs")
      .insert({
        company_id: company.id,
        actor_id: userId,
        action: "company.created",
        entity_type: "company",
        entity_id: company.id,
        metadata: {
          name: company.name,
        },
      });

    if (auditError) {
      // Audit failure should not destroy a successfully created
      // company, so we don't roll back here.
      console.error("Failed to create audit log:", auditError.message);
    }

    return {
      company,
    };
  });

// ============================================================
// STEP 2: GENERATE EMPLOYEE INVITE CODES
// ============================================================

export const generateInviteCodes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z
      .object({
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
      })
      .parse,
  )
  .handler(async ({ data, context }) => {
    const {
      supabaseAdmin,
    } = await import("@/integrations/supabase/client.server");

    // ----------------------------------------------------------
    // 1. Verify user is company admin
    // ----------------------------------------------------------

    const { data: admin, error: adminError } = await supabaseAdmin.rpc(
      "is_company_admin",
      {
        _user_id: context.userId,
        _company_id: data.companyId,
      },
    );

    if (adminError) {
      throw new Error(adminError.message);
    }

    if (!admin) {
      throw new Error("Forbidden");
    }

    // ----------------------------------------------------------
    // 2. Get company plan
    // ----------------------------------------------------------

    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("plan")
      .eq("id", data.companyId)
      .maybeSingle();

    if (companyError) {
      throw new Error(companyError.message);
    }

    // ----------------------------------------------------------
    // 3. Staff limits
    // ----------------------------------------------------------

    const planLimits: Record<string, number> = {
      starter: 10,
      growth: 50,
      scale: 200,
      enterprise: 0,
    };

    // Trial / unset plan gets growth-level cap
    const limit = company?.plan
      ? (planLimits[company.plan] ?? 0)
      : 50;

    // ----------------------------------------------------------
    // 4. Check existing staff + pending invites
    // ----------------------------------------------------------

    if (limit > 0) {
      const [{ count: existingStaff }, { count: pendingInvites }] =
        await Promise.all([
          supabaseAdmin
            .from("profiles")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("company_id", data.companyId),

          supabaseAdmin
            .from("invite_codes")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("company_id", data.companyId)
            .is("used_at", null),
        ]);

      const total =
        (existingStaff ?? 0) +
        (pendingInvites ?? 0) +
        data.employees.length;

      if (total > limit) {
        throw new Error(
          `Your plan allows up to ${limit} staff. Upgrade in Pricing to invite more.`,
        );
      }
    }

    // ----------------------------------------------------------
    // 5. Generate invite codes
    // ----------------------------------------------------------

    const rows = data.employees.map((employee) => ({
      company_id: data.companyId,
      code: genCode("EMP"),
      intended_name: employee.name,
      intended_email: employee.email || null,
      job_title: employee.jobTitle || null,
      created_by: context.userId,
    }));

    // ----------------------------------------------------------
    // 6. Insert invites
    // ----------------------------------------------------------

    const { data: created, error: inviteError } =
      await supabaseAdmin
        .from("invite_codes")
        .insert(rows)
        .select("*");

    if (inviteError) {
      throw new Error(inviteError.message);
    }

    return {
      invites: created,
    };
  });

// ============================================================
// STEP 3: COMPLETE ONBOARDING
// ============================================================

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z
      .object({
        companyId: z.string().uuid(),
      })
      .parse,
  )
  .handler(async ({ data, context }) => {
    const {
      supabaseAdmin,
    } = await import("@/integrations/supabase/client.server");

    // ----------------------------------------------------------
    // 1. Verify company admin
    // ----------------------------------------------------------

    const { data: admin, error: adminError } =
      await supabaseAdmin.rpc("is_company_admin", {
        _user_id: context.userId,
        _company_id: data.companyId,
      });

    if (adminError) {
      throw new Error(adminError.message);
    }

    if (!admin) {
      throw new Error("Forbidden");
    }

    // ----------------------------------------------------------
    // 2. Mark company as onboarded
    // ----------------------------------------------------------

    const { error: updateError } = await supabaseAdmin
      .from("companies")
      .update({
        onboarded: true,
      })
      .eq("id", data.companyId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return {
      ok: true,
    };
  });
