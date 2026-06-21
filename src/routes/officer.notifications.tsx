import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquareMore,
  Save,
  ShieldAlert,
} from "lucide-react";
import {
  getAlertPreferences,
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateAlertPreferences,
} from "@/lib/alerts.functions";

type NotificationRow = {
  id: string;
  title: string;
  body?: string | null;
  severity: number;
  sent_at: string;
  incident_id?: string | null;
  read?: boolean;
  alert_type?: string | null;
};

const OFFICER_GROUPS = {
  dispatches: ["incident_assigned", "incident_critical", "incident_high", "sos"],
  shiftReminders: ["missed_checkin", "prolonged_missed", "shift_start", "shift_handover"],
  commandUpdates: ["daily_summary", "weekly_brief", "osint_threat", "inventory_threshold", "system_test"],
} as const;

export const Route = createFileRoute("/officer/notifications")({
  component: OfficerNotifications,
});

function OfficerNotifications() {
  const qc = useQueryClient();
  const listNotifs = useServerFn(listMyNotifications);
  const markRead = useServerFn(markNotificationRead);
  const markAll = useServerFn(markAllNotificationsRead);
  const getPrefs = useServerFn(getAlertPreferences);
  const updatePrefs = useServerFn(updateAlertPreferences);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["officer-notifications-page"],
    queryFn: () => listNotifs() as Promise<NotificationRow[]>,
    refetchInterval: 30_000,
  });
  const { data: prefs } = useQuery({
    queryKey: ["officer-alert-prefs"],
    queryFn: () => getPrefs(),
  });

  const unreadCount = notifications.filter((item) => !item.read).length;
  const preview = useMemo(() => notifications.slice(0, 5), [notifications]);

  const [dispatches, setDispatches] = useState(true);
  const [shiftReminders, setShiftReminders] = useState(true);
  const [commandUpdates, setCommandUpdates] = useState(true);
  const [quietHours, setQuietHours] = useState(true);
  const [quietStart, setQuietStart] = useState("23:00");
  const [quietEnd, setQuietEnd] = useState("06:00");
  const [language, setLanguage] = useState<"en" | "pcm">("en");
  const [channelMap, setChannelMap] = useState<Record<string, string[]>>({});
  const [extraRecipients, setExtraRecipients] = useState<Array<{ label: string; phone: string; channels: string[]; severity_floor: number }>>([]);

  useEffect(() => {
    if (!prefs) return;
    const enabled = new Set(prefs.enabled_types ?? []);
    setDispatches(OFFICER_GROUPS.dispatches.some((item) => enabled.has(item)));
    setShiftReminders(OFFICER_GROUPS.shiftReminders.some((item) => enabled.has(item)));
    setCommandUpdates(OFFICER_GROUPS.commandUpdates.some((item) => enabled.has(item)));
    setQuietHours((prefs.quiet_hours as { enabled: boolean } | undefined)?.enabled ?? true);
    setQuietStart((prefs.quiet_hours as { start: string } | undefined)?.start ?? "23:00");
    setQuietEnd((prefs.quiet_hours as { end: string } | undefined)?.end ?? "06:00");
    setLanguage((prefs.language as "en" | "pcm") ?? "en");
    setChannelMap((prefs.channel_map as Record<string, string[]>) ?? {});
    setExtraRecipients((prefs.extra_recipients as Array<{ label: string; phone: string; channels: string[]; severity_floor: number }>) ?? []);
  }, [prefs]);

  const readMut = useMutation({
    mutationFn: (id: string) => markRead({ data: { alert_id: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["officer-notifications-page"] }),
  });
  const allMut = useMutation({
    mutationFn: () => markAll(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["officer-notifications-page"] });
    },
  });
  const savePrefs = useMutation({
    mutationFn: () =>
      updatePrefs({
        data: {
          enabled_types: [
            ...(dispatches ? OFFICER_GROUPS.dispatches : []),
            ...(shiftReminders ? OFFICER_GROUPS.shiftReminders : []),
            ...(commandUpdates ? OFFICER_GROUPS.commandUpdates : []),
          ],
          channel_map: channelMap,
          quiet_hours: { enabled: quietHours, start: quietStart, end: quietEnd },
          extra_recipients: extraRecipients,
          language,
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["officer-alert-prefs"] }),
  });

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Notifications</div>
        <h2 className="mt-2 text-2xl font-semibold">Alerts and pings</h2>
        <p className="mt-2 text-sm text-slate-300">
          Dispatches, reminders, supervisor messages, and critical incident alerts in one view.
        </p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-200">
          <BellRing className="h-4 w-4 text-cyan-300" />
          <span>{unreadCount} unread alert{unreadCount === 1 ? "" : "s"}</span>
        </div>
        <button
          type="button"
          onClick={() => allMut.mutate()}
          disabled={!unreadCount || allMut.isPending}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {allMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Mark all read
        </button>
      </div>

      <div className="space-y-3">
        {(isLoading ? [] : preview).map((item) => (
          <NotificationCard
            key={item.id}
            item={item}
            onRead={() => readMut.mutate(item.id)}
          />
        ))}
        {!isLoading && preview.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-slate-300">
            No notifications yet.
          </div>
        )}
        {isLoading && (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-slate-300">
            Loading notifications...
          </div>
        )}
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Notification settings</div>
            <h3 className="mt-2 text-lg font-semibold">Control what reaches your phone</h3>
          </div>
          <button
            type="button"
            onClick={() => savePrefs.mutate()}
            disabled={savePrefs.isPending}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {savePrefs.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save preferences
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <ToggleRow
            label="Dispatches"
            description="Incident assignments and SOS dispatches."
            checked={dispatches}
            onChange={setDispatches}
          />
          <ToggleRow
            label="Shift reminders"
            description="Upcoming patrol, check-in, and handover alerts."
            checked={shiftReminders}
            onChange={setShiftReminders}
          />
          <ToggleRow
            label="Command updates"
            description="Supervisor messages, summaries, and system notices."
            checked={commandUpdates}
            onChange={setCommandUpdates}
          />
          <ToggleRow
            label="Quiet hours"
            description="Mute non-critical alerts during rest periods."
            checked={quietHours}
            onChange={setQuietHours}
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Quiet start</div>
            <input
              type="time"
              value={quietStart}
              onChange={(event) => setQuietStart(event.target.value)}
              className="mt-2 w-full bg-transparent text-sm text-white outline-none"
            />
          </label>
          <label className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Quiet end</div>
            <input
              type="time"
              value={quietEnd}
              onChange={(event) => setQuietEnd(event.target.value)}
              className="mt-2 w-full bg-transparent text-sm text-white outline-none"
            />
          </label>
          <label className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Language</div>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as "en" | "pcm")}
              className="mt-2 w-full bg-transparent text-sm text-white outline-none"
            >
              <option value="en">English</option>
              <option value="pcm">Pidgin</option>
            </select>
          </label>
        </div>

        <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm text-red-50">
          Critical alerts, SOS, and dispatch notifications cannot be muted.
        </div>
      </section>
    </div>
  );
}

