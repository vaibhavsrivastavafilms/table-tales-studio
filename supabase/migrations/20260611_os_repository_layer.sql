-- Table Tales OS · Repository layer (legacy IDs, RLS, org roles, extensions)

-- Stable app IDs for entities that use uuid primary keys in earlier migrations
alter table if exists vendors add column if not exists legacy_id text unique;
alter table if exists inventory_items add column if not exists legacy_id text unique;
alter table if exists purchase_bills add column if not exists legacy_id text unique;
alter table if exists recipes add column if not exists legacy_id text unique;
alter table if exists employees add column if not exists legacy_id text unique;
alter table if exists sales add column if not exists legacy_id text unique;
alter table if exists payroll_runs add column if not exists legacy_id text unique;
alter table if exists credit_notes add column if not exists legacy_id text unique;
alter table if exists omission_cases add column if not exists legacy_id text unique;
alter table if exists vendor_disputes add column if not exists legacy_id text unique;
alter table if exists grn_receipts add column if not exists legacy_id text unique;

create unique index if not exists idx_vendors_legacy on vendors(legacy_id) where legacy_id is not null;
create unique index if not exists idx_inventory_legacy on inventory_items(legacy_id) where legacy_id is not null;
create unique index if not exists idx_purchase_bills_legacy on purchase_bills(legacy_id) where legacy_id is not null;

-- Extensions blob for collections not yet normalized (shared org state)
create table if not exists os_workspace_extensions (
  workspace_id text primary key default 'default',
  payload jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Multi-user roles (shared org data)
create table if not exists org_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role procurement_role not null default 'owner',
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_org_members_role on org_members(role);

-- Migration audit trail
create table if not exists os_migration_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  status text not null default 'running',
  steps jsonb not null default '[]',
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

-- RLS on procurement core (shared authenticated org access)
alter table if exists vendors enable row level security;
alter table if exists inventory_items enable row level security;
alter table if exists purchase_bills enable row level security;
alter table if exists purchase_items enable row level security;
alter table if exists inventory_movements enable row level security;
alter table if exists opening_stock enable row level security;
alter table if exists closing_stock enable row level security;
alter table if exists omission_cases enable row level security;
alter table if exists vendor_disputes enable row level security;
alter table if exists credit_notes enable row level security;
alter table if exists vendor_ledger enable row level security;
alter table if exists vendor_payments enable row level security;
alter table if exists recipes enable row level security;
alter table if exists recipe_ingredients enable row level security;
alter table if exists sales enable row level security;
alter table if exists employees enable row level security;
alter table if exists attendance_records enable row level security;
alter table if exists payroll_runs enable row level security;
alter table if exists payroll_lines enable row level security;
alter table if exists grn_receipts enable row level security;
alter table if exists daily_mis_reports enable row level security;
alter table if exists categories enable row level security;
alter table if exists os_workspace_extensions enable row level security;
alter table if exists org_members enable row level security;
alter table if exists os_migration_runs enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'vendors','inventory_items','purchase_bills','purchase_items','inventory_movements',
    'opening_stock','closing_stock','omission_cases','vendor_disputes','credit_notes',
    'vendor_ledger','vendor_payments','recipes','recipe_ingredients','sales',
    'employees','attendance_records','payroll_runs','payroll_lines','grn_receipts',
    'daily_mis_reports','categories','os_workspace_extensions','org_members','os_migration_runs'
  ]
  loop
    execute format('drop policy if exists os_auth_all on %I', t);
    execute format(
      'create policy os_auth_all on %I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- Branches already have RLS from platform v3 migration
drop policy if exists os_branches_auth on branches;
create policy os_branches_auth on branches for all to authenticated using (true) with check (true);

-- Operating expenses (platform v3 table)
drop policy if exists os_expenses_auth on operating_expenses;
create policy os_expenses_auth on operating_expenses for all to authenticated using (true) with check (true);
