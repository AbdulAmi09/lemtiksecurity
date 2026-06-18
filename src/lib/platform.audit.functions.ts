import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { throwSafeError } from "@/lib/server-errors";

async function assertPlatformAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "lemtik_admin")
    .maybeSingle();
  if (error) throwSafeError("platform.audit.check", error, "Unable to verify platform admin access.");
  if (!data) throw new Error("Access denied.");
}

export const listPlatformAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertPlatformAdmin(context.supabase, context.userId);

    const [auditRes, orgsRes, profilesRes] = await Promise.all([
      context.supabase
        .from("audit_log")
        .select("id, actor_id, actor_name, entity, entity_id, action, details, created_at, organisation_id")
        .order("created_at", { ascending: false })
        .limit(500),
      context.supabase
        .from("organisations")
        .select("id, name")
        .order("name"),
      context.supabase
        .from("profiles")
        .select("user_id, display_name, phone, employee_id, photo_url")
        .limit(1000),
    ]);

    if (auditRes.error) throwSafeError("platform.audit.rows", auditRes.error, "Unable to load audit log.");
    if (orgsRes.error) throwSafeError("platform.audit.orgs", orgsRes.error, "Unable to load organisations.");
    if (profilesRes.error) throwSafeError("platform.audit.profiles", profilesRes.error, "Unable to load profiles.");

    const orgMap = new Map((orgsRes.data ?? []).map((org: any) => [org.id, org.name]));
    const profileMap = new Map((profilesRes.data ?? []).map((profile: any) => [profile.user_id, profile]));

    return (auditRes.data ?? []).map((row: any) => {
      const profile = profileMap.get(row.actor_id);
      return {
        ...row,
        org_name: row.organisation_id ? orgMap.get(row.organisation_id) ?? "Unknown organisation" : "Platform",
        user_name: row.actor_name ?? profile?.display_name ?? row.actor_id ?? "System",
        resource: `${row.entity}${row.entity_id ? `:${row.entity_id}` : ""}`,
        ip_address: row.details?.ip_address ?? row.details?.ip ?? null,
      };
    });
  });
