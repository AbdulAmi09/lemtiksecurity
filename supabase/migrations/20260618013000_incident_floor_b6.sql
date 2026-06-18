-- B6: persist floor metadata for incident intake and detail views
ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS floor text;
