"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import BranchFilterBar from "@/components/os/BranchFilterBar";
import { PageHeader, StatCard } from "@/components/os/procurement/ProcurementUi";
import { computeBranchAnalytics } from "@/lib/os/branches";

export default function BranchesView() {
  const { db, saveBranch, activeBranchId } = useProcurement();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const analytics = useMemo(
    () =>
      db.branches.map((b) => ({
        branch: b,
        stats: computeBranchAnalytics(db, b.id),
      })),
    [db]
  );
  const selected = db.branches.find((b) => b.id === activeBranchId);

  function handleSave() {
    if (!selected || !name.trim()) return;
    saveBranch({ ...selected, name: name.trim() || selected.name, code: code || selected.code });
    setName("");
    setCode("");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Branches"
        description="Multi-branch architecture for Table Tales outlets and Pure Foods Central Kitchen."
      />
      <BranchFilterBar />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {analytics.map(({ branch, stats }) => (
          <div key={branch.id} className="os-card p-4">
            <p className="font-semibold text-[var(--os-fg-on-card)]">{branch.name}</p>
            <p className="text-xs text-[var(--os-fg-muted-on-card)]">{branch.code}</p>
            <p className="mt-2 text-xs">Manager: {branch.managerName ?? "—"}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <StatCard label="Month revenue" value={`₹${stats.monthRevenue.toLocaleString("en-IN")}`} />
              <StatCard label="Headcount" value={stats.headcount} />
            </div>
          </div>
        ))}
      </div>

      {selected ? (
        <div className="os-card grid gap-3 p-5 md:grid-cols-2">
          <h3 className="md:col-span-2 text-sm font-semibold">Edit {selected.name}</h3>
          <Input placeholder="Branch name" value={name} onChange={(e) => setName(e.target.value)} className="bg-white/90" />
          <Input placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} className="bg-white/90" />
          <Input placeholder="Manager" defaultValue={selected.managerName ?? ""} className="bg-white/90 md:col-span-2" />
          <Button onClick={handleSave} className="md:col-span-2">Save branch settings</Button>
        </div>
      ) : null}
    </div>
  );
}
