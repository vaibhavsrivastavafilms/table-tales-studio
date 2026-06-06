"use client";

import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { PageHeader } from "@/components/os/procurement/ProcurementUi";

export default function InventoryFromPurchasesView() {
  const { db } = useProcurement();

  const purchaseMovements = db.inventoryMovements.filter((m) => m.type === "purchase");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Module 5 · Inventory from Purchases"
        title="Inventory"
        description="Stock generated only from approved bills. Opening + Purchase − Consumption − Transfer − Wastage = Closing."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {db.inventoryItems.map((item) => (
          <div key={item.id} className="os-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
              {item.category}
            </p>
            <p className="mt-1 font-semibold text-[var(--os-fg-on-card)]">{item.name}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--os-fg-on-card)]">
              {item.currentStock} {item.unit}
            </p>
            <p className="mt-1 text-xs text-[var(--os-fg-muted-on-card)]">
              Par {item.parLevel} {item.unit}
              {item.currentStock < item.parLevel ? " · Low stock" : ""}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--os-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--os-surface)] text-left text-[10px] uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Bill</th>
              <th className="px-4 py-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {purchaseMovements.map((mov) => {
              const item = db.inventoryItems.find((i) => i.id === mov.itemId);
              const bill = db.purchaseBills.find((b) => b.id === mov.billId);
              return (
                <tr
                  key={mov.id}
                  className="border-t border-[var(--os-border)] bg-[var(--os-surface-elevated)] text-[var(--os-fg-on-card)]"
                >
                  <td className="px-4 py-3">{mov.createdAt.slice(0, 10)}</td>
                  <td className="px-4 py-3">{item?.name ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums">+{mov.quantity}</td>
                  <td className="px-4 py-3">{bill?.invoiceNumber ?? "—"}</td>
                  <td className="px-4 py-3">{mov.note ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!purchaseMovements.length ? (
          <p className="p-6 text-sm text-[var(--os-fg-muted-on-card)]">
            Approve a purchase bill to generate inventory movements.
          </p>
        ) : null}
      </div>
    </div>
  );
}
