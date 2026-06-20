import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      full_name: z.string().min(1).max(120).optional(),
      phone: z.string().max(20).optional().nullable(),
      job_title: z.string().max(80).optional().nullable(),
      department: z.string().max(80).optional().nullable(),
      avatar_url: z.string().max(500).optional().nullable(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").update(data).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateCompanyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      companyId: z.string().uuid(),
      name: z.string().min(1).max(120).optional(),
      industry: z.string().max(80).optional().nullable(),
      tagline: z.string().max(160).optional().nullable(),
      logo_url: z.string().max(500).optional().nullable(),
      brand_color: z.string().max(20).optional().nullable(),
      gst_number: z.string().max(20).optional().nullable(),
      pan_number: z.string().max(20).optional().nullable(),
      phone: z.string().max(20).optional().nullable(),
      website: z.string().max(200).optional().nullable(),
      address: z.string().max(300).optional().nullable(),
      city: z.string().max(80).optional().nullable(),
      state: z.string().max(80).optional().nullable(),
      postal_code: z.string().max(20).optional().nullable(),
      work_hours_per_day: z.number().min(1).max(24).optional(),
      weekly_off_days: z.array(z.number().min(0).max(6)).optional(),
      holidays: z.array(z.string()).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, supabase: db, userId } = context;
    void db;
    const { companyId, ...patch } = data;
    const { data: isAdmin } = await supabase.rpc("is_company_admin", {
      _user_id: userId,
      _company_id: companyId,
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await supabase.from("companies").update(patch).eq("id", companyId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getCompanyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: prof } = await supabase
      .from("profiles").select("company_id").eq("id", userId).maybeSingle();
    if (!prof?.company_id) return null;
    const { data } = await supabase
      .from("companies").select("*").eq("id", prof.company_id).single();
    return data;
  });
