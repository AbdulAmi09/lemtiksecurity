import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { throwSafeError } from "@/lib/server-errors";
import { getActiveOrgId } from "@/lib/orgs.server";

export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const orgId = await getActiveOrgId(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("audit_log").select("*")
      .eq("organisation_id", orgId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throwSafeError("audit.list", error, "Access denied or unable to load audit log.");
    return data;
  });

export const listOrgAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const orgId = await getActiveOrgId(context.supabase, context.userId);
    const [auditRes, profilesRes, membersRes] = await Promise.all([
      context.supabase
        .from("audit_log")
        .select("id, actor_id, actor_name, entity, entity_id, action, details, created_at, organisation_id")
        .eq("organisation_id", orgId)
        .order("created_at", { ascending: false })
        .limit(500),
      context.supabase
        .from("profiles")
        .select("user_id, display_name, phone, employee_id")
        .limit(1000),
      context.supabase
        .from("organisation_members")
        .select("user_id, role")
        .eq("organisation_id", orgId),
    ]);

    if (auditRes.error) throwSafeError("audit.org.rows", auditRes.error, "Unable to load audit log.");
    if (profilesRes.error) throwSafeError("audit.org.profiles", profilesRes.error, "Unable to load profiles.");
    if (membersRes.error) throwSafeError("audit.org.members", membersRes.error, "Unable to load roles.");

    const profileMap = new Map((profilesRes.data ?? []).map((profile: any) => [profile.user_id, profile]));
    const roleMap = new Map((membersRes.data ?? []).map((member: any) => [member.user_id, member.role]));

    return (auditRes.data ?? []).map((row: any) => {
      const profile = profileMap.get(row.actor_id);
      const flags = getAuditFlags(row);
      return {
        ...row,
        user_name: row.actor_name ?? profile?.display_name ?? row.actor_id ?? "System",
        role: roleMap.get(row.actor_id) ?? "system",
        resource: `${row.entity}${row.entity_id ? `:${row.entity_id}` : ""}`,
        ip_address: row.details?.ip_address ?? row.details?.ip ?? null,
        severity: getAuditSeverity(row),
        flags,
        search_text: [
          row.actor_name,
          profile?.display_name,
          row.entity,
          row.entity_id,
          row.action,
          JSON.stringify(row.details ?? {}),
        ].filter(Boolean).join(" ").toLowerCase(),
      };
    });
  });

function getAuditFlags(row: any) {
  const entity = String(row.entity ?? "").toLowerCase();
  const action = String(row.action ?? "").toLowerCase();
  const details = row.details && typeof row.details === "object" ? row.details as Record<string, unknown> : {};
  const text = JSON.stringify(details).toLowerCase();
  const flags: string[] = [];
  if (entity.includes("autonomous") || action.includes("autonomous") || text.includes("override")) flags.push("autonomous");
  if (entity.includes("user") || action.includes("role") || action.includes("invite")) flags.push("access");
  if (action.includes("report") || action.includes("download")) flags.push("report");
  if (action.includes("config") || entity.includes("setting") || text.includes("webhook") || text.includes("threshold")) flags.push("config");
  return flags;
}

function getAuditSeverity(row: any) {
  const flags = getAuditFlags(row);
  if (flags.includes("autonomous")) return 5;
  if (flags.includes("access")) return 4;
  if (flags.includes("config")) return 3;
  if (flags.includes("report")) return 2;
  return 1;
}
