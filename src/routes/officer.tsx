import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { resolveAppAccess, requireSectionAccess } from "@/lib/rbac";
import { OfficerShell } from "@/components/OfficerShell";

export const Route = createFileRoute("/officer")({
  beforeLoad: async () => {
    requireSectionAccess(await resolveAppAccess(supabase), ["field_officer"]);
  },
  component: OfficerLayout,
});

function OfficerLayout() {
  return <OfficerShell />;
}
