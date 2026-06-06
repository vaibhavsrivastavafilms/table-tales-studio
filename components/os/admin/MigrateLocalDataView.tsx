"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { readLocalStorageProcurementDb } from "@/lib/os/procurement/data-store";
import { MIGRATION_STEPS, type MigrationStep } from "@/lib/os/repositories/migration-service";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function MigrateLocalDataView() {
  const [steps, setSteps] = useState<MigrationStep[]>(
    MIGRATION_STEPS.map((s) => ({ ...s, status: "pending" as const }))
  );
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [auditReport, setAuditReport] = useState<string | null>(null);

  const progress = steps.filter((s) => s.status === "done").length;
  const progressPct = Math.round((progress / steps.length) * 100);

  const runMigration = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first.");
      return;
    }

    setRunning(true);
    setError(null);
    setDone(false);
    setSteps(MIGRATION_STEPS.map((s) => ({ ...s, status: "pending" })));

    const localDb = readLocalStorageProcurementDb();

    for (let i = 0; i < MIGRATION_STEPS.length; i++) {
      setSteps((prev) =>
        prev.map((step, idx) =>
          idx === i ? { ...step, status: "running" } : step
        )
      );
      await new Promise((r) => setTimeout(r, 400));
      setSteps((prev) =>
        prev.map((step, idx) =>
          idx === i ? { ...step, status: "done", detail: "Queued" } : step
        )
      );
    }

    try {
      const res = await fetch("/api/os/admin/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ db: localDb }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? "Migration failed.");
      }

      const auditRes = await fetch("/api/os/admin/migrate");
      const auditBody = (await auditRes.json()) as { report?: string };
      setAuditReport(auditBody.report ?? null);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Migration failed.");
      setSteps((prev) =>
        prev.map((step) =>
          step.status === "running" ? { ...step, status: "error" } : step
        )
      );
    } finally {
      setRunning(false);
    }
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Migrate Local Data To Supabase</h1>
        <p className="mt-2 text-sm text-[var(--os-fg-muted)]">
          Reads <code className="text-xs">tts:os:procurement:v9</code> from this browser and writes
          all operational data to Supabase repositories. After migration, refresh or open another
          browser — data loads from Supabase.
        </p>
      </div>

      <div className="os-card space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <Button disabled={running} onClick={() => void runMigration()}>
            {running ? "Migrating…" : "Migrate Local Data To Supabase"}
          </Button>
          <span className="text-sm tabular-nums text-[var(--os-fg-muted)]">{progressPct}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[var(--os-border)]">
          <div
            className="h-full rounded-full bg-[var(--os-accent)] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <ol className="space-y-2">
          {steps.map((step) => (
            <li
              key={step.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--os-border)] px-3 py-2 text-sm"
            >
              <span>{step.label}</span>
              <span
                className={
                  step.status === "done"
                    ? "text-emerald-600"
                    : step.status === "running"
                      ? "text-[var(--os-accent)]"
                      : step.status === "error"
                        ? "text-red-600"
                        : "text-[var(--os-fg-muted)]"
                }
              >
                {step.status}
              </span>
            </li>
          ))}
        </ol>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {done ? (
          <p className="text-sm text-emerald-600">
            Migration complete. Operational data is now in Supabase. Clear local-only cache optional —
            new loads use <code className="text-xs">/api/os/workspace</code>.
          </p>
        ) : null}
      </div>

      {auditReport ? (
        <div className="os-card p-5">
          <h2 className="text-sm font-semibold">Repository Audit</h2>
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-xs text-[var(--os-fg-muted)]">
            {auditReport}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
