-- Table Tales OS · Multi-branch platform (branches, expenses, approvals, notifications, vault, P&L, daily MIS)
-- Apply after 20260606_procurement_os_v2.sql

create type branch_status as enum ('active', 'inactive');
create type approval_type as enum (
  'purchase_approval',
  'expense_approval',
  'credit_note_approval',
  'inventory_adjustment_approval',
  'payroll_approval'
);
create type approval_status as enum ('pending', 'approved', 'rejected', 'changes_requested');
create type notification_type as enum (
  'low_stock',
  'pending_credit_notes',
  'vendor_payment_due',
  'high_variance',
  'attendance_issues',
  'payroll_due',
  'expense_pending_approval',
  'purchase_pending_approval',
  'food_cost_alert',
  'labor_cost_alert'
);
create type expense_category as enum (
  'rent', 'electricity', 'gas', 'water', 'internet', 'marketing', 'maintenance',
  'repairs', 'licenses', 'software', 'petty_cash', 'housekeeping', 'uniforms',
  'transport', 'miscellaneous'
);
create type expense_status as enum ('draft', 'pending_approval', 'approved', 'rejected');
create type document_category as enum (
  'invoice', 'credit_note', 'vendor_document', 'payroll_report', 'attendance_report',
  'mis_report', 'expense_attachment', 'contract', 'branch_document'
);

-- Branches
create table if not exists branches (
  id text primary key,
  name text not null,
  code text not null unique,
  address text,
  manager_name text,
  manager_phone text,
  gst_number text,
  status branch_status not null default 'active',
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into branches (id, name, code, address, manager_name, status) values
  ('br_prahladnagar', 'Table Tales Prahladnagar', 'TT-PRA', 'Prahladnagar, Ahmedabad', 'Rajesh Mehta', 'active'),
  ('br_sbr', 'Table Tales SBR', 'TT-SBR', 'SBR, Ahmedabad', 'Priya Shah', 'active'),
  ('br_nikol', 'Table Tales Nikol', 'TT-NIK', 'Nikol, Ahmedabad', 'Amit Patel', 'active'),
  ('br_central_kitchen', 'Pure Foods Central Kitchen', 'PF-CK', 'Central Kitchen, Ahmedabad', 'Suresh Kumar', 'active')
on conflict (id) do nothing;

-- branch_id on core business tables
alter table if exists purchase_bills add column if not exists branch_id text references branches(id);
alter table if exists goods_received_notes add column if not exists branch_id text references branches(id);
alter table if exists omission_cases add column if not exists branch_id text references branches(id);
alter table if exists credit_notes add column if not exists branch_id text references branches(id);
alter table if exists vendor_ledger_entries add column if not exists branch_id text references branches(id);
alter table if exists sales add column if not exists branch_id text references branches(id);
alter table if exists employees add column if not exists branch_id text references branches(id);
alter table if exists attendance_records add column if not exists branch_id text references branches(id);
alter table if exists payroll_runs add column if not exists branch_id text references branches(id);
alter table if exists recipes add column if not exists branch_id text references branches(id);
alter table if exists production_batches add column if not exists branch_id text references branches(id);
alter table if exists inventory_movements add column if not exists branch_id text references branches(id);

create index if not exists idx_purchase_bills_branch on purchase_bills(branch_id);
create index if not exists idx_sales_branch on sales(branch_id);
create index if not exists idx_employees_branch on employees(branch_id);
create index if not exists idx_payroll_runs_branch on payroll_runs(branch_id);

-- Operating expenses
create table if not exists operating_expenses (
  id uuid primary key default gen_random_uuid(),
  branch_id text not null references branches(id),
  expense_date date not null,
  category expense_category not null,
  vendor_name text,
  description text not null,
  amount numeric not null,
  attachment_url text,
  status expense_status not null default 'draft',
  is_recurring boolean not null default false,
  recurring_day int,
  created_by text not null default 'system',
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_operating_expenses_branch_date on operating_expenses(branch_id, expense_date desc);
create index if not exists idx_operating_expenses_category on operating_expenses(category);

-- Approval workflow
create table if not exists approval_requests (
  id uuid primary key default gen_random_uuid(),
  branch_id text references branches(id),
  type approval_type not null,
  entity_id text not null,
  entity_label text not null,
  amount numeric,
  required_role text not null,
  status approval_status not null default 'pending',
  requested_by text not null,
  reviewed_by text,
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_approval_requests_status on approval_requests(status, created_at desc);
create index if not exists idx_approval_requests_branch on approval_requests(branch_id);

create table if not exists approval_audit_log (
  id uuid primary key default gen_random_uuid(),
  approval_id uuid not null references approval_requests(id) on delete cascade,
  action text not null,
  actor text not null,
  note text,
  created_at timestamptz not null default now()
);

-- Notifications
create table if not exists os_notifications (
  id uuid primary key default gen_random_uuid(),
  branch_id text references branches(id),
  type notification_type not null,
  title text not null,
  detail text not null,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_os_notifications_unread on os_notifications(read, created_at desc);

create table if not exists notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Document vault
create table if not exists vault_documents (
  id text primary key,
  branch_id text references branches(id),
  category document_category not null,
  folder text not null,
  title text not null,
  tags text[] not null default '{}',
  storage_url text,
  mime_type text,
  entity_id text,
  created_by text not null default 'system',
  created_at timestamptz not null default now()
);

create index if not exists idx_vault_documents_folder on vault_documents(folder);
create index if not exists idx_vault_documents_branch on vault_documents(branch_id);

-- Daily MIS snapshots
create table if not exists daily_mis_reports (
  id text primary key,
  branch_id text references branches(id),
  report_date date not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_daily_mis_branch_date on daily_mis_reports(branch_id, report_date desc);

-- Monthly MIS executive summaries
create table if not exists monthly_mis_snapshots (
  id uuid primary key default gen_random_uuid(),
  branch_id text references branches(id),
  month text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (branch_id, month)
);

-- Platform audit log
create table if not exists os_audit_log (
  id uuid primary key default gen_random_uuid(),
  branch_id text references branches(id),
  module text not null,
  action text not null,
  entity_id text,
  actor text not null default 'system',
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_os_audit_log_module on os_audit_log(module, created_at desc);

-- RLS (authenticated users in org — tighten per tenant in production)
alter table branches enable row level security;
alter table operating_expenses enable row level security;
alter table approval_requests enable row level security;
alter table approval_audit_log enable row level security;
alter table os_notifications enable row level security;
alter table vault_documents enable row level security;
alter table daily_mis_reports enable row level security;
alter table monthly_mis_snapshots enable row level security;
alter table os_audit_log enable row level security;

create policy "branches_read" on branches for select to authenticated using (true);
create policy "branches_write" on branches for all to authenticated using (true) with check (true);

create policy "expenses_all" on operating_expenses for all to authenticated using (true) with check (true);
create policy "approvals_all" on approval_requests for all to authenticated using (true) with check (true);
create policy "approval_audit_read" on approval_audit_log for select to authenticated using (true);
create policy "notifications_all" on os_notifications for all to authenticated using (true) with check (true);
create policy "vault_all" on vault_documents for all to authenticated using (true) with check (true);
create policy "daily_mis_all" on daily_mis_reports for all to authenticated using (true) with check (true);
create policy "monthly_mis_all" on monthly_mis_snapshots for all to authenticated using (true) with check (true);
create policy "audit_read" on os_audit_log for select to authenticated using (true);
