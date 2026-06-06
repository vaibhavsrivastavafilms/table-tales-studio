"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import ProcurementRoleBar from "@/components/os/procurement/ProcurementRoleBar";
import {
  formatInr,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/os/procurement/ProcurementUi";
import { listPayrollRuns } from "@/lib/os/hr/payroll";
import { currentMonthKey } from "@/lib/os/reports/monthly-mis";

export default function PayrollView() {
  const { db, runPayroll, approvePayroll } = useProcurement();
  const [month, setMonth] = useState(currentMonthKey());
  const [outlet, setOutlet] = useState("Table Tales");
  const runs = useMemo(() => listPayrollRuns(db), [db]);
  const monthRuns = runs.filter((r) => r.month === month);
  const lines = db.payrollLines.filter((l) =>
    monthRuns.some((r) => r.id === l.payrollRunId)
  );
  const totalNet = monthRuns.reduce((s, r) => s + r.totalNet, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="HR"
          title="Payroll"
          description="Generate payroll from attendance, approve runs, and feed labor cost into MIS."
        />
        <ProcurementRoleBar />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Month net payroll" value={formatInr(totalNet)} />
        <StatCard label="Runs" value={monthRuns.length} />
        <StatCard label="Employees paid" value={lines.length} />
      </div>

      <div className="os-card flex flex-wrap items-end gap-3 p-5">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
        />
        <select
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
          value={outlet}
          onChange={(e) => setOutlet(e.target.value)}
        >
          <option value="Table Tales">Table Tales</option>
          <option value="Pure Foods Central Kitchen">Pure Foods Central Kitchen</option>
        </select>
        <Button onClick={() => runPayroll(month, outlet)}>Generate Payroll</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="os-card p-5">
          <h3 className="text-sm font-semibold text-[var(--os-fg-on-card)]">Payroll runs</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {monthRuns.map((run) => (
              <li key={run.id} className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {run.outlet} · {formatInr(run.totalNet)}
                  </p>
                  <p className="text-xs text-[var(--os-fg-muted-on-card)]">
                    {run.employeeCount} employees · gross {formatInr(run.totalGross)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={run.status} />
                  {run.status === "draft" ? (
                    <Button size="sm" variant="secondary" onClick={() => approvePayroll(run.id)}>
                      Approve
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
            {!monthRuns.length ? (
              <li className="text-[var(--os-fg-muted-on-card)]">
                No payroll runs for {month}. Generate from attendance first.
              </li>
            ) : null}
          </ul>
        </section>

        <section className="os-card overflow-x-auto p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--os-fg-on-card)]">
            Payroll lines
          </h3>
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="text-[10px] uppercase text-[var(--os-fg-muted-on-card)]">
                <th className="pb-2">Employee</th>
                <th className="pb-2">Present</th>
                <th className="pb-2">Net pay</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-t border-[var(--os-border)]">
                  <td className="py-2">{line.employeeName}</td>
                  <td className="py-2">{line.daysPresent}</td>
                  <td className="py-2">{formatInr(line.netPay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
