-- Table Tales OS · Flip Office POS Integration
-- Run after 20260606_hr_flip_office.sql

create table if not exists flip_sales (
  id uuid primary key default gen_random_uuid(),
  flip_office_id text not null unique,
  branch_id text not null,
  sale_date date not null,
  sale_time time,
  outlet text not null,
  order_number text not null,
  channel text not null,
  customer_id text,
  customer_name text,
  subtotal_paise bigint not null default 0,
  tax_paise bigint not null default 0,
  discount_paise bigint not null default 0,
  total_paise bigint not null default 0,
  payment_method text,
  status text not null check (status in ('imported', 'partial', 'pending', 'failed')),
  error_message text,
  imported_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists flip_sale_items (
  id uuid primary key default gen_random_uuid(),
  flip_sale_id uuid not null references flip_sales(id) on delete cascade,
  flip_menu_item_id text,
  menu_item_name text not null,
  recipe_id text,
  quantity numeric not null default 1,
  unit_price_paise bigint not null default 0,
  total_paise bigint not null default 0,
  mapping_status text not null check (mapping_status in ('mapped', 'unmapped', 'manual')),
  sale_id text,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists flip_customers (
  id uuid primary key default gen_random_uuid(),
  flip_office_id text not null unique,
  name text not null,
  phone text,
  email text,
  outlet text,
  branch_id text,
  total_orders int not null default 0,
  total_spend_paise bigint not null default 0,
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists flip_sync_logs (
  id uuid primary key default gen_random_uuid(),
  sync_type text not null check (
    sync_type in ('sales', 'menu', 'customers', 'payments', 'attendance', 'employees')
  ),
  records_imported int not null default 0,
  records_skipped int not null default 0,
  error_count int not null default 0,
  sync_date date not null,
  status text not null check (status in ('success', 'partial', 'failed')),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_flip_sales_date on flip_sales(sale_date);
create index if not exists idx_flip_sales_branch on flip_sales(branch_id);
create index if not exists idx_flip_sale_items_sale on flip_sale_items(flip_sale_id);
create index if not exists idx_flip_customers_outlet on flip_customers(outlet);
create index if not exists idx_flip_sync_logs_type on flip_sync_logs(sync_type);
