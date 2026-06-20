
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expected_monthly_hours NUMERIC(6,2) DEFAULT 160,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS hourly_overtime_rate NUMERIC(10,2) DEFAULT 0;

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS is_manual BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edit_reason TEXT,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.recording_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attendance_id UUID REFERENCES public.attendance(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'video/webm',
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recording_clips TO authenticated;
GRANT ALL ON public.recording_clips TO service_role;
ALTER TABLE public.recording_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees insert own clips" ON public.recording_clips FOR INSERT TO authenticated WITH CHECK (employee_id = auth.uid());
CREATE POLICY "Employees read own clips" ON public.recording_clips FOR SELECT TO authenticated USING (employee_id = auth.uid());
CREATE POLICY "Admins read company clips" ON public.recording_clips FOR SELECT TO authenticated USING (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "Admins update company clips" ON public.recording_clips FOR UPDATE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));

CREATE TABLE IF NOT EXISTS public.activity_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attendance_id UUID REFERENCES public.attendance(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('tab_hidden','idle','offline','capture_stopped','device_locked')),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info','warning','critical')),
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_alerts TO authenticated;
GRANT ALL ON public.activity_alerts TO service_role;
ALTER TABLE public.activity_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees insert own alerts" ON public.activity_alerts FOR INSERT TO authenticated WITH CHECK (employee_id = auth.uid());
CREATE POLICY "Employees update own alerts" ON public.activity_alerts FOR UPDATE TO authenticated USING (employee_id = auth.uid());
CREATE POLICY "Employees read own alerts" ON public.activity_alerts FOR SELECT TO authenticated USING (employee_id = auth.uid());
CREATE POLICY "Admins read company alerts" ON public.activity_alerts FOR SELECT TO authenticated USING (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "Admins resolve company alerts" ON public.activity_alerts FOR UPDATE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));

CREATE INDEX IF NOT EXISTS idx_activity_alerts_company_created ON public.activity_alerts(company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.clip_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 300,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','fulfilled','expired','declined')),
  clip_id UUID REFERENCES public.recording_clips(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  fulfilled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 hour')
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clip_requests TO authenticated;
GRANT ALL ON public.clip_requests TO service_role;
ALTER TABLE public.clip_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees read own clip requests" ON public.clip_requests FOR SELECT TO authenticated USING (employee_id = auth.uid());
CREATE POLICY "Employees update own clip requests" ON public.clip_requests FOR UPDATE TO authenticated USING (employee_id = auth.uid());
CREATE POLICY "Admins manage clip requests" ON public.clip_requests FOR ALL TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));

CREATE TABLE IF NOT EXISTS public.salary_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  base_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  expected_hours NUMERIC(6,2) NOT NULL DEFAULT 160,
  worked_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  overtime_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  overtime_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  prorated_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  overtime_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  override_amount NUMERIC(12,2),
  override_reason TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','finalized','paid')),
  finalized_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, period_year, period_month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_records TO authenticated;
GRANT ALL ON public.salary_records TO service_role;
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees read own salary" ON public.salary_records FOR SELECT TO authenticated USING (employee_id = auth.uid());
CREATE POLICY "Admins manage salary" ON public.salary_records FOR ALL TO authenticated USING (public.is_company_admin(auth.uid(), company_id)) WITH CHECK (public.is_company_admin(auth.uid(), company_id));

CREATE TRIGGER trg_salary_updated_at BEFORE UPDATE ON public.salary_records FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "Employees upload own recordings" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'recordings' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "Employees read own recordings" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'recordings' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "Admins read company recordings" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'recordings' AND public.is_company_admin(auth.uid(), ((storage.foldername(name))[1])::uuid));
