import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listIncidents } from "@/lib/incidents.functions";
import { listMyNotifications, markNotificationRead } from "@/lib/alerts.functions";
import {
  Navigation2,
  MapPinned,
  PhoneCall,
  CheckCircle2,
  Bell,
  Volume2,
  Vibrate,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/officer/dispatch")({
  component: OfficerDispatch,
});

function OfficerDispatch() {
  const qc = useQueryClient();
  const listInc = useServerFn(listIncidents);
  const listNotifs = useServerFn(listMyNotifications);
  const markRead = useServerFn(markNotificationRead);
  const alertPlayedRef = useRef<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const { data: incidents = [] } = useQuery({ queryKey: ["officer-dispatch-incidents"], queryFn: () => listInc() });
  const { data: notifications = [] } = useQuery({
    queryKey: ["officer-dispatch-notifications"],
    queryFn: () => listNotifs(),
    refetchInterval: 20_000,
  });

  const activeNotification = useMemo(
    () =>
      [...(notifications as any[])]
        .reverse()
        .find((item) => item.incident_id && !item.read) ??
      [...(notifications as any[])]
        .reverse()
        .find((item) => item.incident_id) ??
      null,
    [notifications],
  );

  const active = useMemo(() => {
    if (activeNotification?.incident_id) {
      const match = (incidents as any[]).find((incident) => incident.id === activeNotification.incident_id);
      if (match) return match;
    }
    return (incidents as any[]).find((incident) => incident.status !== "resolved" && incident.status !== "closed") ?? null;
  }, [activeNotification, incidents]);

  useEffect(() => {
    if (!active) return;
    if (alertPlayedRef.current === active.id) return;
    alertPlayedRef.current = active.id;

    try {
      navigator.vibrate?.([200, 120, 200, 120, 350]);
    } catch {
      // ignore
    }

    try {
      const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 920;
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      osc.stop(ctx.currentTime + 0.24);
      setTimeout(() => void ctx.close(), 300);
    } catch {
      // best-effort alert only
    }
  }, [active]);

  const routeSteps = active
    ? [
        "Leave current patrol point",
        `Head toward ${active.location}`,
        `Confirm arrival in ${active.zone}`,
        "Update the response desk",
      ]
    : [];

  const acknowledge = async () => {
    setAcknowledged(true);
    if (activeNotification?.id) {
      await markRead({ data: { alert_id: activeNotification.id } });
      await qc.invalidateQueries({ queryKey: ["officer-dispatch-notifications"] });
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] border border-red-300/30 bg-gradient-to-br from-red-500/20 via-white/5 to-transparent p-5 shadow-[0_24px_80px_rgba(127,29,29,0.35)]">
        <div className="text-[11px] uppercase tracking-[0.22em] text-red-100/80">Active dispatch</div>
        <h2 className="mt-2 text-2xl font-semibold">{active ? "You have been dispatched" : "No active dispatch"}</h2>
        <p className="mt-2 text-sm text-slate-300">
          {active
            ? "Navigate to the incident, acknowledge the ping, and keep the response desk updated."
            : "Once a dispatch is assigned, the route instructions will appear here."}
        </p>
      </section>

      {active && !acknowledged && (
        <section className="rounded-[2rem] border border-red-300/30 bg-red-300/10 p-5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-red-100/80">
            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            Dispatch alert
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3">
              <div className="text-2xl font-semibold text-white">🚨 DISPATCH — {active.code}</div>
              <div className="text-lg text-slate-100">{active.type ?? "Active incident"}</div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-200">
                <div className="font-semibold">{active.location}</div>
                <div className="mt-1 text-slate-300">{active.zone}</div>
                <div className="mt-3 text-[11px] uppercase tracking-[0.16em] text-slate-400">Instructions</div>
                <p className="mt-2 leading-6">
                  Proceed immediately to {active.location}. Treat the suspect as armed until scene is secured. Carry radio, first aid kit, and handcuffs.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/officer/navigation" className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950">
                  <Navigation2 className="h-4 w-4" />
                  Open navigation
                </Link>
                <button
                  type="button"
                  onClick={() => void acknowledge()}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Acknowledge
                </button>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Live response</div>
              <div className="mt-3 space-y-3 text-sm text-slate-200">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-red-200" />
                  Sound alert
                </div>
                <div className="flex items-center gap-2">
                  <Vibrate className="h-4 w-4 text-red-200" />
                  Vibration trigger
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-red-200" />
                  Push notification received
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Navigation2 className="h-4 w-4 text-red-300" />
            Route
          </div>
          <div className="mt-4 space-y-3">
            {routeSteps.length > 0 ? routeSteps.map((step, idx) => (
              <div key={step} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm">
                <span>{step}</span>
                <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Step {idx + 1}</span>
              </div>
            )) : (
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                No route available yet.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Card icon={<MapPinned className="h-4 w-4 text-red-300" />} title="Destination" body={active ? active.location : "No assignment"} />
          <Card icon={<PhoneCall className="h-4 w-4 text-red-300" />} title="Contact" body={active ? "Control room is monitoring your ETA." : "Awaiting dispatch assignment."} />
          <Link to="/officer/navigation" className="block rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-medium text-cyan-100">
            Open navigation
          </Link>
          <Link to="/officer/sos" className="block rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm font-medium text-red-100">
            Panic SOS
          </Link>
          <Link to="/officer/home" className="block rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-medium text-emerald-100">
            <CheckCircle2 className="mr-2 inline h-4 w-4" />
            Acknowledge and continue
          </Link>
        </div>
      </div>
    </div>
  );
}

function Card({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <p className="mt-2 text-sm text-slate-300">{body}</p>
    </div>
  );
}
