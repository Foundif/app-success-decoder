import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * AI-powered screen content analyzer.
 * Sends a base64 snapshot to Lovable AI (gemini-flash vision) and asks whether
 * the staff is looking at allowed work apps or a distraction (games, youtube,
 * social, entertainment). If a distraction, an activity_alert is written so
 * the business owner sees it in real time.
 */
export const analyzeSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      companyId: z.string().uuid(),
      attendanceId: z.string().uuid().nullable().optional(),
      imageBase64: z.string().min(50), // data URL or raw base64
      mime: z.string().default("image/webp"),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("monitoring_enabled, allowed_apps, name")
      .eq("id", data.companyId)
      .maybeSingle();
    if (!company || !company.monitoring_enabled) {
      return { skipped: true, reason: "monitoring_disabled" };
    }

    const allowed = (company.allowed_apps ?? []) as Array<{ label: string; url: string }>;
    const allowedText = allowed.length
      ? allowed.map((a) => `- ${a.label} (${a.url})`).join("\n")
      : "(no explicit whitelist — assume general productivity software is allowed)";

    const dataUrl = data.imageBase64.startsWith("data:")
      ? data.imageBase64
      : `data:${data.mime};base64,${data.imageBase64}`;

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    const prompt = `You are a workforce productivity monitor. Look at this screenshot of an employee's screen and decide if the visible content is WORK or a DISTRACTION.
DISTRACTIONS include: YouTube/Netflix/Twitch entertainment, video games, social media feeds (Instagram/Facebook/TikTok/X/Reddit), shopping browsing, gambling, adult content, news doomscrolling.
ALLOWED apps for this company:
${allowedText}

Respond with strict JSON only, no prose:
{"category":"work|distraction|idle|unknown","app":"short app/site name","confidence":0..1,"reason":"one short sentence"}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      return { skipped: true, reason: `ai_${r.status}`, detail: t.slice(0, 200) };
    }
    const json: any = await r.json();
    const text = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { category?: string; app?: string; confidence?: number; reason?: string } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {};
    }

    const isDistraction = parsed.category === "distraction" && (parsed.confidence ?? 0) >= 0.55;
    if (isDistraction) {
      await supabaseAdmin.from("activity_alerts").insert({
        company_id: data.companyId,
        employee_id: context.userId,
        attendance_id: data.attendanceId ?? null,
        alert_type: "distraction",
        severity: "warning",
        message: `Off-task: ${parsed.app ?? "non-work content"} — ${parsed.reason ?? ""}`.slice(0, 240),
        metadata: { ...parsed },
      });
      await supabaseAdmin.from("audit_logs").insert({
        company_id: data.companyId,
        actor_id: context.userId,
        target_user_id: context.userId,
        action: "monitoring.distraction_detected",
        entity_type: "activity_alert",
        metadata: { app: parsed.app, reason: parsed.reason, confidence: parsed.confidence },
      });
    }
    return { ok: true, result: parsed, alerted: isDistraction };
  });

// Toggle monitoring + manage allowed-apps whitelist (admin only)
export const updateMonitoringSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      companyId: z.string().uuid(),
      monitoringEnabled: z.boolean().optional(),
      allowedApps: z
        .array(z.object({ label: z.string().min(1).max(80), url: z.string().min(1).max(400) }))
        .max(50)
        .optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await supabaseAdmin.rpc("is_company_admin", {
      _user_id: context.userId,
      _company_id: data.companyId,
    });
    if (!isAdmin) throw new Error("Forbidden");

    const patch: { monitoring_enabled?: boolean; allowed_apps?: any } = {};
    if (typeof data.monitoringEnabled === "boolean")
      patch.monitoring_enabled = data.monitoringEnabled;
    if (data.allowedApps) patch.allowed_apps = data.allowedApps;
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await supabaseAdmin
      .from("companies")
      .update(patch as any)
      .eq("id", data.companyId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_logs").insert({
      company_id: data.companyId,
      actor_id: context.userId,
      action: "monitoring.settings_updated",
      entity_type: "company",
      entity_id: data.companyId,
      metadata: patch as any,
    });
    return { ok: true };
  });

// Sign a storage path on demand so screenshots/clips render reliably from
// any deployment (no embedded short-lived URLs in the database).
export const signStoragePath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      bucket: z.string().default("recordings"),
      path: z.string().min(1),
      expiresIn: z.number().int().min(60).max(60 * 60 * 24).default(3600),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // basic guard: path must contain user's company id OR caller must be admin of that company
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (!prof?.company_id || !data.path.startsWith(prof.company_id)) {
      // allow super_admin
      const { data: sa } = await supabaseAdmin.rpc("is_super_admin", { _user_id: context.userId });
      if (!sa) throw new Error("Forbidden");
    }
    const { data: signed, error } = await supabaseAdmin.storage
      .from(data.bucket)
      .createSignedUrl(data.path, data.expiresIn);
    if (error || !signed) throw new Error(error?.message ?? "Sign failed");
    return { url: signed.signedUrl };
  });
