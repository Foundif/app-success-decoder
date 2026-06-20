
-- ====== Currency to INR ======
ALTER TABLE public.profiles ALTER COLUMN currency SET DEFAULT 'INR';
UPDATE public.profiles SET currency = 'INR' WHERE currency = 'USD' OR currency IS NULL;
ALTER TABLE public.salary_records ALTER COLUMN currency SET DEFAULT 'INR';
UPDATE public.salary_records SET currency = 'INR' WHERE currency = 'USD' OR currency IS NULL;

-- ====== Company branding + policy + billing ======
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS brand_color text DEFAULT '#0F172A',
  ADD COLUMN IF NOT EXISTS gst_number text,
  ADD COLUMN IF NOT EXISTS pan_number text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS work_hours_per_day numeric(4,2) DEFAULT 8,
  ADD COLUMN IF NOT EXISTS weekly_off_days int[] DEFAULT ARRAY[0],
  ADD COLUMN IF NOT EXISTS holidays date[] DEFAULT ARRAY[]::date[],
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT (now() + interval '7 days'),
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS razorpay_customer_id text,
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id text;

-- Backfill trial end for existing rows
UPDATE public.companies SET trial_ends_at = COALESCE(trial_ends_at, created_at + interval '7 days')
  WHERE trial_ends_at IS NULL;

-- ====== Plans catalog ======
CREATE TABLE IF NOT EXISTS public.plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_inr integer NOT NULL,
  max_staff integer,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  razorpay_plan_id text,
  sort_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plans are public" ON public.plans;
CREATE POLICY "plans are public" ON public.plans FOR SELECT TO anon, authenticated USING (active);

INSERT INTO public.plans (id, name, price_inr, max_staff, features, sort_order) VALUES
  ('starter','Starter',499,5,'{"recording":true,"payroll":false,"audit":false,"alerts":true,"clips":false}'::jsonb,1),
  ('growth','Growth',1499,25,'{"recording":true,"payroll":true,"audit":true,"alerts":true,"clips":true}'::jsonb,2),
  ('business','Business',3999,null,'{"recording":true,"payroll":true,"audit":true,"alerts":true,"clips":true,"priority_support":true}'::jsonb,3)
ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name, price_inr=EXCLUDED.price_inr, max_staff=EXCLUDED.max_staff,
  features=EXCLUDED.features, sort_order=EXCLUDED.sort_order;

-- ====== Subscriptions / payments log ======
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES public.plans(id),
  razorpay_subscription_id text UNIQUE,
  razorpay_customer_id text,
  status text NOT NULL DEFAULT 'created',
  current_period_start timestamptz,
  current_period_end timestamptz,
  amount_inr integer NOT NULL,
  raw jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "company members see subscriptions" ON public.subscriptions;
CREATE POLICY "company members see subscriptions" ON public.subscriptions FOR SELECT TO authenticated
  USING (company_id = public.get_user_company(auth.uid()));
DROP POLICY IF EXISTS "company admin manages subscriptions" ON public.subscriptions;
CREATE POLICY "company admin manages subscriptions" ON public.subscriptions FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  razorpay_payment_id text UNIQUE,
  razorpay_order_id text,
  amount_inr integer NOT NULL,
  status text NOT NULL,
  method text,
  raw jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "company members see payments" ON public.payments;
CREATE POLICY "company members see payments" ON public.payments FOR SELECT TO authenticated
  USING (company_id = public.get_user_company(auth.uid()));

-- ====== Helper: company plan / paywall status ======
CREATE OR REPLACE FUNCTION public.company_access_status(_company_id uuid)
RETURNS TABLE(status text, plan text, trial_ends_at timestamptz, current_period_end timestamptz, is_active boolean, is_readonly boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    c.subscription_status,
    c.plan,
    c.trial_ends_at,
    c.current_period_end,
    (c.subscription_status = 'active' AND (c.current_period_end IS NULL OR c.current_period_end > now()))
      OR (c.subscription_status = 'trial' AND c.trial_ends_at > now()) AS is_active,
    NOT (
      (c.subscription_status = 'active' AND (c.current_period_end IS NULL OR c.current_period_end > now()))
      OR (c.subscription_status = 'trial' AND c.trial_ends_at > now())
    ) AS is_readonly
  FROM public.companies c WHERE c.id = _company_id;
$$;
GRANT EXECUTE ON FUNCTION public.company_access_status(uuid) TO authenticated, anon, service_role;

CREATE TRIGGER trg_subscriptions_touch BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Allow staff joining via company-wide code: anon needs to look up companies.invite_code
-- Lookup happens through a SECURITY DEFINER function called by the server, so no anon policy needed.
CREATE OR REPLACE FUNCTION public.lookup_company_by_invite(_code text)
RETURNS TABLE(company_id uuid, company_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name FROM public.companies WHERE invite_code = _code LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.lookup_company_by_invite(text) TO anon, authenticated, service_role;
