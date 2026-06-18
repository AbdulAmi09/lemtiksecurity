import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, ShieldAlert, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/officer/incident/$id")({
  component: OfficerIncidentDetail,
});

function OfficerIncidentDetail() {
  const { id } = Route.useParams() as { id: string };

  return (
    <div className="space-y-4">
      <Link to="/officer/home" className="inline-flex items-center gap-2 text-sm text-cyan-200">
        <ArrowLeft className="h-4 w-4" />
        Back home
      </Link>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Incident</div>
        <h2 className="mt-2 text-2xl font-semibold">Own incident view</h2>
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
          <ShieldAlert className="h-4 w-4 text-cyan-300" />
          Reference {id}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold">Scene notes</div>
          <p className="mt-2 text-sm text-slate-300">
            View the details of incidents assigned to you, including location, notes, and dispatch instructions.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-cyan-300" />
            Location
          </div>
          <div className="mt-2 text-sm text-slate-300">Assigned zone and navigation context go here.</div>
        </div>
      </div>
    </div>
  );
}
