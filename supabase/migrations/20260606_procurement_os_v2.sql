-- Table Tales OS · Full Procurement, Inventory, Kitchen & Food Cost Schema
-- Run in Supabase SQL editor when moving off localStorage.

create type purchase_status as enum ('draft', 'verified', 'posted', 'rejected');
create type omission_status as enum ('pending', 'resolved');
create type credit_note_status as enum ('pending', 'applied');
create type ledger_entry_type as enum (
  'purchase', 'payment', 'credit_note', 'debit_note', 'adjustment'
);
create type inventory_category as enum (
  'Dairy', 'Vegetables', 'Dry Store', 'Spices', 'Sauces',
  'Imported Foods', 'Canned Goods', 'Packaging', 'Beverages',
  'Cleaning', 'Consumables', 'Kitchen Prep'
);
create type recipe_status as enum ('active', 'inactive', 'draft');
create type sales_channel as enum ('dine_in', 'takeaway', 'swiggy', 'zomato');
create type prep_batch_status as enum ('planned', 'in_progress', 'completed');
create type procurement_role as enum (
  'owner', 'accountant', 'procurement_manager', 'store_manager', 'kitchen_manager'
);

-- Categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name inventory_category not null unique,
  created_at timestamptz not null default now()
);

-- Vendors
create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gst_number text,
  pan_number text,
  phone text,
  email text,
  contact_person text,
  address text,
  payment_terms_days int not null default 15,
  invoice_pattern text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Inventory items (item master)
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category inventory_category not null default 'Dry Store',
  unit text not null default 'kg',
  current_stock numeric not null default 0,
  par_level numeric not null default 10,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists item_aliases (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references inventory_items(id) on delete cascade,
  alias text not null,
  vendor_id uuid references vendors(id),
  created_at timestamptz not null default now()
);

create table if not exists unit_conversions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references inventory_items(id) on delete cascade,
  from_unit text not null,
  to_unit text not null,
  factor numeric not null
);

-- Purchase bills (immutable originals; revisions linked separately)
create table if not exists purchase_bills (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id),
  vendor_name text not null,
  invoice_number text not null,
  invoice_date date not null,
  status purchase_status not null default 'draft',
  taxable_amount numeric not null default 0,
  gst_amount numeric not null default 0,
  total_value numeric not null default 0,
  extra_charges jsonb not null default '[]',
  image_url text,
  pdf_url text,
  ocr_json jsonb,
  revision_parent_id uuid references purchase_bills(id),
  posted_at timestamptz,
  rejected_at timestamptz,
  created_by text not null default 'system',
  created_at timestamptz not null default now()
);

create table if not exists purchase_items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references purchase_bills(id) on delete cascade,
  item_id uuid references inventory_items(id),
  item_name text not null,
  quantity numeric not null,
  unit text not null default 'kg',
  rate numeric not null,
  gst_percent numeric not null default 0,
  gst_amount numeric not null default 0,
  amount numeric not null,
  received_qty numeric,
  short_qty numeric not null default 0,
  is_new_item boolean not null default false
);

create table if not exists revision_invoices (
  id uuid primary key default gen_random_uuid(),
  parent_bill_id uuid not null references purchase_bills(id),
  revision_bill_id uuid not null references purchase_bills(id),
  reason text not null,
  created_by text not null,
  created_at timestamptz not null default now()
);

