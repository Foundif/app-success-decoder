
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS price_inr_yearly integer,
  ADD COLUMN IF NOT EXISTS per_user boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS contact_only boolean DEFAULT false;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS seats integer DEFAULT 1;

-- Drop the FK so we can swap plan rows; the app validates plan ids via lookup.
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id_fkey;
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_plan_fkey;

DELETE FROM public.plans;

INSERT INTO public.plans (id, name, price_inr, price_inr_yearly, max_staff, features, sort_order, active, per_user, contact_only) VALUES
  ('starter', 'Starter', 149, 1428, 10,
    '{"recording":true,"alerts":true,"clips":true,"payroll":false,"audit":false,"reports_basic":true,"reports_advanced":false,"export":false,"projects":false,"web_app_tracking":false,"api":false,"priority_support":false,"dedicated_am":false,"screenshot_interval_minutes":10}'::jsonb,
    10, true, true, false),
  ('growth', 'Growth', 249, 2388, 50,
    '{"recording":true,"alerts":true,"clips":true,"payroll":true,"audit":true,"reports_basic":true,"reports_advanced":true,"export":true,"projects":true,"web_app_tracking":true,"api":false,"priority_support":false,"dedicated_am":false,"screenshot_interval_minutes":5}'::jsonb,
    20, true, true, false),
  ('scale', 'Scale', 399, 3828, 200,
    '{"recording":true,"alerts":true,"clips":true,"payroll":true,"audit":true,"reports_basic":true,"reports_advanced":true,"export":true,"projects":true,"web_app_tracking":true,"api":true,"priority_support":true,"dedicated_am":false,"screenshot_interval_minutes":5}'::jsonb,
    30, true, true, false),
  ('enterprise', 'Enterprise', 0, 0, NULL,
    '{"recording":true,"alerts":true,"clips":true,"payroll":true,"audit":true,"reports_basic":true,"reports_advanced":true,"export":true,"projects":true,"web_app_tracking":true,"api":true,"priority_support":true,"dedicated_am":true,"screenshot_interval_minutes":1}'::jsonb,
    40, true, true, true);

-- Migrate any existing subscriptions / companies to closest new plan
UPDATE public.subscriptions SET plan_id = 'growth' WHERE plan_id NOT IN ('starter','growth','scale','enterprise');
UPDATE public.companies SET plan = 'growth' WHERE plan IS NOT NULL AND plan NOT IN ('starter','growth','scale','enterprise');

ALTER TABLE public.profiles ALTER COLUMN currency SET DEFAULT 'INR';
UPDATE public.profiles SET currency = 'INR' WHERE currency IS NULL OR currency = 'USD';
ALTER TABLE public.salary_records ALTER COLUMN currency SET DEFAULT 'INR';
UPDATE public.salary_records SET currency = 'INR' WHERE currency = 'USD';
