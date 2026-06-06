"use client";

import { useMemo, useRef, useState } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { PageHeader } from "@/components/os/procurement/ProcurementUi";
import { formatPaise, paiseToRupees } from "@/lib/os/money";

export default function MenuIngredientsView() {
  const { db, updateIngredientRate, bulkImportRates } = useProcurement();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rateInput, setRateInput] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const ingredients = useMemo(
    () => [...db.menuIngredients].sort((a, b) => a.name.localeCompare(b.name)),
    [db.menuIngredients]
  );

  function startEdit(id: string, currentPaise: number) {
    setEditingId(id);
    setRateInput(currentPaise > 0 ? String(paiseToRupees(currentPaise)) : "");
  }

  function saveEdit(id: string) {
    const rupees = Number(rateInput);
    if (Number.isNaN(rupees) || rupees < 0) return;
    updateIngredientRate(id, rupees);
    setEditingId(null);
  }

  function handleCsv(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const result = bulkImportRates(text);
      setImportMsg(
        `Updated ${result.updated} rates · Recalculated ${result.recalculated} recipes` +
          (result.errors.length ? ` · ${result.errors.length} errors` : "")
      );
    };
    reader.readAsText(file);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Recipes"
        title="Ingredient Master"
        description="Set purchase rates per unit. All linked recipes recalculate food cost on save."
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-md bg-[var(--os-accent)] px-3 py-2 text-xs text-white"
        >
          Bulk import CSV
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleCsv(f);
          }}
        />
        {importMsg ? <span className="text-xs text-[var(--os-fg-muted)]">{importMsg}</span> : null}
      </div>
      <div className="os-card overflow-x-auto">
        <table className="min-w-[720px] w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-[var(--os-fg-muted)]">
              <th className="p-3">Ingredient</th>
              <th className="p-3">Category</th>
              <th className="p-3">Unit</th>
              <th className="p-3">Rate (₹)</th>
              <th className="p-3">Last updated</th>
              <th className="p-3">Edit</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing) => (
              <tr key={ing.id} className="border-b border-[var(--os-border)]/40">
                <td className="p-3">{ing.name}</td>
                <td className="p-3">{ing.category}</td>
                <td className="p-3">{ing.unit}</td>
                <td className="p-3">
                  {editingId === ing.id ? (
                    <input
                      autoFocus
                      value={rateInput}
                      onChange={(e) => setRateInput(e.target.value)}
                      onBlur={() => saveEdit(ing.id)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(ing.id)}
                      className="w-24 rounded border px-2 py-1"
                    />
                  ) : ing.costPerUnitPaise > 0 ? (
                    formatPaise(ing.costPerUnitPaise)
                  ) : (
                    <span className="text-amber-700">Rate not set</span>
                  )}
                </td>
                <td className="p-3 text-xs text-[var(--os-fg-muted-on-card)]">
                  {new Date(ing.lastUpdated).toLocaleDateString("en-IN")}
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    className="text-xs text-[var(--os-accent)]"
                    onClick={() => startEdit(ing.id, ing.costPerUnitPaise)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
