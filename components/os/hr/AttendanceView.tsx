"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { PageHeader, StatCard, StatusBadge } from "@/components/os/procurement/ProcurementUi";
import {
  computeAttendanceStats,
  getAttendanceForDate,
} from "@/lib/os/hr/attendance";

export default function AttendanceView() {
  const { db, importAttendanceFromCsv, importAttendance } = useProcurement();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [csvText, setCsvText] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const month = date.slice(0, 7);
  const dayRecords = useMemo(() => getAttendanceForDate(db, date), [db, date]);
  const stats = useMemo(() => computeAttendanceStats(db, month), [db, month]);

  async function syncFlipOffice() {
    setLoading(true);
    setSyncMessage("");
    try {
      const res = await fetch("/api/os/hr/flip-office-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ db, date }),
      });
      const data = (await res.json()) as {
        rows?: Parameters<typeof importAttendance>[0];
        imported?: number;
        skipped?: number;
        message?: string;
        source?: string;
      };
      if (data.rows?.length) {
        const result = importAttendance(data.rows, "flip_office");
        setSyncMessage(
          `Synced ${result.imported} records (${result.skipped} skipped) via ${data.source ?? "Flip Office"}.`
        );
      } else {
        setSyncMessage(data.message ?? "No records returned from Flip Office.");
      }
    } catch {
      setSyncMessage("Flip Office sync failed. Use CSV import or check API credentials.");
    } finally {
      setLoading(false);
    }
  }

  function handleCsvImport() {
    const result = importAttendanceFromCsv(csvText);
    setSyncMessage(`CSV import: ${result.imported} records, ${result.skipped} skipped.`);
    setCsvText("");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="HR"
        title="Attendance"
        description="Daily attendance from Flip Office sync or CSV import. Never overwrites audit history."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Present (month)" value={stats.present} />
        <StatCard label="Absent (month)" value={stats.absent} />
        <StatCard label="Attendance rate" value={`${stats.attendanceRate.toFixed(1)}%`} />
        <StatCard label="Overtime hrs" value={stats.overtimeHours.toFixed(1)} />
      </div>

      <div className="os-card flex flex-wrap items-end gap-3 p-5">
        <div>
          <label className="text-xs font-medium text-[var(--os-fg-muted-on-card)]">
            Date
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 bg-white/90"
            />
          </label>
        </div>
        <Button onClick={syncFlipOffice} disabled={loading}>
          {loading ? "Syncing…" : "Sync Flip Office"}
        </Button>
      </div>

      <div className="os-card space-y-3 p-5">
        <h3 className="text-sm font-semibold text-[var(--os-fg-on-card)]">CSV import</h3>
        <p className="text-xs text-[var(--os-fg-muted-on-card)]">
          Columns: employee_code, employee_name, date, check_in, check_out, status, hours_worked
        </p>
        <textarea
          className="min-h-[120px] w-full rounded-md border border-[var(--os-border)] bg-white/90 p-3 text-sm"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="employee_code,employee_name,date,check_in,check_out,status,hours_worked"
        />
        <Button variant="secondary" onClick={handleCsvImport}>
          Import CSV
        </Button>
        {syncMessage ? (
          <p className="text-sm text-[var(--os-fg-muted-on-card)]">{syncMessage}</p>
        ) : null}
      </div>

      <section className="os-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-[var(--os-fg-on-card)]">
          Attendance · {date}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-[10px] uppercase text-[var(--os-fg-muted-on-card)]">
                <th className="pb-2">Employee</th>
                <th className="pb-2">In</th>
                <th className="pb-2">Out</th>
                <th className="pb-2">Hours</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {dayRecords.map((r) => (
                <tr key={r.id} className="border-t border-[var(--os-border)]">
                  <td className="py-2">{r.employeeName}</td>
                  <td className="py-2">{r.checkIn ?? "—"}</td>
                  <td className="py-2">{r.checkOut ?? "—"}</td>
                  <td className="py-2">{r.hoursWorked.toFixed(1)}</td>
                  <td className="py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="py-2">{r.source}</td>
                </tr>
              ))}
              {!dayRecords.length ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[var(--os-fg-muted-on-card)]">
                    No attendance for this date. Sync Flip Office or import CSV.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {db.flipOfficeSyncLogs[0] ? (
        <p className="text-xs text-[var(--os-fg-muted)]">
          Last sync: {db.flipOfficeSyncLogs[0].message} ·{" "}
          {new Date(db.flipOfficeSyncLogs[0].createdAt).toLocaleString("en-IN")}
        </p>
      ) : null}
    </div>
  );
}
