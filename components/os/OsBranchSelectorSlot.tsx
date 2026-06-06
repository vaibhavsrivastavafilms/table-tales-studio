"use client";

import BranchSelector from "@/components/os/BranchSelector";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";

type OsBranchSelectorSlotProps = {
  compact?: boolean;
};

export default function OsBranchSelectorSlot({ compact }: OsBranchSelectorSlotProps) {
  const { db, activeBranchId, setActiveBranch } = useProcurement();
  return (
    <BranchSelector
      branches={db.branches}
      activeBranchId={activeBranchId}
      onChange={setActiveBranch}
      compact={compact}
    />
  );
}
