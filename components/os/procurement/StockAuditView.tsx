"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { PageHeader } from "@/components/os/procurement/ProcurementUi";
import { buildStockAudit } from "@/lib/os/procurement/analytics";

export default function StockAuditView() {
  const { db, mapAlias, mapUnitConversion } = useProcurement();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const audit = buildStockAudit(db, date);

  const [aliasItemId, setAliasItemId] = useState(db.inventoryItems[0]?.id ?? "");
  const [aliasText, setAliasText] = useState("");
  const [convItemId, setConvItemId] = useState(db.inventoryItems[0]?.id ?? "");
  const [fromUnit, setFromUnit] = useState("g");
  const [factor, setFactor] = useState("0.001");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Module 9 · Variance Engine"
        title="Stock Audit"
        description="Expected vs actual closing. Item aliases and unit conversions improve OCR and GRN accuracy."
      />

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--os-fg-muted)]">
            Audit date
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-44 bg-white/90"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--os-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--os-surface)] text-left text-[10px] uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Opening</th>
              <th className="px-4 py-3">+ Purchase</th>
              <th className="px-4 py-3">− Consumption</th>
              <th className="px-4 py-3">Expected</th>
              <th className="px-4 py-3">Closing</th>
              <th className="px-4 py-3">Variance</th>
            </tr>
          </thead>
          <tbody>
            {audit.map((row) => (
              <tr
                key={row.itemId}
                className="border-t border-[var(--os-border)] bg-[var(--os-surface-elevated)] text-[var(--os-fg-on-card)]"
              >
                <td className="px-4 py-3 font-medium">{row.itemName}</td>
                <td className="px-4 py-3 tabular-nums">
                  {row.opening ?? "—"} {row.unit}
                </td>
                <td className="px-4 py-3 tabular-nums">+{row.purchases}</td>
                <td className="px-4 py-3 tabular-nums">−{row.consumption}</td>
                <td className="px-4 py-3 tabular-nums">
                  {row.expected ?? "—"}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {row.closing ?? "—"}
                </td>
                <td
                  className={`px-4 py-3 tabular-nums font-semibold ${
                    row.variance !== null && Math.abs(row.variance) >= 1
                      ? "text-[var(--os-accent)]"
                      : ""
                  }`}
                >
                  {row.variance !== null
                    ? `${row.variance > 0 ? "+" : ""}${row.variance}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="os-card space-y-3 p-5">
          <h3 className="text-sm font-bold text-[var(--os-fg-on-card)]">
            Item alias mapping
          </h3>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={aliasItemId}
            onChange={(e) => setAliasItemId(e.target.value)}
          >
            {db.inventoryItems.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <Input
            placeholder="Vendor invoice name e.g. Mozzarella Cheese"
            value={aliasText}
            onChange={(e) => setAliasText(e.target.value)}
            className="bg-white/90"
          />
          <Button
            size="sm"
            disabled={!aliasText.trim()}
            onClick={() => {
              mapAlias(aliasItemId, aliasText);
              setAliasText("");
            }}
          >
            Add alias
          </Button>
          <ul className="text-xs text-[var(--os-fg-muted-on-card)]">
            {db.itemAliases.map((a) => {
              const item = db.inventoryItems.find((i) => i.id === a.itemId);
              return (
                <li key={a.id}>
                  {a.alias} → {item?.name}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="os-card space-y-3 p-5">
          <h3 className="text-sm font-bold text-[var(--os-fg-on-card)]">
            Unit conversion engine
          </h3>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={convItemId}
            onChange={(e) => setConvItemId(e.target.value)}
          >
            {db.inventoryItems.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.unit})
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Input
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="bg-white/90"
              placeholder="From unit"
            />
            <Input
              value={factor}
              onChange={(e) => setFactor(e.target.value)}
              className="bg-white/90"
              placeholder="Factor to base"
            />
          </div>
          <Button
            size="sm"
            onClick={() => {
              const item = db.inventoryItems.find((i) => i.id === convItemId);
              if (!item) return;
              mapUnitConversion(convItemId, fromUnit, item.unit, Number(factor));
            }}
          >
            Add conversion
          </Button>
          <ul className="text-xs text-[var(--os-fg-muted-on-card)]">
            {db.unitConversions.map((c) => {
              const item = db.inventoryItems.find((i) => i.id === c.itemId);
              return (
                <li key={c.id}>
                  {item?.name}: 1 {c.fromUnit} = {c.factor} {c.toUnit}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
