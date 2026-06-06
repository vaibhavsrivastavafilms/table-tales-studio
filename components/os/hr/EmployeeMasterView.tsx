"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { PageHeader, StatusBadge } from "@/components/os/procurement/ProcurementUi";
import {
  DEPARTMENT_LABELS,
  type EmployeeMasterInput,
} from "@/lib/os/hr/employee-master";
import type { EmployeeDepartment } from "@/lib/os/procurement/types";

export default function EmployeeMasterView() {
  const { db, saveEmployee, updateEmployee } = useProcurement();
  const employees = useMemo(() => db.employees, [db.employees]);
  const [form, setForm] = useState<EmployeeMasterInput>({
    employeeCode: "",
    name: "",
    department: "kitchen",
    designation: "",
    outlet: "Table Tales",
    dateOfJoining: new Date().toISOString().slice(0, 10),
    monthlySalary: 25000,
    flipOfficeId: null,
  });

  function handleCreate() {
    if (!form.employeeCode.trim() || !form.name.trim()) return;
    saveEmployee(form);
    setForm({
      employeeCode: "",
      name: "",
      department: "kitchen",
      designation: "",
      outlet: "Table Tales",
      dateOfJoining: new Date().toISOString().slice(0, 10),
      monthlySalary: 25000,
      flipOfficeId: null,
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="HR"
        title="Employee Master"
        description="Workforce registry synced with Flip Office IDs, departments, and salary structures."
      />

      <div className="os-card grid gap-3 p-5 md:grid-cols-2">
        <Input
          placeholder="Employee code (TT-K001)"
          value={form.employeeCode}
          onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
          className="bg-white/90"
        />
        <Input
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="bg-white/90"
        />
        <Input
          placeholder="Flip Office ID"
          value={form.flipOfficeId ?? ""}
          onChange={(e) => setForm({ ...form, flipOfficeId: e.target.value || null })}
          className="bg-white/90"
        />
        <select
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
          value={form.department}
          onChange={(e) =>
            setForm({ ...form, department: e.target.value as EmployeeDepartment })
          }
        >
          {Object.entries(DEPARTMENT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <Input
          placeholder="Designation"
          value={form.designation}
          onChange={(e) => setForm({ ...form, designation: e.target.value })}
          className="bg-white/90"
        />
        <Input
          placeholder="Monthly salary"
          type="number"
          value={form.monthlySalary}
          onChange={(e) =>
            setForm({ ...form, monthlySalary: Number(e.target.value) || 0 })
          }
          className="bg-white/90"
        />
        <Button onClick={handleCreate} className="md:col-span-2">
          Add Employee
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {employees.map((emp) => (
          <div key={emp.id} className="os-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[var(--os-fg-on-card)]">{emp.name}</p>
                <p className="text-xs text-[var(--os-fg-muted-on-card)]">
                  {emp.employeeCode} · {DEPARTMENT_LABELS[emp.department]}
                </p>
              </div>
              <StatusBadge status={emp.status} />
            </div>
            <p className="mt-2 text-sm">{emp.designation}</p>
            <p className="text-xs text-[var(--os-fg-muted-on-card)]">
              {emp.outlet} · ₹{emp.monthlySalary.toLocaleString("en-IN")}/mo
            </p>
            {emp.flipOfficeId ? (
              <p className="mt-1 text-xs text-[var(--os-accent)]">
                Flip Office: {emp.flipOfficeId}
              </p>
            ) : null}
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() =>
                updateEmployee(emp.id, {
                  status: emp.status === "active" ? "inactive" : "active",
                })
              }
            >
              Toggle status
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
