"use client";

import {
  getProcurementRole,
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
  if (typeof window === "undefined") {
    return { role: "owner" as ProcurementRole, userId: "system", userName: "System" };
  }
  const role = getProcurementRole();
  return {
    role,
    userId: role,
    userName: roleLabel(role),
  };
}

export default function ProcurementRoleBar() {
  const role = typeof window !== "undefined" ? getProcurementRole() : "owner";

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-[var(--os-fg-muted-on-card)]">Acting as</span>
      <select
        className="rounded-md border border-[var(--os-border)] bg-white/90 px-2 py-1 text-[var(--os-fg-on-card)]"
        value={role}
        onChange={(e) => setProcurementRole(e.target.value as ProcurementRole)}
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
