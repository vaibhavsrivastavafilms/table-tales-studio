"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Camera,
  ClipboardCheck,
  CreditCard,
  FileText,
  Package,
  Sun,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  formatInr,
  PageHeader,
  StatCard,
} from "@/components/os/procurement/ProcurementUi";

export default function ProcurementDashboardView() {
  const { stats, db } = useProcurement();

  const quickLinks = [
    {
      href: "/os/procurement/purchase-bills/upload",
      label: "Upload Bill",
      icon: Upload,
    },
    {
      href: "/os/procurement/purchase-bills",
      label: "Review OCR",
      icon: FileText,
    },
    {
      href: "/os/procurement/vendor-ledger",
      label: "Vendor Ledger",
      icon: CreditCard,
    },
    {
      href: "/os/inventory",
      label: "Inventory from Bills",
      icon: Package,
    },
    {
      href: "/os/procurement/omissions",
      label: "Omission Center",
      icon: AlertTriangle,
    },
    {
      href: "/os/procurement/credit-notes",
      label: "Credit Notes",
      icon: Camera,
    },
    { href: "/os/procurement/grn", label: "GRN", icon: ClipboardCheck },
    { href: "/os/inventory/opening-stock", label: "Opening Stock", icon: Sun },
    { href: "/os/inventory/closing-stock", label: "Closing Stock", icon: Sun },
    { href: "/os/inventory/stock-audit", label: "Stock Audit", icon: Package },
    { href: "/os/procurement/analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Procurement Engine V1.5"
        title="Procurement Dashboard"
        description="Vendor bills → OCR → GRN → purchase → inventory → ledger → stock audit → omissions."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's Purchases" value={formatInr(stats.todaysPurchases)} />
        <StatCard
          label="Vendor Outstanding"
          value={formatInr(stats.vendorOutstanding)}
        />
        <StatCard label="Pending Credit Notes" value={stats.pendingCreditNotes} />
        <StatCard label="Pending Omissions" value={stats.pendingOmissions} />
        <StatCard label="Low Stock Items" value={stats.lowStockItems} />
        <StatCard label="Pending GRNs" value={stats.pendingGrns} />
        <StatCard label="Stock Variances Today" value={stats.stockVariances} />
        <StatCard label="Month Purchases" value={formatInr(stats.monthPurchases)} />
        <StatCard
          label="Draft Bills"
          value={db.purchaseBills.filter((b) => b.status === "draft").length}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href} className="os-card block p-4 transition hover:opacity-95">
            <div className="flex items-center gap-3">
              <link.icon className="h-5 w-5 text-[var(--os-accent)]" />
              <span className="font-semibold text-[var(--os-fg-on-card)]">
                {link.label}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="os-card p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
          Most purchased items
        </h3>
        <ul className="mt-3 space-y-2">
          {stats.topItems.length ? (
            stats.topItems.map((item) => (
              <li
                key={item.name}
                className="flex justify-between text-sm text-[var(--os-fg-on-card)]"
              >
                <span>{item.name}</span>
                <span className="tabular-nums">{item.quantity}</span>
              </li>
            ))
          ) : (
            <li className="text-sm text-[var(--os-fg-muted-on-card)]">
              Approve bills to populate analytics.
            </li>
          )}
        </ul>
      </div>

      <div className="os-card p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
          Top Vendors
        </h3>
        {stats.topVendors.length ? (
          <ul className="mt-3 space-y-2">
            {stats.topVendors.map((v) => (
              <li
                key={v.name}
                className="flex items-center justify-between text-sm text-[var(--os-fg-on-card)]"
              >
                <span>{v.name}</span>
                <span className="font-semibold tabular-nums">{formatInr(v.total)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[var(--os-fg-muted-on-card)]">
            No posted purchases yet. Upload your first bill to get started.
          </p>
        )}
      </div>
    </div>
  );
}
