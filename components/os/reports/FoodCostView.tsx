"use client";

import { useMemo } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  formatInr,
  PageHeader,
  StatCard,
} from "@/components/os/procurement/ProcurementUi";
import {
  buildFoodCostReport,
  compareOutlets,
  computeOutletFoodCost,
  getHighMarginItems,
  getLowMarginItems,
} from "@/lib/os/reports/food-cost";

export default function FoodCostView() {
  const { db } = useProcurement();
  const summary = useMemo(() => computeOutletFoodCost(db), [db]);
  const rows = useMemo(() => buildFoodCostReport(db), [db]);
  const highMargin = useMemo(() => getHighMarginItems(db), [db]);
  const lowMargin = useMemo(() => getLowMarginItems(db), [db]);
  const outlets = useMemo(() => compareOutlets(db), [db]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="Food Cost Dashboard"
        description="Theoretical food cost %, recipe trends, outlet comparison, and margin alerts."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Avg food cost %"
          value={`${summary.avgFoodCostPercent.toFixed(1)}%`}
        />
        <StatCard
          label="Avg margin %"
          value={`${summary.avgMarginPercent.toFixed(1)}%`}
        />
        <StatCard label="Active recipes" value={summary.recipeCount} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="os-card p-5">
          <h3 className="text-sm font-semibold text-[var(--os-fg-on-card)]">
            High margin items
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {highMargin.map((r) => (
              <li key={r.recipeId} className="flex justify-between">
                <span>{r.recipeName}</span>
                <span>{r.marginPercent.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="os-card p-5">
          <h3 className="text-sm font-semibold text-[var(--os-fg-on-card)]">
            Low margin items
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {lowMargin.map((r) => (
              <li key={r.recipeId} className="flex justify-between">
                <span>{r.recipeName}</span>
                <span>{r.marginPercent.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {outlets.length ? (
        <section className="os-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--os-fg-on-card)]">
            Outlet comparison
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {outlets.map((o) => (
              <div key={o.outlet} className="rounded-lg border border-[var(--os-border)] p-3">
                <p className="font-medium">{o.outlet}</p>
                <p className="text-xs text-[var(--os-fg-muted-on-card)]">
                  Food cost {o.avgFoodCostPercent.toFixed(1)}% · Margin{" "}
                  {o.avgMarginPercent.toFixed(1)}% · {o.recipeCount} recipes
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="os-card overflow-x-auto p-5">
        <h3 className="mb-3 text-sm font-semibold text-[var(--os-fg-on-card)]">
          Recipe cost trends
        </h3>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-[10px] uppercase text-[var(--os-fg-muted-on-card)]">
              <th className="pb-2">Recipe</th>
              <th className="pb-2">Cost</th>
              <th className="pb-2">Price</th>
              <th className="pb-2">Food cost %</th>
              <th className="pb-2">Margin</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.recipeId} className="border-t border-[var(--os-border)]">
                <td className="py-2">{row.recipeName}</td>
                <td className="py-2">{formatInr(row.recipeCost)}</td>
                <td className="py-2">{formatInr(row.sellingPrice)}</td>
                <td className="py-2">{row.foodCostPercent.toFixed(1)}%</td>
                <td className="py-2">
                  {formatInr(row.margin)} ({row.marginPercent.toFixed(1)}%)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
