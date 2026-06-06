import type { Employee } from "@/lib/os/procurement/types";
import { appId, getOsSupabase, upsertRows, type OsSupabase } from "@/lib/os/repositories/base";

function toRow(employee: Employee) {
  return {
    legacy_id: employee.id,
    branch_id: employee.branchId,
    flip_office_id: employee.flipOfficeId,
    employee_code: employee.employeeCode,
    name: employee.name,
    department: employee.department,
    designation: employee.designation,
    outlet: employee.outlet,
    phone: employee.phone,
    email: employee.email,
    date_of_joining: employee.dateOfJoining,
    monthly_salary: employee.monthlySalary,
    hourly_rate: employee.hourlyRate,
    status: employee.status,
    created_at: employee.createdAt,
  };
}

function fromRow(row: Record<string, unknown>): Employee {
  return {
    id: appId(row as { legacy_id?: string | null; id: string }),
    branchId: String(row.branch_id ?? "br_prahladnagar"),
    flipOfficeId: (row.flip_office_id as string | null) ?? null,
    employeeCode: String(row.employee_code),
    name: String(row.name),
    department: row.department as Employee["department"],
    designation: String(row.designation ?? ""),
    outlet: String(row.outlet ?? ""),
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    dateOfJoining: String(row.date_of_joining ?? new Date().toISOString().slice(0, 10)),
    monthlySalary: Number(row.monthly_salary ?? 0),
    hourlyRate: (row.hourly_rate as number | null) ?? null,
    status: (row.status as Employee["status"]) ?? "active",
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export class EmployeeRepository {
  constructor(private readonly supabase: OsSupabase) {}

  static async create(): Promise<EmployeeRepository> {
    return new EmployeeRepository(await getOsSupabase());
  }

  async list(): Promise<Employee[]> {
    const { data, error } = await this.supabase.from("employees").select("*").order("name");
    if (error) throw new Error(`employees list failed: ${error.message}`);
    return (data ?? []).map((row) => fromRow(row as Record<string, unknown>));
  }

  async saveAll(employees: Employee[]): Promise<void> {
    await upsertRows(this.supabase, "employees", employees.map(toRow), "legacy_id");
  }
}
