"use client";

import StockOcrPanel from "@/components/os/procurement/StockOcrPanel";
import { PageHeader } from "@/components/os/procurement/ProcurementUi";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";

export default function ClosingStockView() {
  const { db } = useProcurement();
  const today = new Date().toISOString().slice(0, 10);
  const rows = db.closingStock.filter((c) => c.date === today);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Module 8 · Closing Stock OCR"
        title="Closing Stock"
        description="Night stock sheet photo — AI extracts item and closing quantity for variance."
      />
      <StockOcrPanel kind="closing" title="Scan closing stock sheet" />
      <div className="os-card p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
          Saved today ({today})
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-[var(--os-fg-on-card)]">
          {rows.map((row) => {
            const item = db.inventoryItems.find((i) => i.id === row.itemId);
            return (
              <li key={row.id} className="flex justify-between">
                <span>{item?.name ?? row.itemId}</span>
                <span className="tabular-nums">
                  {row.quantity} {item?.unit} · {row.source}
                </span>
              </li>
            );
          })}
          {!rows.length ? (
            <li className="text-[var(--os-fg-muted-on-card)]">No closing stock saved yet.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
