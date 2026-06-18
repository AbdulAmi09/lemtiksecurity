import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BellRing, ShieldAlert, Clock3, MessageSquareMore } from "lucide-react";
import { listMyNotifications } from "@/lib/alerts.functions";

const items = [
  { title: "Dispatch ping", body: "You were dispatched to Gate 3.", read: false, href: "/officer/incident/LEM-2041" },
  { title: "Shift reminder", body: "Morning patrol starts at 07:00.", read: true, href: "/officer/schedule" },
  { title: "Check-in warning", body: "Your next checkpoint is in 4 minutes.", read: false, href: "/officer/patrol" },
];

export const Route = createFileRoute("/officer/notifications")({
  component: OfficerNotifications,
});

function OfficerNotifications() {
  const listNotifs = useServerFn(listMyNotifications);
  const { data: notifications = [] } = useQuery({
    queryKey: ["officer-notifications-page"],
    queryFn: () => listNotifs(),
    refetchInterval: 30_000,
  });
  const [settings, setSettings] = useState({
    dispatches: true,
    shiftReminders: true,
    supervisorMessages: true,
    quietHours: true,
  });

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Notifications</div>
        <h2 className="mt-2 text-2xl font-semibold">Alerts and pings</h2>
        <p className="mt-2 text-sm text-slate-300">Dispatches, reminders, and messages from supervisors.</p>
      </section>

      <div className="space-y-3">
        {(notifications.length > 0
          ? notifications.map((item: any) => ({
              id: item.id,
              title: item.title,
              body: item.body ?? item.action ?? "",
              read: item.read,
              href: item.incident_id ? `/officer/incident/${item.incident_id}` : "/officer/home",
            }))
          : items).map((item) => (
          <Link key={item.id ?? item.title} to={item.href} className={`block rounded-3xl border p-5 ${item.read ? "border-white/10 bg-white/5" : "border-cyan-300/20 bg-cyan-300/10"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950/40">
                  {item.title === "Dispatch ping" ? <ShieldAlert className="h-4 w-4 text-cyan-300" /> : item.title === "Shift reminder" ? <Clock3 className="h-4 w-4 text-cyan-300" /> : <MessageSquareMore className="h-4 w-4 text-cyan-300" />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <div className="mt-1 text-sm text-slate-300">{item.body}</div>
                </div>
              </div>
              <BellRing className="h-4 w-4 text-cyan-300" />
            </div>
          </Link>
        ))}
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Notification settings</div>
        <div className="mt-4 grid gap-3">
          <ToggleRow
            label="Dispatches"
            description="Critical pings and assignments."
            checked={settings.dispatches}
            onChange={(checked) => setSettings((s) => ({ ...s, dispatches: checked }))}
          />
          <ToggleRow
            label="Shift reminders"
            description="Upcoming patrol and check-in reminders."
            checked={settings.shiftReminders}
            onChange={(checked) => setSettings((s) => ({ ...s, shiftReminders: checked }))}
          />
          <ToggleRow
            label="Supervisor messages"
            description="Direct messages from command staff."
            checked={settings.supervisorMessages}
            onChange={(checked) => setSettings((s) => ({ ...s, supervisorMessages: checked }))}
          />
          <ToggleRow
            label="Quiet hours"
            description="Mute non-critical alerts during rest periods."
            checked={settings.quietHours}
            onChange={(checked) => setSettings((s) => ({ ...s, quietHours: checked }))}
          />
        </div>
        <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm text-red-100">
          Critical alerts, SOS, and dispatch notifications cannot be muted.
        </div>
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="mt-1 text-xs text-slate-400">{description}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`h-7 w-12 rounded-full border transition-colors ${checked ? "border-cyan-300/40 bg-cyan-300/30" : "border-white/15 bg-slate-800"}`}
      >
        <span className={`block h-6 w-6 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </label>
  );
}
