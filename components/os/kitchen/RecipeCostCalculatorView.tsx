"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { PageHeader } from "@/components/os/procurement/ProcurementUi";
import {
  calculateRecipeCost,
  foodCostStatusClass,
  foodCostStatusLabel,
  getMenuRecipeIngredients,
  recipeSellingPricePaise,
} from "@/lib/os/kitchen/menu-cost";
import { formatPaise, paiseToRupees, rupeesToPaise } from "@/lib/os/money";
import { cn } from "@/lib/utils";

type Props = { recipeId: string };

export default function RecipeCostCalculatorView({ recipeId }: Props) {
  const {
    db,
    saveMenuRecipeIngredient,
    removeMenuRecipeIngredient,
    saveRecipeCostSettings,
    saveRecipeCostSnapshot,
  } = useProcurement();

  const recipe = db.recipes.find((r) => r.id === recipeId);
  const settings = db.recipeCostSettings.find((s) => s.recipeId === recipeId);
  const [overheadPct, setOverheadPct] = useState(settings?.overheadPct ?? 5);
  const [packagingRupees, setPackagingRupees] = useState(
    settings ? String(paiseToRupees(settings.packagingCostPaise)) : "0"
  );
  const [portions, setPortions] = useState(1);
  const [ingredientQuery, setIngredientQuery] = useState("");
  const [draftIngredientId, setDraftIngredientId] = useState("");
  const [draftQty, setDraftQty] = useState("1");

  const lines = useMemo(
    () => getMenuRecipeIngredients(db, recipeId),
    [db, recipeId]
  );

  const cost = useMemo(
    () =>
      calculateRecipeCost(db, recipeId, {
        overheadPct,
        packagingCostPaise: rupeesToPaise(Number(packagingRupees) || 0),
        portions,
      }),
    [db, recipeId, overheadPct, packagingRupees, portions]
  );

  const ingredientOptions = useMemo(() => {
    const q = ingredientQuery.toLowerCase();
    return db.menuIngredients
      .filter((i) => !q || i.name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [db.menuIngredients, ingredientQuery]);

  if (!recipe) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p>Recipe not found.</p>
        <Link href="/os/kitchen/recipes" className="text-[var(--os-accent)]">
          Back to recipes
        </Link>
      </div>
    );
  }

  const sellingPaise = recipeSellingPricePaise(recipe);
  const fcClass = cost ? foodCostStatusClass(cost.foodCostPct, cost.targetPct) : "success";

  function persistSettings() {
    saveRecipeCostSettings(recipeId, {
      overheadPct,
      packagingCostPaise: rupeesToPaise(Number(packagingRupees) || 0),
    });
  }

  function addIngredient() {
    if (!draftIngredientId) return;
    const ing = db.menuIngredients.find((i) => i.id === draftIngredientId);
    if (!ing) return;
    saveMenuRecipeIngredient({
      recipeId,
      ingredientId: ing.id,
      quantity: Number(draftQty) || 0,
      unit: ing.unit,
    });
    setDraftIngredientId("");
    setDraftQty("1");
    setIngredientQuery("");
  }

  function updateLine(
    lineId: string,
    patch: Partial<{ quantity: number; unit: string }>
  ) {
    const line = lines.find((l) => l.id === lineId);
    if (!line) return;
    saveMenuRecipeIngredient({
      id: lineId,
      recipeId,
      ingredientId: line.ingredientId,
      quantity: patch.quantity ?? line.quantity,
      unit: patch.unit ?? line.unit,
      notes: line.notes,
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Recipe Cost"
        title={recipe.name}
        description={recipe.description ?? "Ingredient mapping and live margin calculator."}
      />
      <Link href="/os/kitchen/recipes" className="text-sm text-[var(--os-accent)]">
        ← Back to Recipe Engine
      </Link>

      <section className="os-card space-y-3 p-5">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-[var(--os-bg-muted)] px-2 py-1">{recipe.menuCategory}</span>
          {recipe.menuSubcategory ? (
            <span className="rounded-full bg-[var(--os-bg-muted)] px-2 py-1">{recipe.menuSubcategory}</span>
          ) : null}
          {recipe.isSignature ? <span className="rounded-full bg-amber-100 px-2 py-1">★ Signature</span> : null}
          {recipe.isSpicy ? <span className="rounded-full bg-red-100 px-2 py-1">Spicy</span> : null}
          {recipe.isJainAvailable === false ? (
            <span className="rounded-full bg-gray-200 px-2 py-1">Not Jain</span>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-xs text-[var(--os-fg-muted)]">Selling price</p>
            <p className="font-semibold">{formatPaise(sellingPaise)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--os-fg-muted)]">Serving size</p>
            <p className="font-semibold">{recipe.servingSize ?? recipe.yieldUnit}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--os-fg-muted)]">Target food cost</p>
            <p className="font-semibold">{(recipe.foodCostTargetPct ?? 30).toFixed(1)}%</p>
          </div>
        </div>
      </section>

      <section className="os-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Ingredient builder</h3>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-[var(--os-fg-muted)]">
                <th className="p-2">Ingredient</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Unit</th>
                <th className="p-2">Rate</th>
                <th className="p-2">Yield</th>
                <th className="p-2">Effective cost</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {cost?.ingredientBreakdown.map((row) => (
                <tr key={row.id} className="border-b border-[var(--os-border)]/40">
                  <td className="p-2">
                    {row.ingredientName}
                    {row.rateNotSet ? (
                      <span className="ml-1 text-[10px] text-amber-700">Rate not set</span>
                    ) : null}
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.001"
                      defaultValue={row.quantity}
                      onBlur={(e) =>
                        updateLine(row.id, { quantity: Number(e.target.value) || 0 })
                      }
                      className="w-20 rounded border px-2 py-1"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      defaultValue={row.unit}
                      onBlur={(e) => updateLine(row.id, { unit: e.target.value })}
                      className="w-16 rounded border px-2 py-1"
                    />
                  </td>
                  <td className="p-2 tabular-nums">
                    {row.ratePaise > 0 ? formatPaise(row.ratePaise) : "₹0"}
                  </td>
                  <td className="p-2">
                    <span className="tabular-nums">{row.yieldFactor.toFixed(3)}</span>
                  </td>
                  <td className="p-2 tabular-nums">{formatPaise(row.effectiveCostPaise)}</td>
                  <td className="p-2">
                    <button
                      type="button"
                      className="text-xs text-red-700"
                      onClick={() => removeMenuRecipeIngredient(row.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={ingredientQuery}
            onChange={(e) => setIngredientQuery(e.target.value)}
            placeholder="Search ingredient…"
            className="min-w-[180px] flex-1 rounded border px-3 py-2 text-sm"
          />
          <select
            value={draftIngredientId}
            onChange={(e) => setDraftIngredientId(e.target.value)}
            className="rounded border px-2 py-2 text-sm"
          >
            <option value="">Select</option>
            {ingredientOptions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <input
            value={draftQty}
            onChange={(e) => setDraftQty(e.target.value)}
            placeholder="Qty"
            className="w-20 rounded border px-2 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addIngredient}
            className="rounded-md bg-[var(--os-primary)] px-3 py-2 text-xs text-white"
          >
            Add ingredient
          </button>
        </div>
      </section>

      <section className="os-card space-y-3 p-5 text-sm">
        <h3 className="font-semibold">Cost summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Ingredient cost</span>
            <span className="tabular-nums">{formatPaise(cost?.ingredientCostPaise ?? 0)}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Overhead ({overheadPct.toFixed(0)}%)</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={20}
                value={overheadPct}
                onChange={(e) => setOverheadPct(Number(e.target.value))}
                onMouseUp={persistSettings}
                onTouchEnd={persistSettings}
              />
              <span className="tabular-nums">+ {formatPaise(cost?.overheadPaise ?? 0)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Packaging</span>
            <input
              value={packagingRupees}
              onChange={(e) => setPackagingRupees(e.target.value)}
              onBlur={persistSettings}
              className="w-24 rounded border px-2 py-1"
            />
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total recipe cost</span>
            <span className="tabular-nums">{formatPaise(cost?.totalCostPaise ?? 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Selling price</span>
            <span className="tabular-nums">{formatPaise(cost?.sellingPricePaise ?? sellingPaise)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Food cost %</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                fcClass === "success" && "bg-emerald-100 text-emerald-800",
                fcClass === "warning" && "bg-amber-100 text-amber-800",
                fcClass === "danger" && "bg-red-100 text-red-800"
              )}
            >
              {(cost?.foodCostPct ?? 0).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Gross margin</span>
            <span className="tabular-nums">{formatPaise(cost?.marginPaise ?? 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Margin %</span>
            <span className="tabular-nums">{(cost?.marginPct ?? 0).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Target food cost %</span>
            <span className="tabular-nums">{(cost?.targetPct ?? 0).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Status</span>
            <span>
              {cost ? foodCostStatusLabel(cost.foodCostPct, cost.targetPct) : "—"}
            </span>
          </div>
        </div>
      </section>

      <section className="os-card space-y-3 p-5 text-sm">
        <h3 className="font-semibold">Portion scaling</h3>
        <label className="flex items-center gap-2">
          <span>Portions</span>
          <input
            type="number"
            min={1}
            value={portions}
            onChange={(e) => setPortions(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 rounded border px-2 py-1"
          />
        </label>
        <p className="text-[var(--os-fg-muted-on-card)]">
          Total cost × {portions} = {formatPaise(cost?.totalCostPaise ?? 0)}
        </p>
      </section>

      <button
        type="button"
        onClick={() => saveRecipeCostSnapshot(recipeId, portions)}
        className="rounded-md bg-[var(--os-accent)] px-4 py-2 text-sm text-white"
      >
        Save recipe cost
      </button>
    </div>
  );
}
