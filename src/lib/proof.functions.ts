import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listProofJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ companyId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { data: jobs, error } = await context.supabase
      .from("proof_jobs")
      .select(`
        *,
        assigned_profile:assigned_to(id, full_name, email),
        submissions:proof_submissions(*)
      `)
      .eq("company_id", data.companyId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { jobs: jobs ?? [] };
  });

export const createProofJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      companyId: z.string().uuid(),
      title: z.string().min(2),
      description: z.string().optional(),
      clientName: z.string().optional(),
      clientEmail: z.string().optional(),
      assignedTo: z.string().uuid().optional(),
      proofType: z.enum(["photo", "link", "screenshot", "deliverable"]).default("photo"),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { data: job, error } = await context.supabase
      .from("proof_jobs")
      .insert({
        company_id: data.companyId,
        title: data.title,
        description: data.description,
        client_name: data.clientName,
        client_email: data.clientEmail,
        assigned_to: data.assignedTo || null,
        proof_type: data.proofType,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { job };
  });

export const submitJobProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      jobId: z.string().uuid(),
      companyId: z.string().uuid(),
      stepTitle: z.string().min(2),
      notes: z.string().optional(),
      proofUrl: z.string().optional(),
      markCompleted: z.boolean().default(false),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { error: subError } = await context.supabase
      .from("proof_submissions")
      .insert({
        job_id: data.jobId,
        company_id: data.companyId,
        submitted_by: context.userId,
        step_title: data.stepTitle,
        notes: data.notes,
        proof_url: data.proofUrl,
      });

    if (subError) throw new Error(subError.message);

    if (data.markCompleted) {
      await context.supabase
        .from("proof_jobs")
        .update({
          status: "submitted",
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .eq("id", data.jobId);
    } else {
      await context.supabase
        .from("proof_jobs")
        .update({
          status: "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.jobId);
    }

    return { success: true };
  });

export const verifyJobStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      jobId: z.string().uuid(),
      status: z.enum(["verified", "rejected"]),
      feedback: z.string().optional(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("proof_jobs")
      .update({
        status: data.status,
        client_feedback: data.feedback,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.jobId);

    if (error) throw new Error(error.message);
    return { success: true };
  });
