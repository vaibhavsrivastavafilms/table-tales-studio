"use client";

import BranchSelector from "@/components/os/BranchSelector";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";

export default function BranchFilterBar() {
  const { db, activeBranchId, setActiveBranch } = useProcurement();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--os-fg-muted)]">
        Branch
      </span>
      <BranchSelector
        branches={db.branches}
        activeBranchId={activeBranchId}
        onChange={setActiveBranch}
        compact
      />
    </div>
  );
}
