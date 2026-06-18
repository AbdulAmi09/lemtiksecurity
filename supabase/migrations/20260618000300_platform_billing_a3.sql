-- Platform billing configuration for the lemtik_admin console.

CREATE TABLE IF NOT EXISTS public.billing_tier_pricing (
  tier public.subscription_tier PRIMARY KEY,
  monthly_amount NUMERIC NOT NULL DEFAULT 0,
  features TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_tier_pricing TO authenticated;
GRANT ALL ON public.billing_tier_pricing TO service_role;

ALTER TABLE public.billing_tier_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lemtik admin reads tier pricing" ON public.billing_tier_pricing;
CREATE POLICY "Lemtik admin reads tier pricing" ON public.billing_tier_pricing
  FOR SELECT TO authenticated
  USING (public.is_lemtik_admin(auth.uid()));

DROP POLICY IF EXISTS "Lemtik admin manages tier pricing" ON public.billing_tier_pricing;
CREATE POLICY "Lemtik admin manages tier pricing" ON public.billing_tier_pricing
  FOR ALL TO authenticated
  USING (public.is_lemtik_admin(auth.uid()))
  WITH CHECK (public.is_lemtik_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.billing_tier_pricing_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_billing_tier_pricing_updated_at ON public.billing_tier_pricing;
CREATE TRIGGER trg_billing_tier_pricing_updated_at
  BEFORE UPDATE ON public.billing_tier_pricing
  FOR EACH ROW EXECUTE FUNCTION public.billing_tier_pricing_updated_at();

INSERT INTO public.billing_tier_pricing (tier, monthly_amount, features)
VALUES
  ('basic', 150000, ARRAY['Core incidents', 'Basic reports', 'Single site']),
  ('professional', 350000, ARRAY['Multi-site operations', 'Advanced analytics', 'Priority support']),
  ('enterprise', 750000, ARRAY['All operational modules', 'Custom integrations', 'Dedicated success']),
  ('government', 1000000, ARRAY['Compliance controls', 'Multi-agency support', 'Priority SLA'])
ON CONFLICT (tier) DO UPDATE
SET monthly_amount = EXCLUDED.monthly_amount,
    features = EXCLUDED.features;
