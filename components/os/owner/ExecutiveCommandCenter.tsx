"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Minus,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { formatInr } from "@/components/os/procurement/ProcurementUi";
import { formatPaise } from "@/lib/os/money";
import { canReviewApproval, listPendingApprovals } from "@/lib/os/approvals/engine";
import {
  buildExecutiveDashboard,
  type ExecutiveKpi,
  type HealthMetric,
} from "@/lib/os/owner/executive-dashboard";
import { getProcurementRole } from "@/lib/os/procurement/permissions";
import type { ApprovalType, OrgInsight, PnlPeriod } from "@/lib/os/procurement/types";
import { cn } from "@/lib/utils";

const APPROVAL_LABELS: Record<ApprovalType, string> = {
  purchase: "Purchases",
  expense: "Expenses",
  credit_note: "Credit Notes",
  inventory_adjustment: "Inventory",
  payroll: "Payroll",
};

function TrendBadge({ kpi }: { kpi: ExecutiveKpi }) {
  const isGood =
    kpi.trend === "flat" ||
    (kpi.goodWhenUp && kpi.trend === "up") ||
    (!kpi.goodWhenUp && kpi.trend === "down");
  const Icon =
    kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        isGood
          ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
          : "bg-rose-500/12 text-rose-700 dark:text-rose-300"
      )}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(kpi.changePercent).toFixed(1)}%
    </span>
  );
}

function KpiCard({ kpi }: { kpi: ExecutiveKpi }) {
  return (
    <article className="os-exec-kpi group">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--os-fg-muted-on-card)]">
        {kpi.label}
      </p>
      <p className="os-exec-kpi-value mt-3 tabular-nums">{kpi.display}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <TrendBadge kpi={kpi} />
        <span className="text-[11px] text-[var(--os-fg-muted-on-card)]">
          vs {kpi.previousDisplay}
        </span>
      </div>
    </article>
  );
}

function HealthGrid({ title, metrics }: { title: string; metrics: HealthMetric[] }) {
  return (
    <section className="os-exec-panel">
      <h3 className="os-exec-section-title">{title}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((m) => {
          const inner = (
            <div
              className={cn(
                "os-exec-health-card",
                m.severity === "critical" && "os-exec-health-critical",
                m.severity === "warning" && "os-exec-health-warning",
                m.severity === "positive" && "os-exec-health-positive"
              )}
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--os-fg-muted-on-card)]">
                {m.label}
              </p>
              <p className="mt-2 text-lg font-semibold tabular-nums">{m.value}</p>
              {m.hint ? (
                <p className="mt-1 text-xs text-[var(--os-fg-muted-on-card)]">{m.hint}</p>
              ) : null}
            </div>
          );
          return m.href ? (
            <Link key={m.label} href={m.href} className="block transition hover:opacity-90">
              {inner}
            </Link>
          ) : (
            <div key={m.label}>{inner}</div>
          );
        })}
      </div>
    </section>
  );
}

function InsightCard({ insight }: { insight: OrgInsight }) {
  const tone =
    insight.severity === "critical"
      ? "border-rose-200/80 bg-rose-50/80"
      : insight.severity === "warning"
        ? "border-amber-200/80 bg-amber-50/80"
        : "border-[var(--os-border)] bg-white/60";

  return (
    <div className={cn("rounded-xl border p-4", tone)}>
      <p className="text-sm font-medium leading-snug">{insight.detail}</p>
      <p className="mt-2 text-[11px] uppercase tracking-wide text-[var(--os-fg-muted-on-card)]">
        {insight.title}
      </p>
    </div>
  );
}

