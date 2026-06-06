"use client";

import { ALL_BRANCHES_ID, getBranchName, setActiveBranchId } from "@/lib/os/branches";

type BranchSelectorProps = {
  branches: { id: string; name: string; code: string }[];
  activeBranchId: string;
  onChange: (branchId: string) => void;
  compact?: boolean;
};

export default function BranchSelector({
  branches,
  activeBranchId,
  onChange,
  compact,
}: BranchSelectorProps) {
  return (
    <select
      className={`rounded-md border border-[var(--os-border)] bg-white/90 text-[var(--os-fg-on-card)] ${
        compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
      }`}
      value={activeBranchId}
      onChange={(e) => {
        setActiveBranchId(e.target.value);
        onChange(e.target.value);
      }}
      aria-label="Select branch"
    >
      <option value={ALL_BRANCHES_ID}>All branches</option>
      {branches.map((b) => (
        <option key={b.id} value={b.id}>
          {compact ? b.code : b.name}
        </option>
      ))}
    </select>
  );
}

export function BranchLabel({
  branches,
  branchId,
}: {
  branches: { id: string; name: string }[];
  branchId: string;
}) {
  if (branchId === ALL_BRANCHES_ID) return <>All branches</>;
  const db = { branches } as Parameters<typeof getBranchName>[0];
  return <>{getBranchName(db, branchId)}</>;
}
