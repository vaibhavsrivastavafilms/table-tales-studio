"use client";

import { useEffect, useState } from "react";
import {
  getProcurementRole,
  loadProcurementRoleFromServer,
  roleLabel,
  setProcurementRole,
} from "@/lib/os/procurement/permissions";
import type { ProcurementRole } from "@/lib/os/procurement/types";

const ROLES: ProcurementRole[] = [
  "owner",
  "accountant",
  "procurement_manager",
  "store_manager",
  "kitchen_manager",
];

export function useProcurementActor() {
  const [role, setRole] = useState<ProcurementRole>("owner");

  useEffect(() => {
    void loadProcurementRoleFromServer().then(setRole);
  }, []);

  return {
    role,
    userId: role,
    userName: roleLabel(role),
  };
}

export default function ProcurementRoleBar() {
  const [role, setRole] = useState<ProcurementRole>(() =>
    typeof window !== "undefined" ? getProcurementRole() : "owner"
  );

  useEffect(() => {
    void loadProcurementRoleFromServer().then(setRole);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-[var(--os-fg-muted-on-card)]">Acting as</span>
      <select
        className="rounded-md border border-[var(--os-border)] bg-white/90 px-2 py-1 text-[var(--os-fg-on-card)]"
        value={role}
        onChange={(e) => {
          const next = e.target.value as ProcurementRole;
          setRole(next);
          void setProcurementRole(next);
        }}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {roleLabel(r)}
          </option>
        ))}
      </select>
    </div>
  );
}
