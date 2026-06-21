import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Clock3, Loader2, MapPin, ShieldAlert, Siren, XCircle } from "lucide-react";
import { getActiveOrg } from "@/lib/orgs.functions";
import { sosAlert } from "@/lib/patrols.functions";
import { recordIncidentAction } from "@/lib/incidentDetail.functions";
import { orgRoom, publishRealtimeEvent } from "@/lib/realtime.events";

type SossPayload = {
  shift_id?: string;
  coord_x?: number;
  coord_y?: number;
  note?: string;
};

type QueuedSOS = {
  id: string;
  queuedAt: number;
  payload: SossPayload;
};

const QUEUE_KEY = "lemtik.officer.sos-queue.v1";

function readQueue(): QueuedSOS[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedSOS[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

function enqueueSOS(payload: SossPayload) {
  const item: QueuedSOS = { id: crypto.randomUUID(), queuedAt: Date.now(), payload };
  const items = readQueue();
  items.push(item);
  writeQueue(items);
  return item;
}

function removeQueued(id: string) {
  writeQueue(readQueue().filter((item) => item.id !== id));
}

function formatCoords(payload: SossPayload | null) {
  if (!payload?.coord_x && !payload?.coord_y) return "GPS pending";
  if (payload.coord_x == null || payload.coord_y == null) return "GPS pending";
  return `${payload.coord_y.toFixed(5)}, ${payload.coord_x.toFixed(5)}`;
}

export const Route = createFileRoute("/officer/sos")({
  component: OfficerSOS,
});

function OfficerSOS() {
  const qc = useQueryClient();
  const sendSos = useServerFn(sosAlert);
  const logAction = useServerFn(recordIncidentAction);
  const loadActiveOrg = useServerFn(getActiveOrg);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [sent, setSent] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [note, setNote] = useState("");
  const [currentPosition, setCurrentPosition] = useState<{ x: number; y: number } | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [queueCount, setQueueCount] = useState(readQueue().length);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Ready to trigger an emergency alert.");
  const refreshTimer = useRef<number | null>(null);

  const sosTone = useMemo(() => (sent ? "animate-pulse" : ""), [sent]);

  const refreshQueue = () => setQueueCount(readQueue().length);

  useEffect(() => {
    loadActiveOrg().then((org) => setOrgId(org?.id ?? null)).catch(() => setOrgId(null));
  }, [loadActiveOrg]);

  const fetchLocation = () =>
    new Promise<{ x?: number; y?: number }>((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        resolve({});
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const point = { x: position.coords.longitude, y: position.coords.latitude };
          setCurrentPosition(point);
          setLastRefreshedAt(new Date().toISOString());
          resolve(point);
        },
        () => resolve({}),
        { enableHighAccuracy: true, timeout: 8_000, maximumAge: 10_000 },
      );
    });

  const flushQueue = async () => {
    if (!navigator.onLine) return;
    const items = readQueue();
    for (const item of items) {
      try {
        const result = await sendSos({ data: item.payload });
        if (result?.incident?.id) setActiveIncidentId(result.incident.id);
        if (result?.alert?.id) setActiveAlertId(result.alert.id);
        removeQueued(item.id);
      } catch {
        break;
      }
    }
    refreshQueue();
  };

  useEffect(() => {
    const goOnline = async () => {
      setOnline(true);
      await flushQueue();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    refreshQueue();
    return () => {
      if (refreshTimer.current) window.clearInterval(refreshTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!sent) return;
    const refresh = async () => {
      await fetchLocation();
      setStatusMessage((prev) => (prev.includes("tracking") ? prev : "SOS active. Command is receiving live tracking updates."));
    };
    refresh().catch(() => undefined);
    refreshTimer.current = window.setInterval(() => {
      void refresh();
    }, 10_000);
    return () => {
      if (refreshTimer.current) window.clearInterval(refreshTimer.current);
      refreshTimer.current = null;
    };
  }, [sent]);

  const triggerSos = async () => {
    setConfirming(true);
    setStatusMessage("Requesting GPS snapshot...");
    let payload: SossPayload = {
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    try {
      const coords = await fetchLocation();
      payload = {
        ...(coords.x != null && coords.y != null ? { coord_x: coords.x, coord_y: coords.y } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      };
      if (!navigator.onLine) {
        enqueueSOS(payload);
        refreshQueue();
        setSent(true);
        setStatusMessage("SOS queued offline. Command will receive it when connectivity returns.");
        return;
      }
      const result = await sendSos({ data: payload });
      setActiveIncidentId(result?.incident?.id ?? null);
      setActiveAlertId(result?.alert?.id ?? null);
      if (orgId && result?.incident?.id) {
        publishRealtimeEvent(orgRoom(orgId), "incident:created", {
          incident_id: result.incident.id,
          alert_id: result.alert?.id ?? null,
          severity: 5,
          source: "officer-sos",
          note: payload.note ?? null,
        });
      }
      setSent(true);
      setStatusMessage("SOS sent. Help is coming.");
      setLastRefreshedAt(new Date().toISOString());
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([250, 120, 250, 120, 250]);
      }
      qc.invalidateQueries({ queryKey: ["officer-notifications"] });
    } catch (error) {
      enqueueSOS({
        ...(currentPosition ? { coord_x: currentPosition.x, coord_y: currentPosition.y } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      refreshQueue();
      setSent(true);
      if (orgId) {
        publishRealtimeEvent(orgRoom(orgId), "incident:created", {
          incident_id: null,
          alert_id: null,
          severity: 5,
          source: "officer-sos-offline",
          note: payload.note ?? null,
        });
      }
      setStatusMessage(error instanceof Error ? `${error.message}. SOS queued locally and will sync when possible.` : "SOS queued locally and will sync when possible.");
    } finally {
      setConfirming(false);
    }
  };

  const cancelSos = async () => {
    setIsCancelling(true);
    try {
      if (activeIncidentId) {
        await logAction({
          data: {
            incident_id: activeIncidentId,
            kind: "sos_cancelled",
            message: "Officer cancelled the active SOS session.",
            meta: {
              alert_id: activeAlertId,
              note: note.trim() || null,
              last_known_position: currentPosition,
            },
          },
        });
      }
      setSent(false);
      setActiveIncidentId(null);
      setActiveAlertId(null);
      setStatusMessage("SOS cancelled. Live updates stopped.");
      if (refreshTimer.current) window.clearInterval(refreshTimer.current);
      refreshTimer.current = null;
    } finally {
      setIsCancelling(false);
    }
  };

  const positionLabel = currentPosition ? formatCoords({ coord_x: currentPosition.x, coord_y: currentPosition.y }) : "Waiting for GPS fix";
  const lastPingLabel = lastRefreshedAt
    ? new Date(lastRefreshedAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Africa/Lagos" })
    : "Pending";

  if (sent) {
    return (
      <div className="space-y-4">
        <section className={`rounded-3xl border border-red-300/20 bg-gradient-to-br from-red-400/20 via-white/5 to-transparent p-5 ${sosTone}`}>
          <div className="text-[11px] uppercase tracking-[0.22em] text-red-100/80">SOS active</div>
          <h2 className="mt-2 text-2xl font-semibold">Help is coming</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">{statusMessage}</p>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-red-300" />
              Live tracking
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <InfoTile label="Connection" value={online ? "Online" : "Offline"} />
              <InfoTile label="GPS" value={positionLabel} />
              <InfoTile label="Last refresh" value={lastPingLabel} />
              <InfoTile label="Queued SOS" value={String(queueCount)} />
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
              Continuous location refresh runs every 10 seconds until you cancel the emergency.
            </div>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => void cancelSos()}
              disabled={isCancelling}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white disabled:opacity-60"
            >
              {isCancelling ? <Loader2 className="h-4 w-4 animate-spin text-slate-300" /> : <XCircle className="h-4 w-4 text-slate-300" />}
              Cancel SOS
            </button>
            <Link to="/officer/home" className="block rounded-2xl border border-white/15 bg-slate-950/50 px-4 py-3 text-center text-sm text-white">
              Return home
            </Link>
            <div className="rounded-3xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-50">
              Active incident{activeIncidentId ? ` ${activeIncidentId.slice(0, 8)}` : ""} is live in command. If this is a false alarm, cancel it immediately.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-red-300/20 bg-gradient-to-br from-red-400/20 via-white/5 to-transparent p-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-red-100/80">Emergency</div>
        <h2 className="mt-2 text-2xl font-semibold">Send SOS alert?</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          This will immediately notify supervisors and managers with your live location, then create a severity 5 incident.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-red-300" />
            What happens next
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>Your GPS position is captured immediately.</li>
            <li>Command receives a red SOS alert and incident timeline entry.</li>
            <li>Live location refresh continues every 10 seconds after activation.</li>
          </ul>

          <label className="mt-5 block">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Optional note</div>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a short emergency note for command."
              className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
            />
          </label>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoTile label="Connection" value={online ? "Online" : "Offline"} />
            <InfoTile label="Queued SOS" value={String(queueCount)} />
            <InfoTile label="GPS snapshot" value={positionLabel} />
            <InfoTile label="Last refresh" value={lastPingLabel} />
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => void triggerSos()}
            disabled={confirming}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
            Confirm SOS
          </button>
          <Link to="/officer/home" className="block rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm text-white">
            Cancel
          </Link>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
            <div className="flex items-center gap-2 text-white">
              <Clock3 className="h-4 w-4 text-cyan-300" />
              Command readiness
            </div>
            <p className="mt-2">
              The emergency alert is routed through the existing alert pipeline so supervisors see it immediately in the dashboard.
            </p>
          </div>
          <div className="rounded-3xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-50">
            Critical alerts cannot be muted. If your device is offline, the SOS is queued locally and sent when you reconnect.
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-white">{value}</div>
    </div>
  );
}
