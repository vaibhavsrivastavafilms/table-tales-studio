"use client";

import { useMemo, useState } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  formatInr,
  PageHeader,
  StatCard,
} from "@/components/os/procurement/ProcurementUi";
import {
  buildLaborCostReport,
  compareLaborByOutlet,
} from "@/lib/os/reports/labor-cost";
import { currentMonthKey } from "@/lib/os/reports/monthly-mis";

export default function LaborCostView() {
  const { db } = useProcurement();
  const [month, setMonth] = useState(currentMonthKey());
  const report = useMemo(() => buildLaborCostReport(db, month), [db, month]);
  const outlets = useMemo(() => compareLaborByOutlet(db, month), [db, month]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="Labor Cost"
        description="Payroll vs revenue, attendance productivity, and outlet-level labor %."
      />

      <input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Labor cost %" value={`${report.laborCostPercent.toFixed(1)}%`} />
        <StatCard label="Payroll cost" value={formatInr(report.payrollCost)} />
        <StatCard label="Revenue" value={formatInr(report.revenue)} />
        <StatCard label="Attendance rate" value={`${report.attendanceRate.toFixed(1)}%`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Headcount" value={report.headcount} />
        <StatCard label="Cost / employee" value={formatInr(report.costPerEmployee)} />
        <StatCard label="Overtime hrs" value={report.overtimeHours.toFixed(1)} />
        <StatCard label="Total hours" value={report.totalHours.toFixed(1)} />
      </div>

      <section className="os-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-[var(--os-fg-on-card)]">
          Outlet comparison
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {outlets.map((o) => (
            <div key={o.outlet} className="rounded-lg border border-[var(--os-border)] p-3 text-sm">
              <p className="font-medium">{o.outlet}</p>
              <p className="text-[var(--os-fg-muted-on-card)]">
                Payroll {formatInr(o.total)} · Labor {o.laborCostPercent.toFixed(1)}% · Revenue{" "}
                {formatInr(o.revenue)}
              </p>
            </div>
          ))}
          {!outlets.length ? (
            <p className="text-sm text-[var(--os-fg-muted-on-card)]">
              Approve payroll runs to see outlet labor breakdown.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
