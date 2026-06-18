import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createIncident } from "@/lib/incidents.functions";
import { getActiveOrg, listLocations } from "@/lib/orgs.functions";
import * as offline from "@/lib/offlineQueue";
import { IncidentReportForm, type IncidentSubmitPayload } from "@/components/IncidentReportForm";
import { CloudUpload, WifiOff } from "lucide-react";

export const Route = createFileRoute("/officer/incident/new")({
  component: NewIncident,
});

function NewIncident() {
  const queryClient = useQueryClient();
  const create = useServerFn(createIncident);
  const fetchActiveOrg = useServerFn(getActiveOrg);
  const fetchLocations = useServerFn(listLocations);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [pending, setPending] = useState<offline.QueuedIncident[]>([]);

  const { data: activeOrg } = useQuery({ queryKey: ["officer-active-org"], queryFn: () => fetchActiveOrg() });
  const { data: savedLocations = [] } = useQuery({
    queryKey: ["officer-saved-locations"],
    queryFn: () => fetchLocations(),
    enabled: !!activeOrg,
  });
  const defaultZone = savedLocations[0]?.name || activeOrg?.name || "Unspecified";

  const refreshPending = () => setPending(offline.list());

  useEffect(() => {
    refreshPending();
    const goOnline = async () => {
      setOnline(true);
      const sent = await offline.flush((payload) => create({ data: payload }) as Promise<unknown>);
      if (sent > 0) queryClient.invalidateQueries({ queryKey: ["incidents"] });
      refreshPending();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    const unsub = offline.subscribe(refreshPending);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      unsub();
    };
  }, [create, queryClient]);

  const submitMut = useMutation({
    mutationFn: async (payload: IncidentSubmitPayload) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        offline.enqueue(payload);
        refreshPending();
        return { offline: true } as const;
      }
      await create({ data: payload });
      return { offline: false } as const;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });

  if (!activeOrg) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
        Loading organisation context...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Report</div>
        <h2 className="mt-2 text-2xl font-semibold">Quick incident report</h2>
        <p className="mt-2 text-sm text-slate-300">
          Fast entry flow for field officers. Reports use your org locations when available and queue locally when offline.
        </p>
      </section>

      <div className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${online ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}>
        <div className="flex items-center gap-2">
          {online ? <CloudUpload className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          <span>{online ? `${pending.length} incident${pending.length === 1 ? "" : "s"} pending sync.` : "Offline. Reports will queue locally."}</span>
        </div>
      </div>

      <IncidentReportForm
        organisationId={activeOrg.id}
        savedLocations={savedLocations}
        defaultZone={defaultZone}
        onSubmit={(payload) => submitMut.mutate(payload)}
        loading={submitMut.isPending}
        error={submitMut.error instanceof Error ? submitMut.error.message : null}
        onClose={() => window.history.back()}
      />
    </div>
  );
}
