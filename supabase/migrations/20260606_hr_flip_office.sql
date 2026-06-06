-- Table Tales OS · HR & Flip Office Integration
-- Run after 20260606_procurement_os_v2.sql

create type employee_status as enum ('active', 'inactive', 'on_leave');
create type employee_department as enum (
  'kitchen', 'service', 'management', 'central_kitchen', 'procurement'
);
create type attendance_status as enum (
  'present', 'absent', 'half_day', 'leave', 'holiday', 'week_off'
);
create type attendance_source as enum ('flip_office', 'csv', 'manual');
create type payroll_run_status as enum ('draft', 'approved', 'paid');
create type expense_category as enum (
  'rent', 'utilities', 'marketing', 'maintenance', 'misc'
);

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  flip_office_id text,
  employee_code text not null unique,
  name text not null,
  department employee_department not null default 'kitchen',
  designation text not null,
  outlet text not null default 'Table Tales',
  phone text,
  email text,
  date_of_joining date not null,
  monthly_salary numeric not null default 0,
  hourly_rate numeric,
  status employee_status not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id),
  employee_name text not null,
  employee_code text not null,
  date date not null,
  check_in time,
  check_out time,
  hours_worked numeric not null default 0,
  overtime_hours numeric not null default 0,
  status attendance_status not null default 'present',
  source attendance_source not null default 'manual',
  synced_at timestamptz not null default now(),
  unique (employee_id, date)
);

create table if not exists payroll_runs (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  month text not null,
  outlet text not null,
  status payroll_run_status not null default 'draft',
  total_gross numeric not null default 0,
  total_deductions numeric not null default 0,
  total_net numeric not null default 0,
  employee_count int not null default 0,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  created_by text not null
);

create table if not exists payroll_lines (
  id uuid primary key default gen_random_uuid(),
  payroll_run_id uuid not null references payroll_runs(id) on delete cascade,
  employee_id uuid not null references employees(id),
  employee_name text not null,
  base_salary numeric not null default 0,
  overtime_pay numeric not null default 0,
  deductions numeric not null default 0,
  net_pay numeric not null default 0,
  days_present int not null default 0,
  days_absent int not null default 0
);

create table if not exists operating_expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  month text not null,
  category expense_category not null default 'misc',
  description text not null,
  amount numeric not null,
  outlet text not null default 'Table Tales',
  created_at timestamptz not null default now()
);

create table if not exists flip_office_sync_logs (
  id uuid primary key default gen_random_uuid(),
  sync_type text not null check (sync_type in ('attendance', 'employees')),
  records_imported int not null default 0,
  date date not null,
  status text not null check (status in ('success', 'partial', 'failed')),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_attendance_date on attendance_records(date);
create index if not exists idx_attendance_employee on attendance_records(employee_id);
create index if not exists idx_payroll_runs_month on payroll_runs(month);
create index if not exists idx_operating_expenses_month on operating_expenses(month);
create index if not exists idx_employees_flip_office on employees(flip_office_id);
