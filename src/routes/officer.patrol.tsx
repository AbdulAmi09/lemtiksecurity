import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPatrols } from "@/lib/patrols.functions";
import { CheckCircle2, MapPinned, TriangleAlert } from "lucide-react";

export const Route = createFileRoute("/officer/patrol")({
  component: OfficerPatrol,
});

function OfficerPatrol() {
  const listPat = useServerFn(listPatrols);
  const { data: patrols = [] } = useQuery({ queryKey: ["officer-patrols-detail"], queryFn: () => listPat() });
  const active = patrols[0];

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Patrol</div>
        <h2 className="mt-2 text-2xl font-semibold">Active patrol view</h2>
        <p className="mt-2 text-sm text-slate-300">
          View the current route, next checkpoint, and check-in readiness.
        </p>
      </section>

      {active ? (
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{active.name}</div>
                <div className="mt-1 text-sm text-slate-300">{active.officer} · {active.shift}</div>
              </div>
              <MapPinned className="h-5 w-5 text-cyan-300" />
            </div>
            <div className="mt-5 grid gap-2">
                {Array.from({ length: active.waypoints }).map((_, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm">
                    <span>Checkpoint {idx + 1}</span>
                  <span className={idx < active.checked_in ? "text-emerald-300" : "text-slate-400"}>
                    {idx < active.checked_in ? "Checked in" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Card title="Next check-in" icon={<CheckCircle2 className="h-4 w-4 text-emerald-300" />} body={active.next_check_in ?? "—"} />
            <Card title="Patrol status" icon={<TriangleAlert className="h-4 w-4 text-amber-300" />} body={active.status.replace("_", " ")} />
            <Link to="/officer/incident/new" className="block rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-medium text-cyan-100">
              Report an issue from route
            </Link>
            <Link to="/officer/sos" className="block rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm font-medium text-red-100">
              Emergency SOS
            </Link>
          </div>
        </section>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
          No active patrol was found.
        </div>
      )}
    </div>
  );
}

function Card({ title, body, icon }: { title: string; body: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <div className="mt-2 text-sm text-slate-300">{body}</div>
    </div>
  );
}
