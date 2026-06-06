-- Table Tales OS · Phases 1–8 foundation (expenses, P&L, approvals, daily MIS, notifications, documents)
-- Amounts stored as integer paise (100 paise = ₹1)

-- Expenses (canonical table per product spec)
create table if not exists expenses (
  id text primary key,
  branch_id text not null references branches(id),
  date date not null,
  category text not null check (category in (
    'Rent','Electricity','Gas','Water','Internet','Marketing','Maintenance',
    'Repairs','Licenses','Software','PettyCash','Housekeeping','Uniforms',
    'Transport','Miscellaneous'
  )),
  vendor_name text,
  description text not null,
  amount integer not null,
  attachment_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_by text,
  approved_at timestamptz,
  is_recurring boolean not null default false,
  recurrence text check (recurrence in ('monthly','weekly') or recurrence is null),
  created_by text not null,
  created_at timestamptz not null default now(),
  audit_log jsonb not null default '[]'::jsonb
);

create index if not exists idx_expenses_branch_date on expenses(branch_id, date desc);
create index if not exists idx_expenses_status on expenses(status);

-- P&L snapshots
create table if not exists pnl_snapshots (
  id text primary key,
  branch_id text not null references branches(id),
  period_type text not null check (period_type in ('daily','weekly','monthly')),
  period_start date not null,
  period_end date not null,
  revenue integer not null default 0,
  food_cost integer not null default 0,
  labor_cost integer not null default 0,
  expenses integer not null default 0,
  gross_profit integer not null default 0,
  net_profit integer not null default 0,
  food_cost_pct decimal(5,2) not null default 0,
  labor_cost_pct decimal(5,2) not null default 0,
  expense_pct decimal(5,2) not null default 0,
  net_margin decimal(5,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_pnl_branch_period on pnl_snapshots(branch_id, period_type, period_start desc);

-- Approval requests (unified queue)
create table if not exists approval_requests_v2 (
  id text primary key,
  branch_id text not null references branches(id),
  type text not null check (type in ('purchase','expense','credit_note','inventory_adj','payroll')),
  reference_id text not null,
  reference_table text not null,
  amount integer not null default 0,
  requested_by text not null,
  required_role text not null check (required_role in ('manager','owner','accountant')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','changes_requested')),
  reviewed_by text,
  reviewed_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  audit_log jsonb not null default '[]'::jsonb
);

create index if not exists idx_approval_v2_status on approval_requests_v2(status, created_at desc);

-- Daily MIS reports (expanded)
create table if not exists daily_mis_reports_v2 (
  id text primary key,
  branch_id text references branches(id),
  date date not null,
  sales_total integer not null default 0,
  orders_count integer not null default 0,
  purchases_total integer not null default 0,
  attendance_present integer not null default 0,
  attendance_absent integer not null default 0,
  attendance_late integer not null default 0,
  low_stock_count integer not null default 0,
  pending_vendor_pmt_count integer not null default 0,
  pending_credit_note_count integer not null default 0,
  food_cost_pct decimal(5,2) not null default 0,
  labor_cost_est integer not null default 0,
  expenses_total integer not null default 0,
  est_profit integer not null default 0,
  generated_at timestamptz not null default now(),
  export_pdf_url text,
  export_excel_url text,
  whatsapp_summary text
);

-- Notification preferences
create table if not exists notification_preferences (
  user_id text primary key,
  low_stock boolean not null default true,
  food_cost_alert boolean not null default true,
  pending_approval boolean not null default true,
  vendor_payment boolean not null default true,
  attendance boolean not null default true,
  payroll_due boolean not null default true,
  daily_mis boolean not null default true,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Document vault
create table if not exists documents (
  id text primary key,
  branch_id text references branches(id),
  category text not null check (category in (
    'Invoice','CreditNote','VendorDoc','PayrollReport','AttendanceReport',
    'MISReport','ExpenseAttachment','Contract','BranchDoc'
  )),
  reference_id text,
  filename text not null,
  storage_url text not null,
  file_size integer,
  mime_type text,
  tags text[] not null default '{}',
  uploaded_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_branch on documents(branch_id);
create index if not exists idx_documents_tags on documents using gin(tags);

-- RLS
alter table expenses enable row level security;
alter table pnl_snapshots enable row level security;
alter table approval_requests_v2 enable row level security;
alter table daily_mis_reports_v2 enable row level security;
alter table notification_preferences enable row level security;
alter table documents enable row level security;

create policy "expenses_all" on expenses for all to authenticated using (true) with check (true);
create policy "pnl_read" on pnl_snapshots for select to authenticated using (true);
create policy "pnl_insert" on pnl_snapshots for insert to authenticated with check (true);
create policy "approvals_v2_all" on approval_requests_v2 for all to authenticated using (true) with check (true);
create policy "daily_mis_v2_all" on daily_mis_reports_v2 for all to authenticated using (true) with check (true);
create policy "notif_prefs_all" on notification_preferences for all to authenticated using (true) with check (true);
create policy "documents_all" on documents for all to authenticated using (true) with check (true);
