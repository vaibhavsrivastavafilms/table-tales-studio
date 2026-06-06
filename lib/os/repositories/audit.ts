export type RepositoryMigrationStatus = "Migrated" | "Partially Migrated" | "Not Migrated";

export type ModuleAuditRow = {
  module: string;
  status: RepositoryMigrationStatus;
  storage: string;
  evidence: string;
};

/** Phase 6 repository audit — reflects Supabase repository wiring. */
export function buildRepositoryAuditReport(): ModuleAuditRow[] {
  return [
    {
      module: "Procurement",
      status: "Migrated",
      storage: "purchase_bills, purchase_items, grn_receipts + extensions",
      evidence: "lib/os/repositories/purchase-repository.ts",
    },
    {
      module: "Inventory",
      status: "Migrated",
      storage: "inventory_items, inventory_movements, opening_stock, closing_stock",
      evidence: "lib/os/repositories/inventory-repository.ts",
    },
    {
      module: "Recipes",
      status: "Migrated",
      storage: "recipes, recipe_ingredients + menu data in extensions",
      evidence: "lib/os/repositories/recipe-repository.ts",
    },
    {
      module: "Food Cost",
      status: "Partially Migrated",
      storage: "recipe cost snapshots in os_workspace_extensions.payload",
      evidence: "lib/os/repositories/extension-repository.ts",
    },
    {
      module: "Payroll",
      status: "Migrated",
      storage: "payroll_runs, payroll_lines",
      evidence: "lib/os/repositories/payroll-repository.ts",
    },
    {
      module: "Attendance",
      status: "Migrated",
      storage: "attendance_records",
      evidence: "lib/os/repositories/expense-repository.ts (AttendanceRepository)",
    },
    {
      module: "Expenses",
      status: "Migrated",
      storage: "operating_expenses",
      evidence: "lib/os/repositories/expense-repository.ts",
    },
    {
      module: "Vendor Ledger",
      status: "Migrated",
      storage: "vendor_ledger, vendor_payments in extensions",
      evidence: "lib/os/repositories/credit-note-repository.ts (VendorLedgerRepository)",
    },
    {
      module: "Credit Notes",
      status: "Migrated",
      storage: "credit_notes",
      evidence: "lib/os/repositories/credit-note-repository.ts",
    },
    {
      module: "Wastage",
      status: "Partially Migrated",
      storage: "inventory_movements.type = wastage",
      evidence: "lib/os/repositories/inventory-repository.ts",
    },
    {
      module: "MIS",
      status: "Migrated",
      storage: "daily_mis_reports",
      evidence: "lib/os/repositories/mis-repository.ts",
    },
    {
      module: "Flip Office",
      status: "Partially Migrated",
      storage: "flip_sales/* tables + flipOffice* in extensions",
      evidence: "lib/os/repositories/extension-repository.ts",
    },
  ];
}

export function formatRepositoryAuditMarkdown(): string {
  const rows = buildRepositoryAuditReport();
  const lines = [
    "# Table Tales OS — Repository Audit",
    "",
    "| Module | Supabase Status | Storage | Evidence |",
    "|--------|-----------------|---------|----------|",
    ...rows.map(
      (r) => `| ${r.module} | ${r.status} | ${r.storage} | \`${r.evidence}\` |`
    ),
  ];
  return lines.join("\n");
}
