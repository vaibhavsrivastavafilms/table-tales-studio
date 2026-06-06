"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  formatInr,
  PageHeader,
  StatusBadge,
} from "@/components/os/procurement/ProcurementUi";
import { listEnrichedRecipes } from "@/lib/os/kitchen/recipes";

export default function RecipesView() {
  const { db, saveRecipe } = useProcurement();
  const recipes = useMemo(() => listEnrichedRecipes(db), [db]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("399");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("0.1");

  function handleCreate() {
    const ingredient = db.inventoryItems.find((i) => i.id === itemId);
    if (!name.trim() || !ingredient) return;
    saveRecipe({
      name: name.trim(),
      sellingPrice: Number(price) || 0,
      yield: 1,
      yieldUnit: "portion",
      ingredients: [
        {
          itemId: ingredient.id,
          itemName: ingredient.name,
          quantity: Number(qty) || 0,
          unit: ingredient.unit,
        },
      ],
    });
    setName("");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Kitchen"
        title="Recipe Engine"
        description="Ingredient mapping, recipe cost, food cost %, and margin by menu item."
      />

      <div className="os-card grid gap-3 p-5 md:grid-cols-2">
        <Input
          placeholder="Recipe name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-white/90"
        />
        <Input
          placeholder="Selling price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="bg-white/90"
        />
        <select
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
        >
          <option value="">Select inventory item</option>
          {db.inventoryItems.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
        <Input
          placeholder="Ingredient qty"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="bg-white/90"
        />
        <Button onClick={handleCreate} className="md:col-span-2">
          Create Recipe
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="os-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[var(--os-fg-on-card)]">{recipe.name}</p>
                <p className="text-xs text-[var(--os-fg-muted-on-card)]">
                  {recipe.outlet} · yield {recipe.yield} {recipe.yieldUnit}
                </p>
              </div>
              <StatusBadge status={recipe.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-[10px] uppercase text-[var(--os-fg-muted-on-card)]">
                  Recipe cost
                </p>
                <p className="font-medium">{formatInr(recipe.recipeCost)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-[var(--os-fg-muted-on-card)]">
                  Food cost %
                </p>
                <p className="font-medium">{recipe.foodCostPercent.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-[var(--os-fg-muted-on-card)]">
                  Selling price
                </p>
                <p className="font-medium">{formatInr(recipe.sellingPrice)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-[var(--os-fg-muted-on-card)]">
                  Margin
                </p>
                <p className="font-medium">
                  {formatInr(recipe.margin)} ({recipe.marginPercent.toFixed(1)}%)
                </p>
              </div>
            </div>
            <Link
              href={`/os/recipes/${recipe.id}/cost-calculator`}
              className="mt-4 inline-block rounded-md border border-[var(--os-border)] px-3 py-1.5 text-xs text-[var(--os-accent)]"
            >
              Calculate Cost
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
