import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const reviewScreenshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      screenshotId: z.string().uuid(),
      decision: z.enum(["approved", "rejected"]),
      note: z.string().max(500).optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: shot, error: fetchErr } = await supabase
      .from("screenshots")
      .select("id, company_id, user_id")
      .eq("id", data.screenshotId)
      .single();
    if (fetchErr || !shot) throw new Error("Screenshot not found.");

    const { error } = await supabase
      .from("screenshots")
      .update({
        status: data.decision,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        review_note: data.note ?? null,
      })
      .eq("id", data.screenshotId);
    if (error) throw new Error(error.message);

    await supabase.from("audit_logs").insert({
      company_id: shot.company_id,
      actor_id: userId,
      target_user_id: shot.user_id,
      action: `screenshot.${data.decision}`,
      entity_type: "screenshot",
      entity_id: shot.id,
      metadata: { note: data.note ?? null },
    });
    return { ok: true };
  });
