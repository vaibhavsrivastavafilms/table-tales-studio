"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { PageHeader } from "@/components/os/procurement/ProcurementUi";
import {
  exportMenuOverviewCsv,
  foodCostStatusClass,
  foodCostStatusLabel,
  listMenuOverviewRows,
  recipeSellingPricePaise,
} from "@/lib/os/kitchen/menu-cost";
import { formatPaise } from "@/lib/os/money";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "costed" | "uncosted" | "over" | "under";

export default function MenuOverviewView() {
  const { db } = useProcurement();
  const [categories, setCategories] = useState<string[]>([]);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<"fc_desc" | "margin_asc" | "price">("fc_desc");

  const categoryOptions = useMemo(() => {
    const set = new Set(db.recipes.map((r) => r.menuCategory).filter(Boolean) as string[]);
    return [...set].sort();
  }, [db.recipes]);

  const rows = useMemo(() => {
    let list = listMenuOverviewRows(db);
    if (categories.length) {
      list = list.filter((r) => r.recipe.menuCategory && categories.includes(r.recipe.menuCategory));
    }
    if (status === "costed") list = list.filter((r) => r.costed);
    if (status === "uncosted") list = list.filter((r) => !r.costed);
    if (status === "over") {
      list = list.filter((r) => r.cost && r.cost.foodCostPct > r.cost.targetPct);
    }
    if (status === "under") {
      list = list.filter((r) => r.costed && r.cost && r.cost.foodCostPct <= r.cost.targetPct);
    }
    return [...list].sort((a, b) => {
      if (sort === "price") {
        return recipeSellingPricePaise(b.recipe) - recipeSellingPricePaise(a.recipe);
      }
      if (sort === "margin_asc") {
        return (a.cost?.marginPaise ?? 0) - (b.cost?.marginPaise ?? 0);
      }
      return (b.cost?.foodCostPct ?? -1) - (a.cost?.foodCostPct ?? -1);
    });
  }, [db, categories, status, sort]);

  const summary = useMemo(() => {
    const all = listMenuOverviewRows(db);
    const costed = all.filter((r) => r.costed);
    const over = costed.filter((r) => r.cost && r.cost.foodCostPct > r.cost!.targetPct);
    const avgFc =
      costed.length > 0
        ? costed.reduce((s, r) => s + (r.cost?.foodCostPct ?? 0), 0) / costed.length
        : 0;
    return {
      total: all.length,
      costed: costed.length,
      uncosted: all.length - costed.length,
      avgFc,
      over: over.length,
    };
  }, [db]);

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function exportCsv() {
    const blob = new Blob([exportMenuOverviewCsv(db)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "menu-food-cost.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Recipes"
        title="Menu Overview"
        description="Live food cost and margin across the full Table Tales menu."
      />
      <section className="os-card grid gap-3 p-4 text-sm sm:grid-cols-5">
        <div><p className="text-xs text-[var(--os-fg-muted)]">Total items</p><p className="font-semibold">{summary.total}</p></div>
        <div><p className="text-xs text-[var(--os-fg-muted)]">Costed</p><p className="font-semibold">{summary.costed}</p></div>
        <div><p className="text-xs text-[var(--os-fg-muted)]">Uncosted</p><p className="font-semibold">{summary.uncosted}</p></div>
        <div><p className="text-xs text-[var(--os-fg-muted)]">Avg food cost %</p><p className="font-semibold">{summary.avgFc.toFixed(1)}%</p></div>
        <div><p className="text-xs text-[var(--os-fg-muted)]">Over target</p><p className="font-semibold">{summary.over}</p></div>
      </section>
      <div className="flex flex-wrap gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
        >
          <option value="all">All status</option>
          <option value="costed">Costed</option>
          <option value="uncosted">Not costed</option>
          <option value="over">Over target</option>
          <option value="under">Under target</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
        >
          <option value="fc_desc">Food cost % (high → low)</option>
          <option value="margin_asc">Margin (low → high)</option>
          <option value="price">Selling price</option>
        </select>
        <button type="button" onClick={exportCsv} className="rounded-md border px-3 py-2 text-xs">
          Export CSV
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {categoryOptions.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => toggleCategory(cat)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              categories.includes(cat) && "bg-[var(--os-primary)] text-white"
            )}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="os-card overflow-x-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-[var(--os-fg-muted)]">
              <th className="p-3">Item</th>
              <th className="p-3">Category</th>
              <th className="p-3">Selling price</th>
              <th className="p-3">Recipe cost</th>
              <th className="p-3">Food cost %</th>
              <th className="p-3">Margin</th>
              <th className="p-3">Status</th>
              <th className="p-3">Last costed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ recipe, costed, cost, lastCostedAt }) => {
              const fcClass = cost ? foodCostStatusClass(cost.foodCostPct, cost.targetPct) : null;
              const rowHighlight =
                cost && cost.foodCostPct > cost.targetPct ? "bg-amber-50/80" : "";
              return (
                <tr key={recipe.id} className={cn("border-b border-[var(--os-border)]/40", rowHighlight)}>
                  <td className="p-3">
                    <Link href={`/os/recipes/${recipe.id}/cost-calculator`} className="text-[var(--os-accent)]">
                      {recipe.name}
                    </Link>
                  </td>
                  <td className="p-3">{recipe.menuCategory ?? "—"}</td>
                  <td className="p-3 tabular-nums">{formatPaise(recipeSellingPricePaise(recipe))}</td>
                  <td className="p-3 tabular-nums">
                    {costed && cost ? formatPaise(cost.totalCostPaise) : "—"}
                  </td>
                  <td className="p-3 tabular-nums">
                    {costed && cost ? `${cost.foodCostPct.toFixed(1)}%` : "—"}
                  </td>
                  <td className="p-3 tabular-nums">
                    {costed && cost ? formatPaise(cost.marginPaise) : "—"}
                  </td>
                  <td className="p-3">
                    {!costed ? (
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px]">Not Costed Yet</span>
                    ) : cost ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px]",
                          fcClass === "success" && "bg-emerald-100 text-emerald-800",
                          fcClass === "warning" && "bg-amber-100 text-amber-800",
                          fcClass === "danger" && "bg-red-100 text-red-800"
                        )}
                      >
                        {foodCostStatusLabel(cost.foodCostPct, cost.targetPct)}
                      </span>
                    ) : null}
                  </td>
                  <td className="p-3 text-xs text-[var(--os-fg-muted-on-card)]">
                    {lastCostedAt ? new Date(lastCostedAt).toLocaleDateString("en-IN") : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