function NotificationCard({
  item,
  onRead,
}: {
  item: NotificationRow;
  onRead: () => void;
}) {
  const icon = item.alert_type?.includes("sos") || item.severity >= 5
    ? ShieldAlert
    : item.alert_type?.includes("shift")
      ? Clock3
      : MessageSquareMore;
  const Icon = icon;

  return (
    <article className={`rounded-3xl border p-5 ${item.read ? "border-white/10 bg-white/5" : "border-cyan-300/20 bg-cyan-300/10"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950/40">
            <Icon className="h-4 w-4 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-white">{item.title}</div>
              {!item.read && <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-cyan-100">Unread</span>}
            </div>
            <div className="mt-1 text-sm text-slate-300">{item.body}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span>{new Date(item.sent_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos", hour12: false })}</span>
              <span>·</span>
              <span>{item.read ? "Read" : "Unread"}</span>
              <span>·</span>
              <span>Severity {item.severity}</span>
            </div>
          </div>
        </div>
        <BellRing className="h-4 w-4 text-cyan-300" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.incident_id ? (
          <Link
            to="/officer/incident/$id"
            params={{ id: item.incident_id }}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-white"
          >
            View incident
          </Link>
        ) : (
          <Link
            to="/officer/home"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-white"
          >
            Open home
          </Link>
        )}
        {!item.read && (
          <button
            type="button"
            onClick={onRead}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark read
          </button>
        )}
      </div>
    </article>
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
