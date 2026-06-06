import { coalesceBranchId } from "@/lib/os/branches";
import type { Employee, EmployeeDepartment, EmployeeStatus } from "@/lib/os/procurement/types";

export type EmployeeMasterInput = {
  employeeCode: string;
  name: string;
  department: EmployeeDepartment;
  designation: string;
  outlet?: string;
  phone?: string | null;
  email?: string | null;
  dateOfJoining: string;
  monthlySalary: number;
  hourlyRate?: number | null;
  flipOfficeId?: string | null;
  status?: EmployeeStatus;
};

export function listEmployeesWithStats(
  employees: Employee[],
  attendanceCountByEmployee: Map<string, number>
) {
  return employees.map((emp) => ({
    ...emp,
    attendanceDays: attendanceCountByEmployee.get(emp.id) ?? 0,
  }));
}

export function findEmployeeByCode(
  employees: Employee[],
  code: string
): Employee | undefined {
  const norm = code.trim().toUpperCase();
  return employees.find(
    (e) =>
      e.employeeCode.toUpperCase() === norm ||
      e.flipOfficeId?.toUpperCase() === norm
  );
}

export function buildEmployeePayload(
  input: EmployeeMasterInput,
  id: string,
  now: string
): Employee {
  return {
    id,
    branchId: coalesceBranchId(input.outlet),
    flipOfficeId: input.flipOfficeId ?? null,
    employeeCode: input.employeeCode.trim().toUpperCase(),
    name: input.name.trim(),
    department: input.department,
    designation: input.designation,
    outlet: input.outlet ?? "Table Tales",
    phone: input.phone ?? null,
    email: input.email ?? null,
    dateOfJoining: input.dateOfJoining,
    monthlySalary: input.monthlySalary,
    hourlyRate: input.hourlyRate ?? null,
    status: input.status ?? "active",
    createdAt: now,
  };
}

export const DEPARTMENT_LABELS: Record<EmployeeDepartment, string> = {
  kitchen: "Kitchen",
  service: "Service",
  management: "Management",
  central_kitchen: "Central Kitchen",
  procurement: "Procurement",
};
