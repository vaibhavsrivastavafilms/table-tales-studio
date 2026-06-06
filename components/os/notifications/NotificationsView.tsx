"use client";

import Link from "next/link";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { PageHeader } from "@/components/os/procurement/ProcurementUi";
import { unreadCount } from "@/lib/os/notifications/engine";

export default function NotificationsView() {
  const { db, markRead, refreshAlerts } = useProcurement();
  const unread = unreadCount(db.notifications);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Alerts"
        title="Notifications"
        description="Operational alerts across stock, procurement, workforce, and finance."
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={refreshAlerts}
          className="rounded-md bg-[var(--os-accent)] px-3 py-2 text-xs text-white"
        >
          Refresh
        </button>
        <Link
          href="/os/notifications/preferences"
          className="rounded-md border border-[var(--os-border)] px-3 py-2 text-xs"
        >
          Preferences
        </Link>
        <span className="text-xs text-[var(--os-fg-muted)]">{unread} unread</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          {db.notifications.slice(0, 30).map((n) => (
            <div key={n.id} className={`os-card p-4 ${n.read ? "opacity-70" : ""}`}>
              <div className="flex justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase text-[var(--os-accent)]">{n.type}</p>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-[var(--os-fg-muted-on-card)]">{n.detail}</p>
                </div>
                {!n.read ? (
                  <button
                    type="button"
                    className="text-xs text-[var(--os-accent)]"
                    onClick={() => markRead(n.id)}
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
              {n.href ? (
                <Link href={n.href} className="mt-2 inline-block text-xs text-[var(--os-accent)]">
                  Open
                </Link>
              ) : null}
            </div>
          ))}
        </div>
        <div className="os-card space-y-3 p-4 text-sm">
          <h3 className="font-semibold">Alert channels</h3>
          <p className="text-xs text-[var(--os-fg-muted-on-card)]">
            Choose which alerts you receive — low stock, food cost, approvals, vendor payments, and more.
          </p>
          <Link
            href="/os/notifications/preferences"
            className="inline-block rounded-md bg-[var(--os-primary)] px-3 py-2 text-xs text-white"
          >
            Manage preferences
          </Link>
        </div>
      </div>
    </div>
  );
}
