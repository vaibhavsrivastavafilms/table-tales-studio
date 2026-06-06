"use client";

import Link from "next/link";
import type { ExecutiveKpi } from "@/lib/os/owner/executive-dashboard";
import { kpiRoute } from "@/lib/os/owner/kpi-routes";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

function TrendBadge({ kpi }: { kpi: ExecutiveKpi }) {
  const isGood =
    kpi.trend === "flat" ||
    (kpi.goodWhenUp && kpi.trend === "up") ||
    (!kpi.goodWhenUp && kpi.trend === "down");
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        isGood ? "bg-emerald-500/12 text-emerald-700" : "bg-rose-500/12 text-rose-700"
      )}
    >
      {Math.abs(kpi.changePercent).toFixed(1)}%
    </span>
  );
}

export function ClickableKpiCard({ kpi }: { kpi: ExecutiveKpi }) {
  const route = kpiRoute(kpi);
  const inner = (
    <article className="os-exec-kpi group h-full cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--os-fg-muted-on-card)]">
          {kpi.label}
        </p>
        {route ? <ChevronRight className="h-4 w-4 text-[#C9A84C] opacity-60 group-hover:opacity-100" /> : null}
      </div>
      <p className="os-exec-kpi-value mt-3 tabular-nums">{kpi.display}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <TrendBadge kpi={kpi} />
        <span className="text-[11px] text-[var(--os-fg-muted-on-card)]">vs {kpi.previousDisplay}</span>
      </div>
      {route ? (
        <p className="mt-3 text-[11px] text-[var(--os-fg-muted-on-card)] opacity-0 transition group-hover:opacity-100">
          {route.summary}
        </p>
      ) : null}
    </article>
  );

  if (!route) return inner;
  return (
    <Link href={route.href} title={route.summary} className="block h-full">
      {inner}
    </Link>
  );
}

export function ClickableStatCard({
  label,
  value,
  href,
  summary,
}: {
  label: string;
  value: string | number;
  href: string;
  summary?: string;
}) {
  return (
    <Link href={href} title={summary ?? label} className="block">
      <article className="os-exec-kpi group h-full">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--os-fg-muted-on-card)]">
            {label}
          </p>
          <ChevronRight className="h-4 w-4 text-[#C9A84C] opacity-60 group-hover:opacity-100" />
        </div>
        <p className="os-exec-kpi-value mt-3 tabular-nums">{value}</p>
      </article>
    </Link>
  );
}
