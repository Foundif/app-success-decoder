
-- 14-day free trial + monitoring settings + allowed apps/urls
ALTER TABLE public.companies
  ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '14 days');

-- Extend currently-trialing companies to 14 days from created_at if they were on 7
UPDATE public.companies
  SET trial_ends_at = created_at + interval '14 days'
  WHERE subscription_status = 'trial'
    AND trial_ends_at < created_at + interval '14 days';

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS monitoring_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allowed_apps jsonb NOT NULL DEFAULT '[]'::jsonb;
-- allowed_apps shape: [{label: "WhatsApp Web", url: "https://web.whatsapp.com"}, ...]

COMMENT ON COLUMN public.companies.monitoring_enabled IS 'Toggle for AI distraction detection on snapshots.';
COMMENT ON COLUMN public.companies.allowed_apps IS 'Whitelist of allowed sites/apps for monitored staff.';
