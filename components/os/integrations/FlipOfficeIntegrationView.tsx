"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  Link2,
  RefreshCw,
  Upload,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  formatInr,
  PageHeader,
  StatCard,
} from "@/components/os/procurement/ProcurementUi";
import {
  buildFlipOfficeSyncHealth,
  isFlipOfficeSalesAutoSync,
  recentFlipSyncLogs,
} from "@/lib/os/integrations/flip-office";
import type { FlipOfficeIntegrationSettings } from "@/lib/os/integrations/flip-office/types";
import { cn } from "@/lib/utils";

const SYNC_FREQUENCIES = [
  { label: "Every 5 min", value: 5 },
  { label: "Every 15 min", value: 15 },
  { label: "Every 30 min", value: 30 },
  { label: "Hourly", value: 60 },
];

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "success"
      ? "bg-emerald-500/15 text-emerald-700"
      : status === "partial"
        ? "bg-amber-500/15 text-amber-700"
        : status === "failed"
          ? "bg-rose-500/15 text-rose-700"
          : "bg-zinc-500/15 text-zinc-600";
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", styles)}>
      {status}
    </span>
  );
}

export default function FlipOfficeIntegrationView() {
  const {
    db,
    updateFlipOfficeIntegration,
    runFlipOfficeSync,
    importFlipOfficeSalesCsv,
    mapFlipMenuItem,
  } = useProcurement();

  const health = useMemo(() => buildFlipOfficeSyncHealth(db), [db]);
  const logs = useMemo(() => recentFlipSyncLogs(db), [db]);
  const autoSales = isFlipOfficeSalesAutoSync(db.flipOfficeSettings);
  const fileRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<FlipOfficeIntegrationSettings>(db.flipOfficeSettings);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const saveSettings = () => {
    updateFlipOfficeIntegration({
      ...settings,
      connected: Boolean(settings.apiUrl && settings.apiKey),
    });
    setMessage("Flip Office settings saved.");
  };

  const runSync = async (module: "sales" | "menu" | "customers" | "all") => {
    setSyncing(module);
    setMessage(null);
    try {
      const results = await runFlipOfficeSync(module);
      const summary = results.map((r) => r.message).join(" · ");
      setMessage(summary || "Sync complete.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sync failed.");
    } finally {
      setSyncing(null);
    }
  };

  const onCsvUpload = async (file: File) => {
    const text = await file.text();
    const result = await importFlipOfficeSalesCsv(text);
    setMessage(result.message);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <PageHeader
        eyebrow="Integrations"
        title="Flip Office POS"
        description="Connect Flip Office to auto-import sales, sync menu mappings, and consume recipe inventory — no manual sales entry."
      />

      {autoSales ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-300/40 bg-emerald-50/80 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Flip Office sales sync is active</p>
            <p className="mt-1 opacity-90">
              Manual sales entry is disabled on the Sales page while connected. Orders flow into
              inventory, food cost, branch KPIs, and the owner dashboard automatically.
            </p>
          </div>
        </div>
      ) : null}

      {/* Sync Health */}
      <section className="os-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1B3A2D]">Sync Health</h2>
            <p className="mt-1 text-sm text-[var(--os-fg-muted-on-card)]">
              Connection status and import quality at a glance
            </p>
          </div>
          <StatusBadge status={health.lastSyncStatus} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Last sync"
            value={
              health.lastSyncAt
                ? new Date(health.lastSyncAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Never"
            }
          />
          <StatCard label="Imported today" value={health.recordsImportedToday} />
          <StatCard label="Errors today" value={health.errorCount} />
          <StatCard label="Missing mappings" value={health.missingRecipeMappings} />
          <StatCard label="Unmapped items" value={health.unmappedMenuItemCount} />
        </div>

        {health.lastSyncMessage ? (
          <p className="mt-4 text-sm text-[var(--os-fg-muted-on-card)]">{health.lastSyncMessage}</p>
        ) : null}
      </section>

      {/* Settings */}
      <section className="os-card space-y-5 p-6">
        <h2 className="text-lg font-semibold text-[#1B3A2D]">Connection Settings</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-[var(--os-fg-muted-on-card)]">API URL</span>
            <Input
              value={settings.apiUrl ?? ""}
              onChange={(e) => setSettings((s) => ({ ...s, apiUrl: e.target.value || null }))}
              placeholder="https://api.flipoffice.in/v1/sales"
              className="bg-white/90"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-[var(--os-fg-muted-on-card)]">API Key</span>
            <Input
              type="password"
              value={settings.apiKey ?? ""}
              onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value || null }))}
              placeholder="Bearer token"
              className="bg-white/90"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-[var(--os-fg-muted-on-card)]">Sync frequency</span>
            <select
              className="w-full rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
              value={settings.syncFrequencyMinutes}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  syncFrequencyMinutes: Number(e.target.value),
                }))
              }
            >
              {SYNC_FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <div className="space-y-1 text-sm">
            <span className="font-medium text-[var(--os-fg-muted-on-card)]">Last sync status</span>
            <div className="flex h-10 items-center gap-2 rounded-md border border-[var(--os-border)] bg-white/60 px-3">
              <StatusBadge status={settings.lastSyncStatus} />
              <span className="text-xs text-[var(--os-fg-muted-on-card)]">
                {settings.connected ? "Connected" : "Not connected — demo mode uses sample orders"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["salesSyncEnabled", "Sales Sync"],
              ["menuSyncEnabled", "Menu Sync"],
              ["customerSyncEnabled", "Customer Sync"],
              ["paymentSyncEnabled", "Payment Sync"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-2 rounded-lg border border-[var(--os-border)] bg-white/50 px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={saveSettings} className="bg-[#1B3A2D] hover:bg-[#153024]">
            Save settings
          </Button>
          <Button
            variant="outline"
            onClick={() => runSync("all")}
            disabled={Boolean(syncing)}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", syncing === "all" && "animate-spin")} />
            Sync all modules
          </Button>
        </div>
      </section>

      {/* Module actions */}
      <section className="grid gap-4 lg:grid-cols-2">
        {(
          [
            {
              key: "sales" as const,
              title: "Sales Sync",
              desc: "Import POS orders, create sales records, and consume recipe inventory.",
            },
            {
              key: "menu" as const,
              title: "Menu Sync",
              desc: "Pull Flip menu items and auto-map them to Table Tales recipes.",
            },
            {
              key: "customers" as const,
              title: "Customer Sync",
              desc: "Import customer profiles and order history from Flip Office.",
            },
          ] as const
        ).map((mod) => (
          <article key={mod.key} className="os-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-[#1B3A2D]">{mod.title}</h3>
                <p className="mt-1 text-sm text-[var(--os-fg-muted-on-card)]">{mod.desc}</p>
              </div>
              <Link2 className="h-5 w-5 text-[#C9A84C]" />
            </div>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => runSync(mod.key)}
              disabled={Boolean(syncing)}
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", syncing === mod.key && "animate-spin")}
              />
              Run {mod.title}
            </Button>
          </article>
        ))}

        <article className="os-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-[#1B3A2D]">CSV Import Fallback</h3>
              <p className="mt-1 text-sm text-[var(--os-fg-muted-on-card)]">
                Upload a sales export when the API is unavailable. Required columns: date, outlet,
                item_name, quantity, unit_price.
              </p>
            </div>
            <CloudUpload className="h-5 w-5 text-[#C9A84C]" />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onCsvUpload(file);
            }}
          />
          <Button className="mt-4" variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Upload CSV
          </Button>
        </article>
      </section>

      {/* Unmapped menu items */}
      <section className="os-card p-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-[#1B3A2D]">Unmapped Menu Items</h2>
        </div>
        {health.unmappedMenuItems.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--os-fg-muted-on-card)]">
            All imported menu items are mapped to recipes.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-[var(--os-fg-muted-on-card)]">
                  <th className="pb-2 pr-4">Flip menu item</th>
                  <th className="pb-2 pr-4 text-right">Occurrences</th>
                  <th className="pb-2">Map to recipe</th>
                </tr>
              </thead>
              <tbody>
                {health.unmappedMenuItems.slice(0, 12).map((row) => (
                  <tr key={row.name} className="border-b border-[var(--os-border)]/60">
                    <td className="py-3 pr-4 font-medium">{row.name}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{row.count}</td>
                    <td className="py-3">
                      <select
                        className="w-full max-w-xs rounded-md border border-[var(--os-border)] bg-white/90 px-2 py-1.5 text-sm"
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            mapFlipMenuItem(row.name, e.target.value);
                            setMessage(`Mapped "${row.name}" to recipe.`);
                          }
                        }}
                      >
                        <option value="">Select recipe…</option>
                        {db.recipes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent sync logs */}
      <section className="os-card p-6">
        <h2 className="text-lg font-semibold text-[#1B3A2D]">Recent Sync Activity</h2>
        <div className="mt-4 space-y-3">
          {logs.length === 0 ? (
            <p className="text-sm text-[var(--os-fg-muted-on-card)]">No sync activity yet.</p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--os-border)] bg-white/50 px-4 py-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  {log.status === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : log.status === "partial" ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-600" />
                  )}
                  <div>
                    <p className="font-medium capitalize">{log.syncType.replace(/_/g, " ")}</p>
                    <p className="text-xs text-[var(--os-fg-muted-on-card)]">{log.message}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-[var(--os-fg-muted-on-card)]">
                  <p>{log.recordsImported} imported</p>
                  <p>{new Date(log.createdAt).toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Flip sales snapshot */}
      <section className="os-card p-6">
        <h2 className="text-lg font-semibold text-[#1B3A2D]">Imported Flip Orders</h2>
        <p className="mt-1 text-sm text-[var(--os-fg-muted-on-card)]">
          {db.flipSales.length} orders on file ·{" "}
          {db.sales.filter((s) => s.source === "flip_office" || s.source === "csv").length} internal
          sale lines from Flip Office
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-[var(--os-fg-muted-on-card)]">
                <th className="pb-2 pr-4">Order</th>
                <th className="pb-2 pr-4">Outlet</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4 text-right">Total</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {db.flipSales.slice(0, 15).map((sale) => (
                <tr key={sale.id} className="border-b border-[var(--os-border)]/60">
                  <td className="py-2.5 pr-4 font-medium">{sale.orderNumber}</td>
                  <td className="py-2.5 pr-4">{sale.outlet}</td>
                  <td className="py-2.5 pr-4">{sale.saleDate}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">
                    {formatInr(sale.totalPaise / 100)}
                  </td>
                  <td className="py-2.5">
                    <StatusBadge status={sale.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {message ? (
        <p className="rounded-lg border border-[var(--os-border)] bg-white/70 px-4 py-3 text-sm">
          {message}
        </p>
      ) : null}

      <p className="text-xs text-[var(--os-fg-muted-on-card)]">
        Tip: Leave API fields blank to use demo sync with sample orders from your menu catalog.{" "}
        <Link href="/os/operations/sales" className="underline">
          View sales operations
        </Link>
      </p>
    </div>
  );
}
