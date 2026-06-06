"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { PageHeader, StatusBadge } from "@/components/os/procurement/ProcurementUi";
import { INVENTORY_CATEGORIES, suggestCategory } from "@/lib/os/procurement/categories";
import { listItemsWithAliases } from "@/lib/os/inventory/item-master";
import type { InventoryCategory } from "@/lib/os/procurement/types";

export default function ItemMasterView() {
  const { db, saveItemMaster, updateItem, mapAlias } = useProcurement();
  const items = useMemo(() => listItemsWithAliases(db), [db]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<InventoryCategory>("Dry Store");
  const [unit, setUnit] = useState("kg");
  const [parLevel, setParLevel] = useState("10");
  const [aliases, setAliases] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newAlias, setNewAlias] = useState("");

  const selected = items.find((i) => i.id === selectedId);

  function handleCreate() {
    if (!name.trim()) return;
    saveItemMaster({
      name: name.trim(),
      category: category ?? suggestCategory(name),
      unit,
      parLevel: Number(parLevel) || 10,
      aliases: aliases
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
    });
    setName("");
    setAliases("");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Item Master"
        description="Canonical SKUs, alias engine, category mapping, and unit conversions."
      />

      <div className="os-card grid gap-3 p-5 md:grid-cols-2">
        <Input
          placeholder="Canonical item name (e.g. Mozzarella Cheese)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-white/90"
        />
        <select
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value as InventoryCategory)}
        >
          {INVENTORY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Input
          placeholder="Unit (kg, L, pcs)"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="bg-white/90"
        />
        <Input
          placeholder="Par level"
          value={parLevel}
          onChange={(e) => setParLevel(e.target.value)}
          className="bg-white/90"
        />
        <Input
          placeholder="Aliases comma-separated (Pizza Cheese, Mozzarella)"
          value={aliases}
          onChange={(e) => setAliases(e.target.value)}
          className="bg-white/90 md:col-span-2"
        />
        <Button onClick={handleCreate} className="md:col-span-2">
          Add Item
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`os-card p-4 text-left ${
                selectedId === item.id ? "ring-2 ring-[var(--os-accent)]" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-[var(--os-fg-on-card)]">{item.name}</p>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-1 text-xs text-[var(--os-fg-muted-on-card)]">
                {item.category} · {item.currentStock} {item.unit} · par {item.parLevel}
              </p>
              {item.aliases.length ? (
                <p className="mt-2 text-xs text-[var(--os-fg-muted-on-card)]">
                  Aliases: {item.aliases.map((a) => a.alias).join(", ")}
                </p>
              ) : null}
            </button>
          ))}
        </div>

        {selected ? (
          <div className="os-card space-y-3 p-5">
            <h3 className="font-semibold text-[var(--os-fg-on-card)]">{selected.name}</h3>
            <label className="block text-xs font-medium text-[var(--os-fg-muted-on-card)]">
              Par level
              <Input
                type="number"
                className="mt-1 bg-white/90"
                defaultValue={selected.parLevel}
                onBlur={(e) =>
                  updateItem(selected.id, { parLevel: Number(e.target.value) || 0 })
                }
              />
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Add alias"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                className="bg-white/90"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  if (!newAlias.trim()) return;
                  mapAlias(selected.id, newAlias.trim());
                  setNewAlias("");
                }}
              >
                Map
              </Button>
            </div>
            <ul className="space-y-1 text-sm">
              {selected.aliases.map((a) => (
                <li key={a.id} className="text-[var(--os-fg-muted-on-card)]">
                  {a.alias}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
