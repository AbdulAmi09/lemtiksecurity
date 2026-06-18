-- Platform admin access for organisation management.

DROP POLICY IF EXISTS "Lemtik admin reads all organisations" ON public.organisations;
CREATE POLICY "Lemtik admin reads all organisations" ON public.organisations
  FOR SELECT TO authenticated
  USING (public.is_lemtik_admin(auth.uid()));

DROP POLICY IF EXISTS "Lemtik admin manages orgs" ON public.organisations;
CREATE POLICY "Lemtik admin manages orgs" ON public.organisations
  FOR ALL TO authenticated
  USING (public.is_lemtik_admin(auth.uid()))
  WITH CHECK (public.is_lemtik_admin(auth.uid()));

DROP POLICY IF EXISTS "Lemtik admin reads all org members" ON public.organisation_members;
CREATE POLICY "Lemtik admin reads all org members" ON public.organisation_members
  FOR SELECT TO authenticated
  USING (public.is_lemtik_admin(auth.uid()));

DROP POLICY IF EXISTS "Lemtik admin manages org members" ON public.organisation_members;
CREATE POLICY "Lemtik admin manages org members" ON public.organisation_members
  FOR ALL TO authenticated
  USING (public.is_lemtik_admin(auth.uid()))
  WITH CHECK (public.is_lemtik_admin(auth.uid()));

DROP POLICY IF EXISTS "Lemtik admin reads all locations" ON public.organisation_locations;
CREATE POLICY "Lemtik admin reads all locations" ON public.organisation_locations
  FOR SELECT TO authenticated
  USING (public.is_lemtik_admin(auth.uid()));

DROP POLICY IF EXISTS "Lemtik admin manages all locations" ON public.organisation_locations;
CREATE POLICY "Lemtik admin manages all locations" ON public.organisation_locations
  FOR ALL TO authenticated
  USING (public.is_lemtik_admin(auth.uid()))
  WITH CHECK (public.is_lemtik_admin(auth.uid()));

DROP POLICY IF EXISTS "Lemtik admin reads org settings" ON public.organisation_settings;
CREATE POLICY "Lemtik admin reads org settings" ON public.organisation_settings
  FOR SELECT TO authenticated
  USING (public.is_lemtik_admin(auth.uid()));

DROP POLICY IF EXISTS "Lemtik admin manages org settings" ON public.organisation_settings;
CREATE POLICY "Lemtik admin manages org settings" ON public.organisation_settings
  FOR ALL TO authenticated
  USING (public.is_lemtik_admin(auth.uid()))
  WITH CHECK (public.is_lemtik_admin(auth.uid()));

DROP POLICY IF EXISTS "Lemtik admin reads org invites" ON public.user_invites;
CREATE POLICY "Lemtik admin reads org invites" ON public.user_invites
  FOR SELECT TO authenticated
  USING (public.is_lemtik_admin(auth.uid()));

DROP POLICY IF EXISTS "Lemtik admin manages org invites" ON public.user_invites;
CREATE POLICY "Lemtik admin manages org invites" ON public.user_invites
  FOR ALL TO authenticated
  USING (public.is_lemtik_admin(auth.uid()))
  WITH CHECK (public.is_lemtik_admin(auth.uid()));

DROP POLICY IF EXISTS "Lemtik admin reads incidents" ON public.incidents;
CREATE POLICY "Lemtik admin reads incidents" ON public.incidents
  FOR SELECT TO authenticated
  USING (public.is_lemtik_admin(auth.uid()));

DROP POLICY IF EXISTS "Lemtik admin reads audit log" ON public.audit_log;
CREATE POLICY "Lemtik admin reads audit log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.is_lemtik_admin(auth.uid()));
