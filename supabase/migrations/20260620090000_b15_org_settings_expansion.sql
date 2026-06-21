ALTER TABLE public.organisation_settings
  ADD COLUMN IF NOT EXISTS threshold_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS smart_devices JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS integration_config JSONB NOT NULL DEFAULT '{}'::jsonb;
