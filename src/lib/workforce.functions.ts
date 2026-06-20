import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- helpers ----------
async function requireAdmin(ctx: { supabase: any; userId: string }, companyId: string) {
  const { data, error } = await ctx.supabase.rpc("is_company_admin", {
    _user_id: ctx.userId,
    _company_id: companyId,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: company admin only");
}

async function audit(
  ctx: { supabase: any; userId: string },
  row: {
    company_id: string;
    target_user_id?: string | null;
    action: string;
    entity_type?: string;
    entity_id?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  await ctx.supabase.from("audit_logs").insert({
    company_id: row.company_id,
    actor_id: ctx.userId,
    target_user_id: row.target_user_id ?? null,
    action: row.action,
    entity_type: row.entity_type ?? null,
    entity_id: row.entity_id ?? null,
    metadata: row.metadata ?? {},
  });
}

// ============ ATTENDANCE: manual entry / edit (admin only) ============
export const upsertAttendanceManual = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      employeeId: string;
      companyId: string;
      workDate: string; // YYYY-MM-DD
      clockIn?: string | null; // ISO
      clockOut?: string | null;
      breakSeconds?: number;
      activeSeconds?: number;
      idleSeconds?: number;
      status?: string;
      reason: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context, data.companyId);
    if (!data.reason || data.reason.trim().length < 3)
      throw new Error("A reason (min 3 chars) is required for manual edits");

    const payload = {
      user_id: data.employeeId,
      company_id: data.companyId,
      work_date: data.workDate,
      clock_in: data.clockIn ?? null,
      clock_out: data.clockOut ?? null,
      break_seconds: data.breakSeconds ?? 0,
      active_seconds: data.activeSeconds ?? 0,
      idle_seconds: data.idleSeconds ?? 0,
      status: (data.status ?? (data.clockOut ? "clocked_out" : "present")) as
        | "present"
        | "on_break"
        | "clocked_out"
        | "absent",
      is_manual: true,
      edited_by: context.userId,
      edit_reason: data.reason.trim(),
      edited_at: new Date().toISOString(),
    };

    const { data: existing } = await context.supabase
      .from("attendance")
      .select("id")
      .eq("user_id", data.employeeId)
      .eq("work_date", data.workDate)
      .maybeSingle();

    let entityId: string;
    if (existing) {
      const { data: upd, error } = await context.supabase
        .from("attendance")
        .update(payload)
        .eq("id", existing.id)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      entityId = upd.id;
    } else {
      const { data: ins, error } = await context.supabase
        .from("attendance")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      entityId = ins.id;
    }

    await audit(context, {
      company_id: data.companyId,
      target_user_id: data.employeeId,
      action: existing ? "attendance.edited" : "attendance.manual_created",
      entity_type: "attendance",
      entity_id: entityId,
      metadata: {
        work_date: data.workDate,
        reason: data.reason,
        clock_in: data.clockIn ?? null,
        clock_out: data.clockOut ?? null,
      },
    });
    return { id: entityId };
  });

// ============ EMPLOYEE CONFIG: salary/expected hours (admin only) ============
export const updateEmployeeCompensation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      employeeId: string;
      companyId: string;
      monthlySalary: number;
      expectedMonthlyHours: number;
      currency?: string;
      hourlyOvertimeRate?: number;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context, data.companyId);
    const { error } = await context.supabase
      .from("profiles")
      .update({
        monthly_salary: data.monthlySalary,
        expected_monthly_hours: data.expectedMonthlyHours,
        currency: data.currency ?? "USD",
        hourly_overtime_rate: data.hourlyOvertimeRate ?? 0,
      })
      .eq("id", data.employeeId)
      .eq("company_id", data.companyId);
    if (error) throw new Error(error.message);

    await audit(context, {
      company_id: data.companyId,
      target_user_id: data.employeeId,
      action: "compensation.updated",
      entity_type: "profile",
      entity_id: data.employeeId,
      metadata: {
        monthly_salary: data.monthlySalary,
        expected_hours: data.expectedMonthlyHours,
        currency: data.currency ?? "USD",
      },
    });
    return { ok: true };
  });

