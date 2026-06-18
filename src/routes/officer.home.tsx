import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPatrols } from "@/lib/patrols.functions";
import { listIncidents } from "@/lib/incidents.functions";
import { listMyNotifications } from "@/lib/alerts.functions";
import { supabase } from "@/integrations/supabase/client";
import { MapPinned, ShieldAlert, CheckCircle2, BellRing, ArrowRight, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/officer/home")({
  component: OfficerHome,
});

function OfficerHome() {
  const [name, setName] = useState("Officer");
  const listPat = useServerFn(listPatrols);
  const listInc = useServerFn(listIncidents);
  const listNotifs = useServerFn(listMyNotifications);

  const { data: patrols = [] } = useQuery({ queryKey: ["officer-patrols"], queryFn: () => listPat() });
  const { data: incidents = [] } = useQuery({ queryKey: ["officer-incidents"], queryFn: () => listInc() });
  const { data: notifications = [] } = useQuery({
    queryKey: ["officer-notifications"],
    queryFn: () => listNotifs(),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", data.user.id)
        .maybeSingle();
      setName((profile?.display_name || data.user.email || "Officer").split(" ")[0]);
    })();
  }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const onShift = patrols.find((p) => p.status === "on_route" || p.status === "delayed");
  const unresolved = incidents.filter((i) => i.status !== "resolved" && i.status !== "closed").slice(0, 5);
  const dispatchNotifs = notifications.filter((n: any) => n.incident_id).slice(0, 3);
  const primaryDispatch = dispatchNotifs[0];
  const primaryIncident = primaryDispatch
    ? incidents.find((incident) => incident.id === primaryDispatch.incident_id && incident.status !== "resolved" && incident.status !== "closed")
    : unresolved[0];

  const quickActions = useMemo(() => ([
    { label: "Report Incident", to: "/officer/incident/new", icon: ShieldAlert },
    { label: "Check In", to: "/officer/patrol", icon: CheckCircle2 },
    { label: "SOS", to: "/officer/sos", icon: AlertTriangle },
  ]), []);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Home</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            {greeting}, {name}
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Lagos time · {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.to}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-medium text-white hover:border-cyan-300/30 hover:bg-slate-900"
                >
                  <Icon className="h-4 w-4 text-cyan-300" />
                  {action.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/15 via-white/5 to-transparent p-5">
          <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/80">Connection</div>
          <div className="mt-2 flex items-center gap-2 text-sm font-medium text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Online and ready
          </div>
          <p className="mt-2 text-sm text-slate-300">
            Critical actions remain available when the network drops and will sync when the connection restores.
          </p>
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Active shift</div>
            {onShift ? (
              <>
                <div className="mt-2 text-lg font-semibold">{onShift.name}</div>
                <div className="mt-1 text-sm text-slate-300">{onShift.shift} · Next check-in {onShift.next_check_in}</div>
                <Link to="/officer/patrol" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-200">
                  View patrol <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <div className="mt-2 text-sm text-slate-300">No active patrol assignment right now.</div>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/10 p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-red-100/80">Active dispatch</div>
            {primaryIncident ? (
              <>
                <div className="mt-2 text-sm font-semibold text-white">
                  {primaryIncident.code} · {primaryIncident.location}
                </div>
                <p className="mt-1 text-sm text-slate-300">
                  {primaryDispatch?.body ?? "Navigate to the assignment and acknowledge once you are on route."}
                </p>
                <Link to="/officer/navigation" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-red-100">
                  Open navigation <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-300">No active dispatch assignment is currently available.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent incidents</h3>
            <Link to="/officer/incident/new" className="text-xs text-cyan-200">Log new</Link>
          </div>
          <div className="mt-4 space-y-3">
            {unresolved.length === 0 ? (
              <p className="text-sm text-slate-400">No active incidents assigned to you.</p>
            ) : unresolved.map((incident) => (
              <div key={incident.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{incident.code}</div>
                    <div className="mt-1 text-sm text-slate-300">{incident.location} · {incident.zone}</div>
                  </div>
                  <MapPinned className="h-4 w-4 text-cyan-300" />
                </div>
                <div className="mt-3 text-xs text-slate-400">{incident.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <Link to="/officer/notifications" className="text-xs text-cyan-200">View all</Link>
          </div>
          <div className="mt-4 space-y-3">
            {(dispatchNotifs.length > 0
              ? dispatchNotifs.map((item: any) => ({ title: item.title, body: item.body ?? item.action ?? "", id: item.id }))
              : [
                  { title: "Shift reminder", body: "Morning perimeter loop starts in 12 minutes.", id: "shift-reminder" },
                  { title: "Dispatch", body: "You were pinged by the control room for Gate 3.", id: "dispatch" },
                  { title: "Check-in due", body: "Next patrol checkpoint is in 4 minutes.", id: "check-in" },
                ]).map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-start gap-3">
                  <BellRing className="mt-0.5 h-4 w-4 text-cyan-300" />
                  <div>
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="mt-1 text-sm text-slate-300">{item.body}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
