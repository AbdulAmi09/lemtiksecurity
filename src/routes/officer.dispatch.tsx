import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listIncidents } from "@/lib/incidents.functions";
import { Navigation2, MapPinned, PhoneCall, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/officer/dispatch")({
  component: OfficerDispatch,
});

function OfficerDispatch() {
  const listInc = useServerFn(listIncidents);
  const { data: incidents = [] } = useQuery({ queryKey: ["officer-dispatch-incidents"], queryFn: () => listInc() });
  const active = incidents.find((incident) => incident.status !== "resolved" && incident.status !== "closed") ?? null;
  const routeSteps = active
    ? [
        "Leave current patrol point",
        `Head toward ${active.location}`,
        `Confirm arrival in ${active.zone}`,
        "Update the response desk",
      ]
    : [];

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-red-300/20 bg-gradient-to-br from-red-400/20 via-white/5 to-transparent p-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-red-100/80">Active dispatch</div>
        <h2 className="mt-2 text-2xl font-semibold">{active ? "You have been dispatched" : "No active dispatch"}</h2>
        <p className="mt-2 text-sm text-slate-300">
          {active
            ? "Navigate to the incident, acknowledge the ping, and keep the response desk updated."
            : "Once a dispatch is assigned, the route instructions will appear here."}
        </p>
      </section>

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

function Card({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
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
