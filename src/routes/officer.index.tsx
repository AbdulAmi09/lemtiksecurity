import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/officer/")({
  component: OfficerInstallIntro,
});

function OfficerInstallIntro() {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/20 via-white/5 to-transparent p-5 shadow-[0_24px_80px_rgba(8,17,31,0.45)]">
        <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/80">Install first</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Install Lemtik Officer App</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Add the app to your home screen for offline patrol access, faster dispatches, and a cleaner mobile workflow.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-2xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950">
            Install now
          </button>
          <Link to="/officer/home" className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white">
            Continue in browser
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card title="Offline-ready" body="Patrol check-ins, incident reports, and shift viewing stay usable when the connection is unstable." />
        <Card title="Permissions" body="Location, notifications, camera, and microphone requests are explained before they are needed." />
        <Card title="2G / 3G aware" body="Critical actions are kept light so the app remains responsive on common Nigerian network conditions." />
      </section>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}