-- GRN
create table if not exists grn_receipts (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references purchase_bills(id),
  vendor_id uuid references vendors(id),
  vendor_name text not null,
  invoice_number text not null,
  status text not null default 'pending',
  receipt_status text not null default 'pending',
  lines jsonb not null default '[]',
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Inventory movements
create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references inventory_items(id),
  bill_id uuid references purchase_bills(id),
  type text not null check (type in ('purchase', 'consumption', 'transfer', 'wastage', 'adjustment')),
  quantity numeric not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists opening_stock (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references inventory_items(id),
  date date not null,
  quantity numeric not null,
  source text not null default 'manual'
);

create table if not exists closing_stock (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references inventory_items(id),
  date date not null,
  quantity numeric not null,
  source text not null default 'manual'
);

create table if not exists stock_variance (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references inventory_items(id),
  item_name text not null,
  date date not null,
  expected numeric not null,
  actual numeric not null,
  variance numeric not null,
  value_loss numeric not null default 0,
  unit text not null,
  created_at timestamptz not null default now()
);

-- Omissions & disputes
create table if not exists omission_cases (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique,
  vendor_id uuid references vendors(id),
  vendor_name text not null,
  bill_id uuid not null references purchase_bills(id),
  invoice_number text not null,
  item_id uuid references inventory_items(id),
  item_name text not null,
  expected_qty numeric not null,
  received_qty numeric not null,
  short_qty numeric not null,
  difference numeric not null,
  expected_credit numeric not null default 0,
  status omission_status not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists vendor_disputes (
  id uuid primary key default gen_random_uuid(),
  dispute_number text not null unique,
  vendor_id uuid references vendors(id),
  vendor_name text not null,
  bill_id uuid not null references purchase_bills(id),
  invoice_number text not null,
  item_name text not null,
  bill_qty numeric not null,
  received_qty numeric not null,
  difference_qty numeric not null,
  expected_credit numeric not null,
  received_credit numeric not null default 0,
  pending_credit numeric not null default 0,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

-- Credit notes
create table if not exists credit_notes (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id),
  bill_id uuid references purchase_bills(id),
  credit_note_number text not null,
  credit_note_date date,
  amount numeric not null,
  taxable_amount numeric,
  gst_amount numeric,
  items jsonb not null default '[]',
  status credit_note_status not null default 'pending',
  image_url text,
  pdf_url text,
  ocr_json jsonb,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);

create table if not exists credit_note_items (
  id uuid primary key default gen_random_uuid(),
  credit_note_id uuid not null references credit_notes(id) on delete cascade,
  item_name text not null,
  quantity numeric not null,
  rate numeric not null,
  gst_percent numeric not null default 0,
  amount numeric not null
);

-- Vendor ledger & payments
create table if not exists vendor_ledger (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id),
  type ledger_entry_type not null,
  reference_id uuid,
  description text not null,
  debit numeric not null default 0,
  credit numeric not null default 0,
  balance numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists vendor_payments (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id),
  amount numeric not null,
  payment_date date not null,
  reference text not null,
  note text,
  created_by text not null,
  created_at timestamptz not null default now()
);

-- Kitchen: recipes & prep
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  selling_price numeric not null,
  yield numeric not null default 1,
  yield_unit text not null default 'portion',
  status recipe_status not null default 'active',
  outlet text not null default 'Table Tales',
  created_at timestamptz not null default now()
);

create table if not exists recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  item_id uuid not null references inventory_items(id),
  item_name text not null,
  quantity numeric not null,
  unit text not null
);

create table if not exists prep_recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  output_item_id uuid references inventory_items(id),
  output_item_name text not null,
  output_yield numeric not null,
  output_unit text not null,
  status recipe_status not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists prep_ingredients (
  id uuid primary key default gen_random_uuid(),
  prep_recipe_id uuid not null references prep_recipes(id) on delete cascade,
  item_id uuid not null references inventory_items(id),
  item_name text not null,
  quantity numeric not null,
  unit text not null
);

create table if not exists production_batches (
  id uuid primary key default gen_random_uuid(),
  prep_recipe_id uuid not null references prep_recipes(id),
  input_cost numeric not null,
  output_qty numeric not null,
  production_cost numeric not null,
  status prep_batch_status not null default 'completed',
  created_by text not null,
  created_at timestamptz not null default now()
);

-- Sales
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  channel sales_channel not null,
  recipe_id uuid not null references recipes(id),
  recipe_name text not null,
  quantity numeric not null,
  unit_price numeric not null,
  total_revenue numeric not null,
  outlet text not null default 'Table Tales',
  consumed_at timestamptz not null default now()
);

-- Reports
create table if not exists food_cost_reports (
  id uuid primary key default gen_random_uuid(),
  outlet text not null,
  period_start date not null,
  period_end date not null,
  avg_food_cost_percent numeric not null,
  avg_margin_percent numeric not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Audit (append-only)
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  action_type text not null,
  detail text,
  user_id text not null,
  user_name text,
  old_value jsonb,
  new_value jsonb,
  reason text,
  field text,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_vendors_name on vendors(name);
create index if not exists idx_purchase_bills_vendor on purchase_bills(vendor_id);
create index if not exists idx_purchase_bills_status on purchase_bills(status);
create index if not exists idx_purchase_items_bill on purchase_items(bill_id);
create index if not exists idx_inventory_movements_item on inventory_movements(item_id);
create index if not exists idx_omission_cases_status on omission_cases(status);
create index if not exists idx_vendor_disputes_vendor on vendor_disputes(vendor_id);
create index if not exists idx_vendor_ledger_vendor on vendor_ledger(vendor_id);
create index if not exists idx_sales_consumed_at on sales(consumed_at);
create index if not exists idx_audit_logs_entity on audit_logs(entity_type, entity_id);
