-- AviaInventory Supplier Operations Workspace
-- Adds secure operational records for shipments and invoices so the supplier
-- workspace can surface the full Profile -> Verification -> Inventory -> RFQ ->
-- Quote -> PO -> Shipment -> Payment workflow without fabricated dashboard data.

create table if not exists public.supplier_shipments (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  shipment_number text not null,
  carrier text,
  tracking_number text,
  destination text,
  status text not null default 'Pending',
  ship_date date,
  estimated_delivery date,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_shipments_status_check check (status in ('Pending','Packed','Dispatched','In Transit','Delivered','Cancelled'))
);

create unique index if not exists supplier_shipments_number_idx on public.supplier_shipments(supplier_id, shipment_number);
create index if not exists supplier_shipments_supplier_idx on public.supplier_shipments(supplier_id, created_at desc);
create index if not exists supplier_shipments_order_idx on public.supplier_shipments(order_id);

create table if not exists public.supplier_invoices (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  invoice_number text not null,
  currency text not null default 'USD',
  subtotal numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  status text not null default 'Pending',
  issued_at date,
  due_date date,
  paid_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplier_invoices_status_check check (status in ('Draft','Pending','Partially Paid','Paid','Overdue','Cancelled'))
);

create unique index if not exists supplier_invoices_number_idx on public.supplier_invoices(supplier_id, invoice_number);
create index if not exists supplier_invoices_supplier_idx on public.supplier_invoices(supplier_id, created_at desc);
create index if not exists supplier_invoices_order_idx on public.supplier_invoices(order_id);

alter table public.supplier_shipments enable row level security;
alter table public.supplier_invoices enable row level security;

drop policy if exists "Suppliers manage own shipments" on public.supplier_shipments;
create policy "Suppliers manage own shipments" on public.supplier_shipments
  for all to authenticated
  using (supplier_id = auth.uid())
  with check (supplier_id = auth.uid());

drop policy if exists "Suppliers manage own invoices" on public.supplier_invoices;
create policy "Suppliers manage own invoices" on public.supplier_invoices
  for all to authenticated
  using (supplier_id = auth.uid())
  with check (supplier_id = auth.uid());

create or replace function public.set_supplier_operations_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists supplier_shipments_updated_at on public.supplier_shipments;
create trigger supplier_shipments_updated_at before update on public.supplier_shipments
for each row execute function public.set_supplier_operations_updated_at();

drop trigger if exists supplier_invoices_updated_at on public.supplier_invoices;
create trigger supplier_invoices_updated_at before update on public.supplier_invoices
for each row execute function public.set_supplier_operations_updated_at();
