import { computeAttendanceStats } from "@/lib/os/hr/attendance";
import { listPayrollRuns } from "@/lib/os/hr/payroll";
import type { OrgInsight, ProcurementDb } from "@/lib/os/procurement/types";

export function generateHrInsights(db: ProcurementDb, month: string): OrgInsight[] {
  const insights: OrgInsight[] = [];
  const attendance = computeAttendanceStats(db, month);
  const runs = listPayrollRuns(db).filter((r) => r.month === month);

  if (attendance.attendanceRate < 85 && attendance.workingDays > 0) {
    insights.push({
      id: "hr_low_attendance",
      severity: "warning",
      title: "Low attendance rate",
      detail: `Attendance is ${attendance.attendanceRate.toFixed(1)}% this month (${attendance.present} present, ${attendance.absent} absent).`,
      module: "hr",
    });
  }

  if (attendance.overtimeHours > attendance.activeEmployees * 10) {
    insights.push({
      id: "hr_overtime",
      severity: "warning",
      title: "High overtime hours",
      detail: `${attendance.overtimeHours.toFixed(1)} overtime hours logged — review scheduling and labor cost.`,
      module: "labor_cost",
    });
  }

  const draftPayroll = runs.filter((r) => r.status === "draft");
  if (draftPayroll.length) {
    insights.push({
      id: "hr_payroll_pending",
      severity: "info",
      title: "Payroll pending approval",
      detail: `${draftPayroll.length} payroll run(s) awaiting owner/accountant approval for ${month}.`,
      module: "payroll",
    });
  }

  const absentees = db.attendanceRecords
    .filter((a) => a.date.startsWith(month) && a.status === "absent")
    .reduce((map, r) => {
      map.set(r.employeeName, (map.get(r.employeeName) ?? 0) + 1);
      return map;
    }, new Map<string, number>());

  const topAbsent = [...absentees.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topAbsent && topAbsent[1] >= 3) {
    insights.push({
      id: "hr_absenteeism",
      severity: "critical",
      title: "Repeat absenteeism",
      detail: `${topAbsent[0]} has ${topAbsent[1]} absent days in ${month}.`,
      module: "workforce",
    });
  }

  const lastSync = db.flipOfficeSyncLogs[0];
  if (!lastSync || !lastSync.createdAt.startsWith(month)) {
    insights.push({
      id: "hr_flip_office_sync",
      severity: "info",
      title: "Flip Office sync needed",
      detail: "No attendance sync from Flip Office this month. Import CSV or run daily sync.",
      module: "hr",
    });
  }

  return insights;
}
