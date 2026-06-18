-- Platform console data for lemtik_admin

CREATE TABLE IF NOT EXISTS public.platform_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline',
  last_activity_at TIMESTAMPTZ,
  last_collection_at TIMESTAMPTZ,
  items_collected_today INTEGER NOT NULL DEFAULT 0,
  error_count_24h INTEGER NOT NULL DEFAULT 0,
  render_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE SET NULL,
  organisation_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_events_created_at ON public.platform_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_events_org ON public.platform_events(organisation_id, created_at DESC);

GRANT SELECT ON public.platform_services TO authenticated;
GRANT SELECT ON public.platform_events TO authenticated;
GRANT ALL ON public.platform_services TO service_role;
GRANT ALL ON public.platform_events TO service_role;

ALTER TABLE public.platform_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lemtik admin reads platform services" ON public.platform_services;
CREATE POLICY "Lemtik admin reads platform services" ON public.platform_services
  FOR SELECT TO authenticated
  USING (public.is_lemtik_admin(auth.uid()));

DROP POLICY IF EXISTS "Lemtik admin reads platform events" ON public.platform_events;
CREATE POLICY "Lemtik admin reads platform events" ON public.platform_events
  FOR SELECT TO authenticated
  USING (public.is_lemtik_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.log_platform_event_for_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_name TEXT;
  summary_text TEXT;
BEGIN
  SELECT name INTO org_name FROM public.organisations WHERE id = NEW.id;
  IF org_name IS NULL THEN
    org_name := NEW.name;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.platform_events (organisation_id, organisation_name, event_type, summary, metadata)
    VALUES (NEW.id, org_name, 'organisation.created', org_name || ' — new organisation registered', jsonb_build_object('subscription_tier', NEW.subscription_tier, 'subscription_status', NEW.subscription_status));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
    IF NEW.subscription_status = 'active' AND OLD.subscription_status <> 'active' THEN
      summary_text := org_name || ' — Subscription renewed';
    ELSE
      summary_text := org_name || ' — Subscription status changed to ' || NEW.subscription_status;
    END IF;
    INSERT INTO public.platform_events (organisation_id, organisation_name, event_type, summary, metadata)
    VALUES (NEW.id, org_name, 'subscription.status_changed', summary_text, jsonb_build_object('from', OLD.subscription_status, 'to', NEW.subscription_status));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_platform_org_event ON public.organisations;
CREATE TRIGGER trg_platform_org_event
  AFTER INSERT OR UPDATE OF subscription_status ON public.organisations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_platform_event_for_org();

CREATE OR REPLACE FUNCTION public.log_platform_event_for_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_name TEXT;
BEGIN
  SELECT name INTO org_name FROM public.organisations WHERE id = NEW.organisation_id;
  INSERT INTO public.platform_events (organisation_id, organisation_name, event_type, summary, metadata)
  VALUES (
    NEW.organisation_id,
    COALESCE(org_name, 'Organisation'),
    'invite.created',
    COALESCE(org_name, 'Organisation') || ' — New user invited',
    jsonb_build_object('email', NEW.email, 'role', NEW.role, 'status', NEW.status)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_platform_invite_event ON public.user_invites;
CREATE TRIGGER trg_platform_invite_event
  AFTER INSERT ON public.user_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.log_platform_event_for_invite();

INSERT INTO public.platform_services (slug, name, status, last_activity_at, last_collection_at, items_collected_today, error_count_24h, render_url)
VALUES
  ('osint-brain', 'OSINT Brain', 'online', now() - interval '14 minutes', now() - interval '14 minutes', 47, 0, 'https://dashboard.render.com'),
  ('inventory-service', 'Inventory Service', 'online', now() - interval '32 minutes', now() - interval '1 hour', 18, 0, 'https://dashboard.render.com'),
  ('route-calculator', 'Route Calculator', 'degraded', now() - interval '21 minutes', now() - interval '21 minutes', 11, 2, 'https://dashboard.render.com'),
  ('proximity-finder', 'Proximity Finder', 'online', now() - interval '9 minutes', now() - interval '9 minutes', 22, 0, 'https://dashboard.render.com'),
  ('autonomous-control', 'Autonomous Control', 'offline', now() - interval '3 hours', now() - interval '3 hours', 0, 5, 'https://dashboard.render.com'),
  ('master-agent', 'Master Agent', 'online', now() - interval '7 minutes', now() - interval '7 minutes', 61, 1, 'https://dashboard.render.com'),
  ('relationship-api', 'Relationship API', 'online', now() - interval '12 minutes', now() - interval '15 minutes', 29, 0, 'https://dashboard.render.com')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  last_activity_at = EXCLUDED.last_activity_at,
  last_collection_at = EXCLUDED.last_collection_at,
  items_collected_today = EXCLUDED.items_collected_today,
  error_count_24h = EXCLUDED.error_count_24h,
  render_url = EXCLUDED.render_url,
  updated_at = now();
