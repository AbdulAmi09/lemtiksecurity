import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Home, MapPinned, Radio, ShieldAlert, MessageSquareMore, Navigation2, Menu } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/officer/home", label: "Home", icon: Home },
  { to: "/officer/patrol", label: "Patrol", icon: MapPinned },
  { to: "/officer/dispatch", label: "Dispatch", icon: Navigation2 },
  { to: "/officer/incident/new", label: "Report", icon: ShieldAlert },
  { to: "/officer/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/officer/notifications", label: "Alerts", icon: MessageSquareMore },
];

export function OfficerShell({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-[#08111f] text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col lg:flex-row">
        <aside className="border-b border-white/10 bg-slate-950/70 px-4 py-4 backdrop-blur lg:w-80 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-300/80">Officer PWA</div>
              <div className="mt-1 text-xl font-semibold tracking-tight">Lemtik Patrol</div>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/30">
              <Radio className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-200/80">Connection</div>
            <div className="mt-1 text-sm font-medium">Online sync ready</div>
            <div className="mt-2 text-xs text-slate-300">
              Critical actions queue automatically when the network drops and sync on reconnect.
            </div>
          </div>

          <nav className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {nav.map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors ${
                    active
                      ? "border-cyan-300/40 bg-cyan-300/15 text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 pb-24 sm:p-6 lg:p-8">
          <header className="mb-6 flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Field officer app</div>
              <h1 className="mt-1 text-lg font-semibold">Mobile-first patrol operations</h1>
            </div>
            <Menu className="h-5 w-5 text-slate-400 lg:hidden" />
          </header>
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
