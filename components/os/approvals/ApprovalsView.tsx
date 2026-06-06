"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import BranchFilterBar from "@/components/os/BranchFilterBar";
import {
  APPROVAL_TYPE_LABELS,
  canReviewApproval,
  countPendingApprovals,
  listApprovalsByStatus,
} from "@/lib/os/approvals/engine";
import { formatPaise } from "@/lib/os/money";
import { PageHeader, StatusBadge } from "@/components/os/procurement/ProcurementUi";
import { getProcurementRole } from "@/lib/os/procurement/permissions";
import type { ApprovalStatus } from "@/lib/os/procurement/types";
import { cn } from "@/lib/utils";

type Tab = ApprovalStatus | "all";

const TABS: { id: Tab; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

export default function ApprovalsView() {
  const { db, activeBranchId, reviewApprovalRequest } = useProcurement();
  const role = typeof window !== "undefined" ? getProcurementRole() : "owner";
  const [tab, setTab] = useState<Tab>("pending");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const rows = useMemo(
    () => listApprovalsByStatus(db, tab, activeBranchId),
    [db, tab, activeBranchId]
  );

  const pendingCount = countPendingApprovals(db, activeBranchId);

  function handleReject(id: string) {
    if (!rejectNote.trim()) return;
    reviewApprovalRequest(id, "rejected", rejectNote.trim());
    setRejectId(null);
    setRejectNote("");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Workflow"
        title="Approval Queue"
        description="Purchases, expenses, credit notes, inventory adjustments, and payroll."
      />
      <BranchFilterBar />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              tab === t.id
                ? "bg-[var(--os-terracotta)] text-white"
                : "border border-[var(--os-border)] bg-white/60"
            )}
          >
            {t.label}
            {t.id === "pending" && pendingCount ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {rows.map((req) => (
          <div key={req.id} className="os-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="rounded-full bg-[var(--os-terracotta)]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--os-terracotta)]">
                  {APPROVAL_TYPE_LABELS[req.type]}
                </span>
                <p className="mt-2 font-medium">{req.entityLabel}</p>
                <p className="text-xs text-[var(--os-fg-muted-on-card)]">
                  {formatPaise(req.amountPaise)} · {req.requestedBy} ·{" "}
                  {new Date(req.createdAt).toLocaleDateString("en-IN")} · needs{" "}
                  {req.requiredRole}
                </p>
              </div>
              <StatusBadge status={req.status} />
            </div>

            {req.status === "pending" && canReviewApproval(role, req) ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => reviewApprovalRequest(req.id, "approved")}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setRejectId(req.id)}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    reviewApprovalRequest(req.id, "changes_requested", "Changes needed")
                  }
                >
                  Request changes
                </Button>
              </div>
            ) : null}

            {rejectId === req.id ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Input
                  placeholder="Rejection note (required)"
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  className="max-w-md bg-white/90"
                />
                <Button size="sm" variant="destructive" onClick={() => handleReject(req.id)}>
                  Confirm reject
                </Button>
              </div>
            ) : null}
          </div>
        ))}
        {!rows.length ? (
          <p className="py-8 text-center text-sm text-[var(--os-fg-muted)]">
            No approvals in this tab.
          </p>
        ) : null}
      </div>
    </div>
  );
}
