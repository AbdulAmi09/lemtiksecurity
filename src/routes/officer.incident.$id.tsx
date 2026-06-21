import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Clock3, Link as LinkIcon, MapPin, Paperclip, ShieldAlert, Sparkles, TriangleAlert } from "lucide-react";
import { getIncidentDetail } from "@/lib/incidentDetail.functions";
import { SeverityBadge } from "@/components/SeverityBadge";

type DetailTab = "overview" | "analysis" | "activity" | "evidence" | "escalation" | "related";

export const Route = createFileRoute("/officer/incident/$id")({
  component: OfficerIncidentDetail,
});

function OfficerIncidentDetail() {
  const { id } = Route.useParams() as { id: string };
  const [tab, setTab] = useState<DetailTab>("overview");
  const getDetail = useServerFn(getIncidentDetail);

  const { data, isLoading, error } = useQuery({
    queryKey: ["officer-incident-detail", id],
    queryFn: () => getDetail({ data: { id } }) as Promise<any>,
  });

  const tabs = useMemo(
    () =>
      [
        ["overview", "Overview"],
        ["analysis", "AI Analysis"],
        ["activity", "Activity Log"],
        ["evidence", "Evidence"],
        ["escalation", "Escalation History"],
        ["related", "Related Incidents"],
      ] as const,
    [],
  );

  if (isLoading) {
    return <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">Loading incident...</div>;
  }

  if (error || !data) {
    return <div className="rounded-3xl border border-red-300/20 bg-red-300/10 p-5 text-sm text-red-50">Failed to load incident.</div>;
  }

  const incident = data.incident as any;
  const activity = (data.activity as any[]) ?? [];
  const notes = (data.notes as any[]) ?? [];
  const escalations = (data.escalations as any[]) ?? [];
  const linkedIncidents = (data.linkedIncidents as any[]) ?? [];
  const suggested = (data.suggested as any[]) ?? [];
  const evidence = Array.isArray(incident.evidence) ? incident.evidence : [];
  const reportedAt = new Date(incident.reported_at);

  return (
    <div className="space-y-4">
      <Link to="/officer/home" className="inline-flex items-center gap-2 text-sm text-cyan-200">
        <ArrowLeft className="h-4 w-4" />
        Back home
      </Link>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Own incident view</div>
            <h2 className="mt-2 text-2xl font-semibold">{incident.title || "Incident detail"}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs text-slate-200">
                {incident.code || id.slice(0, 8)}
              </span>
              <SeverityBadge severity={Number(incident.severity) as any} />
              <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs text-slate-200">
                {incident.status}
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Timing</div>
            <div className="mt-1">{reportedAt.toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}</div>
            <div className="mt-1 text-xs text-slate-400">Reported by {incident.reported_by || "Unknown"}</div>
          </div>
        </div>
      </section>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
                tab === key ? "bg-cyan-300/20 text-cyan-100" : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-cyan-300" />
              Location
            </div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
              <div className="font-medium text-white">{incident.location || "Location unavailable"}</div>
              <div className="mt-1">{incident.zone || "Zone not set"}</div>
              {incident.floor ? <div className="mt-1">Floor / level: {incident.floor}</div> : null}
              {incident.coord_x != null && incident.coord_y != null ? (
                <div className="mt-1 text-xs text-slate-400">
                  Coordinates: {Number(incident.coord_y).toFixed(5)}, {Number(incident.coord_x).toFixed(5)}
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold text-white">Description</div>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-300">
                {incident.description || "No description recorded."}
              </p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <MetaCard label="Reported by" value={incident.reported_by || "Unknown"} />
              <MetaCard label="Assigned officer" value={incident.officer || "Unassigned"} />
              <MetaCard label="People involved" value={incident.suspect_count != null ? `${incident.suspect_count} suspect(s)` : "Not recorded"} />
              <MetaCard label="Open since" value={since(incident.reported_at)} />
            </div>
          </section>

          <section className="space-y-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldAlert className="h-4 w-4 text-red-300" />
                Command guidance
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                This own-incident view is read-only for field officers. Use the command dashboard for dispatch, reassignment, and approvals.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock3 className="h-4 w-4 text-cyan-300" />
                Timeline summary
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <div>Reported: {reportedAt.toLocaleTimeString("en-NG", { timeZone: "Africa/Lagos" })}</div>
                <div>Last update: {activity[activity.length - 1]?.created_at ? since(activity[activity.length - 1].created_at) : "No updates yet"}</div>
                <div>Notes: {notes.length}</div>
                <div>Escalations: {escalations.length}</div>
              </div>
            </div>
          </section>
        </div>
      )}

      {tab === "analysis" && (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            AI Analysis
          </div>
          <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Threat assessment</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {incident.severity >= 5
                  ? "Critical event. Treat as high-priority until command confirms containment."
                  : incident.severity >= 4
                    ? "High-priority incident with elevated response requirements."
                    : "Monitor and continue structured response."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Recommended posture</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Keep communications clear, preserve evidence, and wait for command confirmation before changing status or closing the incident.
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-50">
            Any action recommendations already taken will appear in the command timeline and incident activity log.
          </div>
        </section>
      )}

      {tab === "activity" && (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold">Activity log</div>
          <div className="mt-4 space-y-3">
            {activity.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">No activity yet.</div>
            ) : (
              activity.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="font-medium text-white">{item.message}</div>
                    <div className="text-xs text-slate-400">{new Date(item.created_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}</div>
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{item.kind}</div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {tab === "evidence" && (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Paperclip className="h-4 w-4 text-cyan-300" />
            Evidence
          </div>
          <div className="mt-4 grid gap-3">
            {evidence.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">No evidence attached.</div>
            ) : (
              evidence.map((item: any, index: number) => (
                <div key={`${item.path}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.kind} · {Math.round((item.size ?? 0) / 1024)} KB</div>
                    </div>
                    {item.legal ? (
                      <span className="rounded-full border border-red-300/20 bg-red-300/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-red-50">
                        Legal evidence
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">{item.path}</div>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-cyan-200">
                      Open file <LinkIcon className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {tab === "escalation" && (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold">Escalation history</div>
          <div className="mt-4 space-y-3">
            {escalations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">No escalation recorded.</div>
            ) : (
              escalations.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-white">{item.target?.toUpperCase?.() || "ESCALATION"}</div>
                    <div className="text-xs text-slate-400">{new Date(item.created_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}</div>
                  </div>
                  <div className="mt-2 text-sm text-slate-300">{item.message}</div>
                  <div className="mt-1 text-xs text-slate-500">Outcome: {item.acknowledged ? "Acknowledged" : "Pending"}</div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {tab === "related" && (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <TriangleAlert className="h-4 w-4 text-cyan-300" />
            Related incidents
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Linked</div>
              <div className="mt-3 space-y-2">
                {linkedIncidents.length === 0 ? (
                  <div className="text-sm text-slate-300">No linked incidents.</div>
                ) : (
                  linkedIncidents.map((item) => (
                    <Link key={item.id} to="/officer/incident/$id" params={{ id: item.id }} className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                      {item.code || item.id.slice(0, 8)} · {item.type} · S{item.severity}
                    </Link>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Suggested</div>
              <div className="mt-3 space-y-2">
                {suggested.length === 0 ? (
                  <div className="text-sm text-slate-300">No suggestions available.</div>
                ) : (
                  suggested.map((item) => (
                    <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                      {item.code || item.id.slice(0, 8)} · {item.type} · {item.location}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function since(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
