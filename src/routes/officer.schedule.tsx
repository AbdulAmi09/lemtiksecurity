import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Clock3, MapPin, Repeat2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPatrols } from "@/lib/patrols.functions";

export const Route = createFileRoute("/officer/schedule")({
  component: OfficerSchedule,
});

function OfficerSchedule() {
  const listPat = useServerFn(listPatrols);
  const { data: patrols = [] } = useQuery({ queryKey: ["officer-schedule"], queryFn: () => listPat() });

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Schedule</div>
        <h2 className="mt-2 text-2xl font-semibold">Shift schedule</h2>
        <p className="mt-2 text-sm text-slate-300">Upcoming patrol assignments and their start windows.</p>
      </section>

      <div className="grid gap-3">
        {patrols.slice(0, 4).map((patrol) => (
          <div key={patrol.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{patrol.name}</div>
                <div className="mt-1 text-sm text-slate-300">{patrol.officer}</div>
              </div>
              <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
                {patrol.status.replace("_", " ")}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Info icon={<CalendarDays className="h-4 w-4 text-cyan-300" />} label="Shift" value={patrol.shift} />
              <Info icon={<MapPin className="h-4 w-4 text-cyan-300" />} label="Waypoints" value={`${patrol.waypoints}`} />
              <Info icon={<Clock3 className="h-4 w-4 text-cyan-300" />} label="Check-in" value={patrol.next_check_in ?? "—"} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
        <div className="flex items-center gap-2 font-semibold text-white">
          <Repeat2 className="h-4 w-4 text-cyan-300" />
          Offline-safe scheduling
        </div>
        <p className="mt-2">
          This view is designed to stay readable even when the network is unstable.
        </p>
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-400">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  );
}
