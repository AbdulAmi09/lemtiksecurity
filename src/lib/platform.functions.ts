import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { throwSafeError } from "@/lib/server-errors";

const TIER_MRR: Record<string, number> = {
  basic: 150_000,
  professional: 350_000,
  enterprise: 750_000,
  government: 1_000_000,
};

function money(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

export const getPlatformDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: me } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "lemtik_admin")
      .maybeSingle();
    if (!me) throw new Error("Access denied.");

    const [orgsRes, incidentsRes, servicesRes, eventsRes] = await Promise.all([
      context.supabase.from("organisations").select("id, name, subscription_tier, subscription_status, created_at, updated_at"),
      context.supabase.from("incidents").select("id", { count: "exact", head: true }).gte("reported_at", new Date(Date.now() - 30 * 24 * 3600_000).toISOString()),
      context.supabase.from("platform_services").select("*").order("name"),
      context.supabase.from("platform_events").select("*").order("created_at", { ascending: false }).limit(12),
    ]);

    if (orgsRes.error) throwSafeError("platform.orgs", orgsRes.error, "Unable to load organisations.");
    if (incidentsRes.error) throwSafeError("platform.incidents", incidentsRes.error, "Unable to load incident totals.");
    if (servicesRes.error) throwSafeError("platform.services", servicesRes.error, "Unable to load service health.");
    if (eventsRes.error) throwSafeError("platform.events", eventsRes.error, "Unable to load platform activity.");

    const orgs = orgsRes.data ?? [];
    const services = servicesRes.data ?? [];
    const events = eventsRes.data ?? [];
    const activeSubscriptions = orgs.filter((org) => org.subscription_status === "active").length;
    const trialSubscriptions = orgs.filter((org) => org.subscription_status === "trial").length;
    const overdueSubscriptions = orgs.filter((org) => org.subscription_status === "past_due").length;
    const revenue = orgs.reduce((sum, org) => sum + (TIER_MRR[String(org.subscription_tier)] ?? 0), 0);
    const uptime = services.length
      ? Math.round((services.filter((service) => service.status === "online").length / services.length) * 100)
      : 0;

    const recentActivity = [
      ...events.map((event: any) => ({
        id: event.id,
        org: event.organisation_name,
        summary: event.summary,
        kind: event.event_type,
        created_at: event.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    const recentSignups = orgs
      .filter((org) => Date.now() - new Date(org.created_at).getTime() <= 30 * 24 * 3600_000)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((org) => ({
        id: org.id,
        name: org.name,
        status: org.subscription_status,
        tier: org.subscription_tier,
        created_at: org.created_at,
      }));

    return {
      stats: {
        totalOrganisations: orgs.length,
        activeSubscriptions,
        incidentsLast30Days: incidentsRes.count ?? 0,
        uptime,
        activeServices: services.filter((service) => service.status === "online").length,
        trialSubscriptions,
        overdueSubscriptions,
        revenue: money(revenue),
      },
      services,
      recentActivity,
      recentSignups,
    };
  });
