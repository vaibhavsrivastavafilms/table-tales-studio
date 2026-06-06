"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  formatInr,
  PageHeader,
  StatusBadge,
} from "@/components/os/procurement/ProcurementUi";
import { listEnrichedPrepRecipes } from "@/lib/os/kitchen/prep";

export default function PrepProductionView() {
  const { db, runPrepBatch } = useProcurement();
  const prepRecipes = useMemo(() => listEnrichedPrepRecipes(db), [db]);
  const [selectedPrep, setSelectedPrep] = useState(prepRecipes[0]?.id ?? "");
  const [outputQty, setOutputQty] = useState("5");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Kitchen"
        title="Prep Production"
        description="Track input cost, output yield, and production cost for central kitchen prep."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {prepRecipes.map((prep) => (
          <div key={prep.id} className="os-card p-4">
            <div className="flex items-start justify-between">
              <p className="font-semibold text-[var(--os-fg-on-card)]">{prep.name}</p>
              <StatusBadge status={prep.status} />
            </div>
            <p className="mt-1 text-xs text-[var(--os-fg-muted-on-card)]">
              Output {prep.outputYield} {prep.outputUnit}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-[10px] uppercase text-[var(--os-fg-muted-on-card)]">
                  Input cost
                </p>
                <p>{formatInr(prep.inputCost)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-[var(--os-fg-muted-on-card)]">
                  Unit cost
                </p>
                <p>{formatInr(prep.unitCost)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="os-card flex flex-wrap items-end gap-3 p-5">
        <div className="min-w-[200px] flex-1">
          <label className="text-xs font-medium text-[var(--os-fg-muted-on-card)]">
            Prep recipe
            <select
              className="mt-1 w-full rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
              value={selectedPrep}
              onChange={(e) => setSelectedPrep(e.target.value)}
            >
              {prepRecipes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="min-w-[120px]">
          <label className="text-xs font-medium text-[var(--os-fg-muted-on-card)]">
            Output qty
            <Input
              value={outputQty}
              onChange={(e) => setOutputQty(e.target.value)}
              className="mt-1 bg-white/90"
            />
          </label>
        </div>
        <Button
          onClick={() =>
            runPrepBatch(selectedPrep, Number(outputQty) || prepRecipes[0]?.outputYield || 1)
          }
        >
          Record Batch
        </Button>
      </div>

      <section className="os-card p-5">
        <h3 className="text-sm font-semibold text-[var(--os-fg-on-card)]">
          Recent production batches
        </h3>
        <ul className="mt-3 space-y-2 text-sm">
          {db.productionBatches.slice(0, 10).map((batch) => (
            <li key={batch.id} className="flex justify-between gap-4">
              <span>{batch.prepRecipeName}</span>
              <span className="text-[var(--os-fg-muted-on-card)]">
                {batch.outputQty} out · {formatInr(batch.productionCost)} total
              </span>
            </li>
          ))}
          {!db.productionBatches.length ? (
            <li className="text-[var(--os-fg-muted-on-card)]">No batches recorded yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
