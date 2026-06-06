import { NextResponse } from "next/server";
import {
  fetchFlipOfficeDailyAttendance,
  getFlipOfficeConfig,
} from "@/lib/os/hr/flip-office";
import { buildAttendanceRecord, resolveEmployeeForAttendance } from "@/lib/os/hr/attendance";
import type { FlipOfficeAttendanceRow } from "@/lib/os/hr/attendance";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export const runtime = "nodejs";

function demoRows(db: ProcurementDb, date: string): FlipOfficeAttendanceRow[] {
  return db.employees
    .filter((e) => e.status === "active")
    .slice(0, 5)
    .map((emp, idx) => ({
      employeeCode: emp.employeeCode,
      name: emp.name,
      date,
      checkIn: "09:00",
      checkOut: idx === 2 ? "14:00" : "18:00",
      status: idx === 2 ? "half_day" : idx === 4 ? "absent" : "present",
      hoursWorked: idx === 2 ? 5 : idx === 4 ? 0 : 8,
      overtimeHours: idx === 0 ? 1 : 0,
    }));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { db?: ProcurementDb; date?: string };
    const db = body.db;
    const date = body.date ?? new Date().toISOString().slice(0, 10);
    if (!db) {
      return NextResponse.json({ error: "db required" }, { status: 400 });
    }

    const config = getFlipOfficeConfig();
    let rows: FlipOfficeAttendanceRow[] = [];

    if (config.apiUrl && config.apiKey) {
      rows = await fetchFlipOfficeDailyAttendance(date);
    } else {
      rows = demoRows(db, date);
    }

    const preview = rows
      .map((row) => {
        const employee = resolveEmployeeForAttendance(db, row);
        if (!employee) return null;
        return buildAttendanceRecord(employee, row, "flip_office", new Date().toISOString());
      })
      .filter(Boolean);

    return NextResponse.json({
      rows,
      previewCount: preview.length,
      skipped: rows.length - preview.length,
      source: config.apiUrl ? "flip_office_api" : "demo",
      message:
        config.apiUrl && config.apiKey
          ? `Fetched ${rows.length} rows from Flip Office for ${date}.`
          : `Demo sync: set FLIP_OFFICE_API_URL and FLIP_OFFICE_API_KEY for live sync.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "sync failed" },
      { status: 500 }
    );
  }
}