// ============ SALARY: calculate / finalize (admin) ============
export const calculateSalary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { companyId: string; year: number; month: number; employeeId?: string }) => d,
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context, data.companyId);
    const monthStart = new Date(Date.UTC(data.year, data.month - 1, 1));
    const monthEnd = new Date(Date.UTC(data.year, data.month, 1));
    const periodStart = monthStart.toISOString().slice(0, 10);
    const periodEnd = monthEnd.toISOString().slice(0, 10);

    let empQ = context.supabase
      .from("profiles")
      .select("id, full_name, email, monthly_salary, expected_monthly_hours, currency, hourly_overtime_rate")
      .eq("company_id", data.companyId);
    if (data.employeeId) empQ = empQ.eq("id", data.employeeId);
    const { data: emps, error: ee } = await empQ;
    if (ee) throw new Error(ee.message);

    const results: any[] = [];
    for (const emp of emps ?? []) {
      const { data: att } = await context.supabase
        .from("attendance")
        .select("active_seconds")
        .eq("user_id", emp.id)
        .gte("work_date", periodStart)
        .lt("work_date", periodEnd);
      const workedSeconds = (att ?? []).reduce(
        (s: number, a: any) => s + (a.active_seconds ?? 0),
        0,
      );
      const workedHours = workedSeconds / 3600;
      const baseSalary = Number(emp.monthly_salary ?? 0);
      const expectedHours = Number(emp.expected_monthly_hours ?? 160);
      const overtimeRate = Number(emp.hourly_overtime_rate ?? 0);
      const overtimeHours = Math.max(0, workedHours - expectedHours);
      const regularHours = Math.min(workedHours, expectedHours);
      const proratedAmount =
        expectedHours > 0
          ? Math.round(((baseSalary * regularHours) / expectedHours) * 100) / 100
          : 0;
      const overtimeAmount = Math.round(overtimeHours * overtimeRate * 100) / 100;
      const total = Math.round((proratedAmount + overtimeAmount) * 100) / 100;

      const payload = {
        company_id: data.companyId,
        employee_id: emp.id,
        period_year: data.year,
        period_month: data.month,
        base_salary: baseSalary,
        expected_hours: expectedHours,
        worked_hours: Math.round(workedHours * 100) / 100,
        overtime_hours: Math.round(overtimeHours * 100) / 100,
        overtime_rate: overtimeRate,
        prorated_amount: proratedAmount,
        overtime_amount: overtimeAmount,
        total_amount: total,
        currency: emp.currency ?? "USD",
        status: "draft",
      };

      const { data: existing } = await context.supabase
        .from("salary_records")
        .select("id, status, override_amount")
        .eq("employee_id", emp.id)
        .eq("period_year", data.year)
        .eq("period_month", data.month)
        .maybeSingle();

      if (existing && existing.status === "finalized") {
        results.push({ employee: emp, salary: existing, skipped: true });
        continue;
      }
      if (existing) {
        const { data: upd } = await context.supabase
          .from("salary_records")
          .update(payload)
          .eq("id", existing.id)
          .select()
          .single();
        results.push({ employee: emp, salary: upd });
      } else {
        const { data: ins } = await context.supabase
          .from("salary_records")
          .insert(payload)
          .select()
          .single();
        results.push({ employee: emp, salary: ins });
      }
    }

    await audit(context, {
      company_id: data.companyId,
      action: "salary.calculated",
      entity_type: "salary",
      metadata: {
        year: data.year,
        month: data.month,
        employees: results.length,
        target: data.employeeId ?? "all",
      },
    });

    return { count: results.length };
  });

export const overrideSalary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      salaryId: string;
      companyId: string;
      overrideAmount: number | null;
      reason: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context, data.companyId);
    const { data: row, error } = await context.supabase
      .from("salary_records")
      .update({
        override_amount: data.overrideAmount,
        override_reason: data.reason,
      })
      .eq("id", data.salaryId)
      .eq("company_id", data.companyId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await audit(context, {
      company_id: data.companyId,
      target_user_id: row.employee_id,
      action: "salary.override",
      entity_type: "salary",
      entity_id: data.salaryId,
      metadata: { override: data.overrideAmount, reason: data.reason },
    });
    return { ok: true };
  });

export const finalizeSalary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { salaryId: string; companyId: string }) => d)
  .handler(async ({ data, context }) => {
    await requireAdmin(context, data.companyId);
    const { data: row, error } = await context.supabase
      .from("salary_records")
      .update({
        status: "finalized",
        finalized_by: context.userId,
        finalized_at: new Date().toISOString(),
      })
      .eq("id", data.salaryId)
      .eq("company_id", data.companyId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await audit(context, {
      company_id: data.companyId,
      target_user_id: row.employee_id,
      action: "salary.finalized",
      entity_type: "salary",
      entity_id: data.salaryId,
    });
    return { ok: true };
  });

// ============ CLIP REQUEST (admin asks for short webm) ============
export const requestClip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { companyId: string; employeeId: string; reason?: string; durationSeconds?: number }) => d,
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context, data.companyId);
    const { data: row, error } = await context.supabase
      .from("clip_requests")
      .insert({
        company_id: data.companyId,
        employee_id: data.employeeId,
        requested_by: context.userId,
        reason: data.reason ?? null,
        duration_seconds: Math.min(Math.max(data.durationSeconds ?? 300, 30), 600),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await audit(context, {
      company_id: data.companyId,
      target_user_id: data.employeeId,
      action: "clip.requested",
      entity_type: "clip_request",
      entity_id: row.id,
      metadata: { duration: row.duration_seconds, reason: data.reason ?? null },
    });
    return row;
  });

// ============ ALERT RESOLVE (admin) ============
export const resolveAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { alertId: string; companyId: string }) => d)
  .handler(async ({ data, context }) => {
    await requireAdmin(context, data.companyId);
    const { error } = await context.supabase
      .from("activity_alerts")
      .update({
        resolved: true,
        resolved_by: context.userId,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", data.alertId)
      .eq("company_id", data.companyId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
