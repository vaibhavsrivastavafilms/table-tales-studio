"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  formatInr,
  PageHeader,
  StatCard,
} from "@/components/os/procurement/ProcurementUi";
import { isFlipOfficeSalesAutoSync } from "@/lib/os/integrations/flip-office";
import { channelLabel, computeSalesSummary } from "@/lib/os/sales/sales-engine";
import type { SalesChannel } from "@/lib/os/procurement/types";

const CHANNELS: SalesChannel[] = ["dine_in", "takeaway", "swiggy", "zomato"];

export default function SalesView() {
  const { db, recordSaleOrder } = useProcurement();
  const today = new Date().toISOString().slice(0, 10);
  const summary = useMemo(() => computeSalesSummary(db, today), [db, today]);
  const flipAutoSync = isFlipOfficeSalesAutoSync(db.flipOfficeSettings);
  const flipSalesToday = db.flipSales.filter((s) => s.saleDate === today).length;
  const [recipeId, setRecipeId] = useState(db.recipes[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [channel, setChannel] = useState<SalesChannel>("dine_in");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Sales"
        description={
          flipAutoSync
            ? "Sales are imported automatically from Flip Office POS."
            : "Dine in, takeaway, Swiggy, and Zomato orders consume recipe inventory automatically."
        }
      />

      {flipAutoSync ? (
        <div className="rounded-xl border border-[#C9A84C]/40 bg-[#FDF6EC] p-4 text-sm text-[#1B3A2D]">
          <p className="font-semibold">Flip Office connected — manual entry disabled</p>
          <p className="mt-1">
            {flipSalesToday} Flip orders imported today. Sales sync updates inventory, food cost,
            branch KPIs, and the owner dashboard automatically.{" "}
            <Link href="/os/integrations/flip-office" className="font-medium underline">
              Open Flip Office integration
            </Link>
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's orders" value={summary.totalOrders} />
        <StatCard label="Today's revenue" value={formatInr(summary.totalRevenue)} />
        {summary.byChannel.slice(0, 2).map((row) => (
          <StatCard
            key={row.channel}
            label={row.label}
            value={formatInr(row.revenue)}
            hint={`${row.count} portions`}
          />
        ))}
      </div>

      <div className="os-card grid gap-3 p-5 md:grid-cols-4">
        <select
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm md:col-span-2 disabled:opacity-50"
          value={recipeId}
          onChange={(e) => setRecipeId(e.target.value)}
          disabled={flipAutoSync}
        >
          {db.recipes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — {formatInr(r.sellingPrice)}
            </option>
          ))}
        </select>
        <Input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="bg-white/90"
          disabled={flipAutoSync}
        />
        <select
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm disabled:opacity-50"
          value={channel}
          onChange={(e) => setChannel(e.target.value as SalesChannel)}
          disabled={flipAutoSync}
        >
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {channelLabel(c)}
            </option>
          ))}
        </select>
        <Button
          className="md:col-span-4"
          onClick={() => recordSaleOrder(recipeId, Number(quantity) || 1, channel)}
          disabled={flipAutoSync}
        >
          {flipAutoSync ? "Use Flip Office Sync" : "Record Sale & Consume Inventory"}
        </Button>
      </div>

      <section className="os-card p-5">
        <h3 className="text-sm font-semibold text-[var(--os-fg-on-card)]">Recent sales</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {db.sales.slice(0, 15).map((sale) => (
            <li key={sale.id} className="flex justify-between gap-4">
              <span>
                {sale.recipeName} × {sale.quantity} · {channelLabel(sale.channel)}
              </span>
              <span className="font-medium">{formatInr(sale.totalRevenue)}</span>
            </li>
          ))}
          {!db.sales.length ? (
            <li className="text-[var(--os-fg-muted-on-card)]">No sales recorded yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
