import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function OsDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Today's sales", value: "—" },
          { label: "Open POs", value: "—" },
          { label: "Low stock SKUs", value: "—" },
          { label: "Food cost %", value: "—" },
        ].map((stat) => (
          <div key={stat.label} className="os-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--os-fg-subtle)]">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="os-card p-6 md:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--os-accent)]">
          Welcome
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">
          Table Tales OS
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--os-fg-muted)]">
          Premium hospitality operations shell — navigate via the sidebar to
          explore modules. Business logic and data integrations will ship in
          upcoming releases.
        </p>
      </div>
    </div>
  );
}
