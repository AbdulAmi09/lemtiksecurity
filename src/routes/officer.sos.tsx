import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, MapPin, ShieldAlert, XCircle } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/officer/sos")({
  component: OfficerSOS,
});

function OfficerSOS() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="space-y-4">
        <section className="rounded-3xl border border-red-300/20 bg-gradient-to-br from-red-400/20 via-white/5 to-transparent p-5">
          <div className="text-[11px] uppercase tracking-[0.22em] text-red-100/80">SOS sent</div>
          <h2 className="mt-2 text-2xl font-semibold">Help is coming</h2>
          <p className="mt-2 text-sm text-slate-300">
            Your location has been shared and supervisors have been notified.
          </p>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-red-300" />
              Live tracking
            </div>
            <p className="mt-2 text-sm text-slate-300">
              Continuous location updates are active while the emergency is open.
            </p>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setSent(false)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            >
              <XCircle className="h-4 w-4 text-slate-300" />
              Cancel SOS
            </button>
            <Link to="/officer/home" className="block rounded-2xl border border-white/15 bg-slate-950/50 px-4 py-3 text-center text-sm text-white">
              Return home
            </Link>
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
          This will immediately notify all supervisors and managers of your location and status.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-red-300" />
            What happens next
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>Your GPS position is shared instantly.</li>
            <li>A severity 5 incident is created automatically.</li>
            <li>Control room gets the escalation immediately.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setSent(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white"
          >
            <ShieldAlert className="h-4 w-4" />
            Confirm SOS
          </button>
          <Link to="/officer/home" className="block rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm text-white">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
