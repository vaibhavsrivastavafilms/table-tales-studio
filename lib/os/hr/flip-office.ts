import type { FlipOfficeAttendanceRow } from "@/lib/os/hr/attendance";
import type { Employee } from "@/lib/os/procurement/types";

export type FlipOfficeEmployeeRow = {
  id: string;
  employeeCode?: string;
  name: string;
  department?: string;
  designation?: string;
  outlet?: string;
  phone?: string;
  email?: string;
  monthlySalary?: number;
  dateOfJoining?: string;
  status?: string;
};

export type FlipOfficeSyncPayload = {
  date?: string;
  employees?: FlipOfficeEmployeeRow[];
  attendance?: FlipOfficeAttendanceRow[];
};

export type FlipOfficeApiConfig = {
  apiUrl: string | null;
  apiKey: string | null;
};

export function getFlipOfficeConfig(): FlipOfficeApiConfig {
  return {
    apiUrl: process.env.FLIP_OFFICE_API_URL?.trim() ?? null,
    apiKey: process.env.FLIP_OFFICE_API_KEY?.trim() ?? null,
  };
}

export async function fetchFlipOfficeDailyAttendance(
  date: string
): Promise<FlipOfficeAttendanceRow[]> {
  const { apiUrl, apiKey } = getFlipOfficeConfig();
  if (!apiUrl || !apiKey) {
    return [];
  }

  const url = new URL(apiUrl);
  url.searchParams.set("date", date);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Flip Office API error: ${res.status}`);
  }

  const data = (await res.json()) as FlipOfficeSyncPayload;
  return (data.attendance ?? []).map((row) => ({
    ...row,
    date: row.date ?? date,
  }));
}

export function mapFlipOfficeDepartment(raw?: string): Employee["department"] {
  const d = (raw ?? "kitchen").toLowerCase();
  if (d.includes("service") || d.includes("floor")) return "service";
  if (d.includes("manage") || d.includes("admin")) return "management";
  if (d.includes("central") || d.includes("prep")) return "central_kitchen";
  if (d.includes("procure")) return "procurement";
  return "kitchen";
}

export function normalizeFlipOfficeEmployees(rows: FlipOfficeEmployeeRow[]): FlipOfficeEmployeeRow[] {
  return rows.map((row) => ({
    ...row,
    employeeCode: row.employeeCode ?? row.id,
    department: row.department ?? "kitchen",
  }));
}