function ProfitabilityPanel({
  period,
  onPeriodChange,
  data,
}: {
  period: PnlPeriod;
  onPeriodChange: (p: PnlPeriod) => void;
  data: ReturnType<typeof buildExecutiveDashboard>["profitability"];
}) {
  const max = Math.max(data.revenue, 1);
  const bars = [
    { label: "Revenue", value: data.revenue, color: "bg-emerald-500" },
    { label: "Food Cost", value: data.foodCost, color: "bg-amber-500" },
    { label: "Labor", value: data.laborCost, color: "bg-blue-500" },
    { label: "Expenses", value: data.expenses, color: "bg-violet-500" },
    { label: "Net Profit", value: data.netProfit, color: "bg-[var(--os-terracotta)]" },
  ];

  return (
    <section className="os-exec-panel">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="os-exec-section-title">Profitability</h3>
          <p className="mt-1 text-sm text-[var(--os-fg-muted-on-card)]">
            Gross {formatInr(data.grossProfit)} · Net margin {data.profitPercent.toFixed(1)}%
          </p>
        </div>
        <div className="flex rounded-full border border-[var(--os-border)] p-0.5">
          {(["daily", "weekly", "monthly"] as PnlPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium capitalize transition",
                period === p
                  ? "bg-[var(--os-terracotta)] text-white"
                  : "text-[var(--os-fg-muted-on-card)] hover:bg-black/5"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-8 flex h-48 items-end gap-3 sm:gap-4">
        {bars.map((bar) => (
          <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-[10px] font-medium tabular-nums text-[var(--os-fg-muted-on-card)]">
              {formatCompact(bar.value)}
            </span>
            <div
              className={cn("w-full max-w-[4rem] rounded-t-lg transition-all", bar.color)}
              style={{ height: `${Math.max(8, (Math.abs(bar.value) / max) * 100)}%` }}
            />
            <span className="text-center text-[10px] font-medium">{bar.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatCompact(n: number): string {
  if (Math.abs(n) >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (Math.abs(n) >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${Math.round(n)}`;
}

export default function ExecutiveCommandCenter() {
  const { db, activeBranchId, reviewApprovalRequest } = useProcurement();
  const [pnlPeriod, setPnlPeriod] = useState<PnlPeriod>("monthly");
  const role = typeof window !== "undefined" ? getProcurementRole() : "owner";

  const data = useMemo(
    () => buildExecutiveDashboard(db, activeBranchId, pnlPeriod),
    [db, activeBranchId, pnlPeriod]
  );

  const pendingFlat = useMemo(
    () => listPendingApprovals(db, activeBranchId).slice(0, 6),
    [db, activeBranchId]
  );

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 pb-12">
      {/* Mobile priority strip — visible without scrolling */}
      <div className="os-exec-mobile-priority lg:hidden">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide opacity-80">Sales</p>
            <p className="text-xl font-bold tabular-nums">{data.mobilePriority.sales}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide opacity-80">Profit</p>
            <p className="text-xl font-bold tabular-nums">{data.mobilePriority.profit}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide opacity-80">Food cost</p>
            <p className="text-lg font-semibold tabular-nums">{data.mobilePriority.foodCost}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide opacity-80">Labor</p>
            <p className="text-lg font-semibold tabular-nums">{data.mobilePriority.laborCost}</p>
          </div>
        </div>
        {data.mobilePriority.pendingApprovals > 0 ? (
          <Link
            href="/os/approvals"
            className="mt-3 flex items-center justify-between rounded-lg bg-white/15 px-3 py-2 text-sm font-medium"
          >
            {data.mobilePriority.pendingApprovals} pending approvals
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
        {data.mobilePriority.topInsight ? (
          <p className="mt-3 text-sm leading-snug opacity-95">{data.mobilePriority.topInsight}</p>
        ) : null}
      </div>

      {/* Header */}
      <header className="os-exec-hero">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--os-accent)]">
            Executive Command Center
          </p>
          <h1 className="os-brand mt-2 text-3xl leading-tight sm:text-4xl">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}
          </h1>
          <p className="mt-2 text-sm text-[var(--os-fg-muted)]">{todayLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/os/reports/pnl" className="os-exec-pill">
            P&L Report
          </Link>
          <Link href="/os/reports/ai-insights" className="os-exec-pill">
            Full AI Insights
          </Link>
        </div>
      </header>

      {/* SECTION 1 — Executive Snapshot */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="os-exec-section-title">Executive Snapshot</h2>
            <p className="mt-1 text-sm text-[var(--os-fg-muted)]">
              The numbers that matter — right now
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.snapshot.map((kpi) => (
            <KpiCard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </section>

      {/* SECTION 2 — Branch Performance */}
      <section className="os-exec-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="os-exec-section-title">Branch Performance</h2>
            <p className="mt-1 text-sm text-[var(--os-fg-muted-on-card)]">
              Outlet comparison · {new Date().toLocaleDateString("en-IN", { month: "long" })}
            </p>
          </div>
          {data.branchPerformance.best && data.branchPerformance.worst ? (
            <div className="flex flex-wrap gap-2">
              <span className="os-exec-badge-positive inline-flex items-center gap-1">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Best: {data.branchPerformance.best.shortName}
              </span>
              <span className="os-exec-badge-warning inline-flex items-center gap-1">
                <ArrowDownRight className="h-3.5 w-3.5" />
                Needs focus: {data.branchPerformance.worst.shortName}
              </span>
            </div>
          ) : null}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {data.branchPerformance.rows.map((b) => (
            <article
              key={b.branchId}
              className={cn(
                "os-exec-branch-card",
                b.rank === 1 && "os-exec-branch-best",
                b.rank === data.branchPerformance.rows.length &&
                  data.branchPerformance.rows.length > 1 &&
                  "os-exec-branch-worst"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{b.shortName}</p>
                <span className="text-xs font-bold text-[var(--os-fg-muted-on-card)]">
                  #{b.rank}
                </span>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--os-fg-muted-on-card)]">Sales</dt>
                  <dd className="font-medium tabular-nums">{formatInr(b.sales)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--os-fg-muted-on-card)]">Profit</dt>
                  <dd className="font-medium tabular-nums">{formatInr(b.profit)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--os-fg-muted-on-card)]">Food / Labor</dt>
                  <dd className="font-medium tabular-nums">
                    {b.foodCostPercent.toFixed(0)}% / {b.laborCostPercent.toFixed(0)}%
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--os-fg-muted-on-card)]">Outstanding</dt>
                  <dd className="font-medium tabular-nums">{formatInr(b.vendorOutstanding)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      {/* Middle — Business Health */}
      <div className="space-y-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--os-fg-muted)]">
          Business Health
        </p>

        {/* SECTION 3 — AI Insights */}
        <section className="os-exec-panel os-exec-ai-panel">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--os-terracotta)]" />
            <h2 className="os-exec-section-title">Owner AI Insights</h2>
          </div>
          <p className="mt-1 text-sm text-[var(--os-fg-muted-on-card)]">
            Proactive signals across food cost, vendors, branches, and profit
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {data.aiInsights.length ? (
              data.aiInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))
            ) : (
              <p className="text-sm text-[var(--os-fg-muted-on-card)]">
                All clear — no critical insights right now.
              </p>
            )}
          </div>
        </section>

        {/* SECTION 4 — Profitability */}
        <ProfitabilityPanel
          period={pnlPeriod}
          onPeriodChange={setPnlPeriod}
          data={data.profitability}
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <HealthGrid title="Procurement Health" metrics={data.procurementHealth} />
          <HealthGrid title="Inventory Health" metrics={data.inventoryHealth} />
          <HealthGrid title="Workforce Health" metrics={data.workforceHealth} />
          <HealthGrid title="Finance Health" metrics={data.financeHealth} />
        </div>
      </div>

      {/* Bottom — Action Center */}
      <div className="space-y-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--os-fg-muted)]">
          Action Center
        </p>

        {/* SECTION 5 — Pending Actions */}
        <section className="os-exec-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="os-exec-section-title">Pending Actions</h2>
              <p className="mt-1 text-sm text-[var(--os-fg-muted-on-card)]">
                Approval queue · one-click decisions
              </p>
            </div>
            <Link href="/os/approvals" className="os-exec-pill-on-card">
              View all ({data.pendingActions.total})
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(Object.keys(APPROVAL_LABELS) as ApprovalType[]).map((type) => {
              const count = data.pendingActions.byType[type].length;
              if (!count) return null;
              return (
                <span key={type} className="os-exec-count-badge">
                  {APPROVAL_LABELS[type]}
                  <span className="ml-1.5 rounded-full bg-[var(--os-terracotta)] px-1.5 py-0.5 text-[10px] text-white">
                    {count}
                  </span>
                </span>
              );
            })}
          </div>

          <div className="mt-5 space-y-3">
            {pendingFlat.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--os-border)] bg-white/50 p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium">{req.entityLabel}</p>
                  <p className="text-xs text-[var(--os-fg-muted-on-card)]">
                    {APPROVAL_LABELS[req.type]} · {formatPaise(req.amountPaise)}
                  </p>
                </div>
                {canReviewApproval(role, req) ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => reviewApprovalRequest(req.id, "approved")}>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => reviewApprovalRequest(req.id, "rejected", "Rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
            {!pendingFlat.length ? (
              <p className="py-6 text-center text-sm text-[var(--os-fg-muted-on-card)]">
                No pending approvals — you&apos;re caught up.
              </p>
            ) : null}
          </div>
        </section>

        {/* SECTION 10 — Today's Operations */}
        <section className="os-exec-panel">
          <h2 className="os-exec-section-title">Today&apos;s Operations</h2>
          <p className="mt-1 text-sm text-[var(--os-fg-muted-on-card)]">
            Live activity across procurement, sales, and workforce
          </p>
          <div className="mt-6 space-y-0">
            {data.activityFeed.length ? (
              data.activityFeed.map((item, idx) => (
                <div key={item.id} className="os-exec-timeline-row">
                  <div className="os-exec-timeline-rail">
                    <span
                      className={cn(
                        "os-exec-timeline-dot",
                        item.tone === "success" && "bg-emerald-500",
                        item.tone === "warning" && "bg-amber-500"
                      )}
                    />
                    {idx < data.activityFeed.length - 1 ? (
                      <span className="os-exec-timeline-line" />
                    ) : null}
                  </div>
                  <div className="pb-6">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="font-medium">{item.label}</p>
                      <span className="text-xs text-[var(--os-fg-muted-on-card)]">
                        {item.time}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--os-fg-muted-on-card)]">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-[var(--os-fg-muted-on-card)]">
                No activity recorded today yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
