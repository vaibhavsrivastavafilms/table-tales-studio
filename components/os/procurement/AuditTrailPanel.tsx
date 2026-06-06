"use client";

import type { AuditLogEntry } from "@/lib/os/procurement/types";

type AuditTrailPanelProps = {
  entries: AuditLogEntry[];
  title?: string;
};

export default function AuditTrailPanel({
  entries,
  title = "Audit trail",
}: AuditTrailPanelProps) {
  if (!entries.length) {
    return (
      <p className="text-sm text-[var(--os-fg-muted-on-card)]">
        No audit entries yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[var(--os-fg-on-card)]">{title}</p>
      <ul className="max-h-80 space-y-2 overflow-y-auto">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="rounded-lg border border-[var(--os-border)] bg-white/50 p-3 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-[var(--os-fg-on-card)]">
                {entry.action}
              </span>
              <span className="text-[var(--os-fg-muted-on-card)]">
                {new Date(entry.createdAt).toLocaleString("en-IN")}
              </span>
            </div>
            <p className="mt-1 text-[var(--os-fg-muted-on-card)]">{entry.detail}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-[10px] uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
              <span>{entry.actionType}</span>
              <span>{entry.userName ?? entry.userId}</span>
              {entry.field ? <span>Field: {entry.field}</span> : null}
              {entry.ip ? <span>IP: {entry.ip}</span> : null}
            </div>
            {entry.oldValue != null || entry.newValue != null ? (
              <p className="mt-1 font-mono text-[11px] text-[var(--os-fg-on-card)]">
                {entry.oldValue != null ? `${entry.oldValue} → ` : ""}
                {entry.newValue ?? ""}
                {entry.reason ? ` (${entry.reason})` : ""}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
