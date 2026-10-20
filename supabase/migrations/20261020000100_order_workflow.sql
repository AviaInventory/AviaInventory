-- AviaInventory: purchase order -> invoice -> payment -> dispatch -> received workflow.
--
-- Order steps (orders.status):
--   Awaiting PO   quote accepted; the buyer creates the purchase order
--   PO Issued     buyer sent the PO (quantity, ship-to, shipping method / account)
--   Invoiced      supplier issued the invoice from the PO (with payment details)
--   Payment Sent  buyer marked the invoice as paid (payments happen off-platform)
--   Paid          supplier confirmed the payment was received
--   Dispatched    supplier dispatched the order (carrier, tracking)
--   Closed        buyer confirmed the order was received
--   Cancelled     cancelled before payment
--
-- Every step is a security-definer function that checks who is acting and the current
-- step; direct client updates to orders are refused.

-- ---------------------------------------------------------------------------
-- Orders: PO, dispatch and closing fields
-- ---------------------------------------------------------------------------

alter table public.orders
  add column if not exists po_number text unique,
  add column if not exists po_issued_at timestamptz,
  add column if not exists buyer_company_name text,
  add column if not exists supplier_company_name text,
  add column if not exists ship_to_name text,
  add column if not exists ship_to_company text,
  add column if not exists ship_to_address text,
  add column if not exists ship_to_city text,
  add column if not exists ship_to_country text,
  add column if not exists ship_to_phone text,
  add column if not exists shipping_method text,
  add column if not exists shipping_account_number text,
  add column if not exists dispatch_carrier text,
  add column if not exists tracking_number text,
  add column if not exists dispatch_note text,
  add column if not exists dispatched_at timestamptz,
  add column if not exists received_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid,
  add column if not exists cancel_reason text;

-- Existing orders predate the PO step.
update public.orders set status = case
  when status in ('Shipped') then 'Dispatched'
  when status in ('Delivered', 'Completed') then 'Closed'
  when status = 'Cancelled' then 'Cancelled'
  else 'Awaiting PO'
end
where status not in ('Awaiting PO', 'PO Issued', 'Invoiced', 'Payment Sent', 'Paid', 'Dispatched', 'Closed', 'Cancelled');

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('Awaiting PO', 'PO Issued', 'Invoiced', 'Payment Sent', 'Paid', 'Dispatched', 'Closed', 'Cancelled'));

alter table public.orders drop constraint if exists orders_shipping_method_check;
alter table public.orders add constraint orders_shipping_method_check
  check (shipping_method is null or shipping_method in ('DHL', 'FedEx', 'UPS', 'Aramex', 'Own pick-up', 'Supplier arranges freight', 'Other'));

-- accept_quote() creates orders; they always start at the PO step.
create or replace function public.orders_start_awaiting_po()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.status := 'Awaiting PO';
  new.supplier_company_name := coalesce(new.supplier_company_name, (select s.company_name from public.suppliers s where s.id = new.supplier_id));
  new.buyer_company_name := coalesce(new.buyer_company_name, (select p.company_name from public.profiles p where p.id = new.buyer_id));
  return new;
end;
$$;

drop trigger if exists orders_start_awaiting_po on public.orders;
create trigger orders_start_awaiting_po
before insert on public.orders
for each row execute function public.orders_start_awaiting_po();

update public.orders o set
  supplier_company_name = coalesce(o.supplier_company_name, (select s.company_name from public.suppliers s where s.id = o.supplier_id)),
  buyer_company_name = coalesce(o.buyer_company_name, (select p.company_name from public.profiles p where p.id = o.buyer_id));

-- Orders change only through the step functions below.
drop policy if exists "Suppliers can update their orders" on public.orders;

create or replace function public.guard_order_updates()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_direct_client_write() then
    raise exception 'Orders are updated through the order steps.' using errcode = 'P0001';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Invoices
-- ---------------------------------------------------------------------------

alter table public.supplier_invoices
  add column if not exists buyer_id uuid references auth.users(id),
  add column if not exists description text,
  add column if not exists quantity integer,
  add column if not exists unit_price numeric,
  add column if not exists tax_rate numeric not null default 0,
  add column if not exists payment_terms text,
  add column if not exists bank_name text,
  add column if not exists bank_account_name text,
  add column if not exists bank_account_number text,
  add column if not exists bank_branch text,
  add column if not exists bank_swift text,
  add column if not exists payment_instructions text,
  add column if not exists buyer_marked_paid_at timestamptz,
  add column if not exists buyer_payment_reference text,
  add column if not exists supplier_confirmed_paid_at timestamptz;

create unique index if not exists supplier_invoices_invoice_number_key on public.supplier_invoices (invoice_number);
-- One live invoice per order.
create unique index if not exists supplier_invoices_one_per_order on public.supplier_invoices (order_id) where status <> 'Cancelled';

-- Invoices are written by the step functions; both parties can read them.
drop policy if exists "Suppliers manage own invoices" on public.supplier_invoices;
drop policy if exists "Suppliers and buyers can view their invoices" on public.supplier_invoices;
create policy "Suppliers and buyers can view their invoices"
on public.supplier_invoices for select to authenticated
using (supplier_id = auth.uid() or buyer_id = auth.uid() or public.is_platform_admin());

-- Payment details a supplier can reuse on their next invoice.
create table if not exists public.supplier_payment_details (
  supplier_id uuid primary key references auth.users(id) on delete cascade,
  bank_name text,
  bank_account_name text,
  bank_account_number text,
  bank_branch text,
  bank_swift text,
  payment_instructions text,
  payment_terms text,
  updated_at timestamptz not null default now()
);
alter table public.supplier_payment_details enable row level security;
drop policy if exists "Suppliers manage their payment details" on public.supplier_payment_details;
create policy "Suppliers manage their payment details"
on public.supplier_payment_details for all to authenticated
using (supplier_id = auth.uid())
with check (supplier_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Document numbers: PO-2026-00001, INV-2026-00001
-- ---------------------------------------------------------------------------

create sequence if not exists public.purchase_order_number_seq;
create sequence if not exists public.invoice_number_seq;

create or replace function public.next_document_number(p_kind text)
returns text
language sql
security definer
set search_path = public
as $$
  select case p_kind
    when 'po' then 'PO-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.purchase_order_number_seq')::text, 5, '0')
    else 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 5, '0')
  end;
$$;

-- ---------------------------------------------------------------------------
-- Step functions
-- ---------------------------------------------------------------------------

create or replace function public.order_for_step(p_order_id uuid, p_role text)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.' using errcode = 'P0001';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found
     or (p_role = 'buyer' and v_order.buyer_id <> auth.uid())
     or (p_role = 'supplier' and v_order.supplier_id <> auth.uid())
     or (p_role = 'either' and auth.uid() not in (v_order.buyer_id, v_order.supplier_id)) then
    raise exception 'Order not found.' using errcode = 'P0001';
  end if;
  return v_order;
end;
$$;

create or replace function public.issue_purchase_order(
  p_order_id uuid,
  p_quantity integer,
  p_ship_to_name text,
  p_ship_to_company text,
  p_ship_to_address text,
  p_ship_to_city text,
  p_ship_to_country text,
  p_ship_to_phone text,
  p_shipping_method text,
  p_shipping_account_number text,
  p_required_date date,
  p_notes text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders := public.order_for_step(p_order_id, 'buyer');
  v_account text := nullif(trim(coalesce(p_shipping_account_number, '')), '');
  v_po text;
begin
  if v_order.status not in ('Awaiting PO', 'PO Issued') then
    raise exception 'The purchase order can no longer be changed: the supplier has already invoiced this order.' using errcode = 'P0001';
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 1000000 then
    raise exception 'Enter a quantity of at least 1.' using errcode = 'P0001';
  end if;
  if nullif(trim(coalesce(p_ship_to_name, '')), '') is null
     or nullif(trim(coalesce(p_ship_to_address, '')), '') is null
     or nullif(trim(coalesce(p_ship_to_city, '')), '') is null
     or nullif(trim(coalesce(p_ship_to_country, '')), '') is null then
    raise exception 'Enter the delivery contact name, address, city and country.' using errcode = 'P0001';
  end if;
  if p_shipping_method is null or p_shipping_method not in ('DHL', 'FedEx', 'UPS', 'Aramex', 'Own pick-up', 'Supplier arranges freight', 'Other') then
    raise exception 'Choose a shipping method.' using errcode = 'P0001';
  end if;
  if p_shipping_method in ('DHL', 'FedEx') and v_account is null then
    raise exception 'Enter your % shipping account number.', p_shipping_method using errcode = 'P0001';
  end if;
  if p_required_date is not null and p_required_date < current_date then
    raise exception 'The required-by date cannot be in the past.' using errcode = 'P0001';
  end if;

  update public.orders set
    quantity = p_quantity,
    total_amount = round(p_quantity * unit_price, 2),
    ship_to_name = left(trim(p_ship_to_name), 200),
    ship_to_company = left(nullif(trim(coalesce(p_ship_to_company, '')), ''), 200),
    ship_to_address = left(trim(p_ship_to_address), 500),
    ship_to_city = left(trim(p_ship_to_city), 120),
    ship_to_country = left(trim(p_ship_to_country), 120),
    ship_to_phone = left(nullif(trim(coalesce(p_ship_to_phone, '')), ''), 40),
    shipping_method = p_shipping_method,
    shipping_account_number = left(v_account, 60),
    required_date = p_required_date,
    buyer_message = left(nullif(trim(coalesce(p_notes, '')), ''), 2000),
    buyer_company_name = coalesce((select p.company_name from public.profiles p where p.id = v_order.buyer_id), buyer_company_name),
    po_number = coalesce(po_number, public.next_document_number('po')),
    po_issued_at = now(),
    status = 'PO Issued'
  where id = v_order.id
  returning po_number into v_po;

  return v_po;
end;
$$;

create or replace function public.issue_invoice(
  p_order_id uuid,
  p_tax_rate numeric,
  p_due_date date,
  p_payment_terms text,
  p_bank_name text,
  p_bank_account_name text,
  p_bank_account_number text,
  p_bank_branch text,
  p_bank_swift text,
  p_payment_instructions text,
  p_notes text,
  p_save_defaults boolean
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders := public.order_for_step(p_order_id, 'supplier');
  v_tax numeric := round(coalesce(p_tax_rate, 0), 2);
  v_tax_amount numeric;
  v_number text;
  v_part text;
begin
  if v_order.status <> 'PO Issued' then
    raise exception 'An invoice can only be created once the buyer has issued the purchase order.' using errcode = 'P0001';
  end if;
  if v_tax < 0 or v_tax > 100 then
    raise exception 'Enter a tax rate between 0 and 100%%.' using errcode = 'P0001';
  end if;
  if p_due_date is null or p_due_date < current_date then
    raise exception 'Choose a payment due date from today onwards.' using errcode = 'P0001';
  end if;
  if nullif(trim(coalesce(p_bank_account_number, '')), '') is null and nullif(trim(coalesce(p_payment_instructions, '')), '') is null then
    raise exception 'Add your bank account details or payment instructions so the buyer can pay.' using errcode = 'P0001';
  end if;

  v_tax_amount := round(v_order.total_amount * v_tax / 100, 2);
  v_number := public.next_document_number('invoice');
  v_part := coalesce((select pt.part_number from public.parts pt where pt.id = v_order.part_id), public.rfq_part_label(v_order.rfq_id));

  insert into public.supplier_invoices (
    supplier_id, buyer_id, order_id, invoice_number, currency, description, quantity, unit_price,
    subtotal, tax_rate, tax_amount, total_amount, status, issued_at, due_date, payment_terms,
    bank_name, bank_account_name, bank_account_number, bank_branch, bank_swift, payment_instructions, notes
  ) values (
    v_order.supplier_id, v_order.buyer_id, v_order.id, v_number, v_order.currency, v_part, v_order.quantity, v_order.unit_price,
    v_order.total_amount, v_tax, v_tax_amount, v_order.total_amount + v_tax_amount, 'Pending', current_date, p_due_date,
    left(nullif(trim(coalesce(p_payment_terms, '')), ''), 200),
    left(nullif(trim(coalesce(p_bank_name, '')), ''), 120),
    left(nullif(trim(coalesce(p_bank_account_name, '')), ''), 160),
    left(nullif(trim(coalesce(p_bank_account_number, '')), ''), 60),
    left(nullif(trim(coalesce(p_bank_branch, '')), ''), 120),
    left(nullif(trim(coalesce(p_bank_swift, '')), ''), 20),
    left(nullif(trim(coalesce(p_payment_instructions, '')), ''), 1000),
    left(nullif(trim(coalesce(p_notes, '')), ''), 2000)
  );

  if coalesce(p_save_defaults, false) then
    insert into public.supplier_payment_details as d (
      supplier_id, bank_name, bank_account_name, bank_account_number, bank_branch, bank_swift, payment_instructions, payment_terms, updated_at
    ) values (
      v_order.supplier_id, nullif(trim(coalesce(p_bank_name, '')), ''), nullif(trim(coalesce(p_bank_account_name, '')), ''),
      nullif(trim(coalesce(p_bank_account_number, '')), ''), nullif(trim(coalesce(p_bank_branch, '')), ''),
      nullif(trim(coalesce(p_bank_swift, '')), ''), nullif(trim(coalesce(p_payment_instructions, '')), ''),
      nullif(trim(coalesce(p_payment_terms, '')), ''), now()
    )
    on conflict (supplier_id) do update set
      bank_name = excluded.bank_name, bank_account_name = excluded.bank_account_name,
      bank_account_number = excluded.bank_account_number, bank_branch = excluded.bank_branch,
      bank_swift = excluded.bank_swift, payment_instructions = excluded.payment_instructions,
      payment_terms = excluded.payment_terms, updated_at = now();
  end if;

  update public.orders set
    status = 'Invoiced',
    supplier_company_name = coalesce((select s.company_name from public.suppliers s where s.id = v_order.supplier_id), supplier_company_name)
  where id = v_order.id;

  return v_number;
end;
$$;

create or replace function public.mark_invoice_paid(p_order_id uuid, p_reference text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders := public.order_for_step(p_order_id, 'buyer');
begin
  if v_order.status <> 'Invoiced' then
    raise exception 'This order is not waiting for payment.' using errcode = 'P0001';
  end if;
  update public.supplier_invoices set
    buyer_marked_paid_at = now(),
    buyer_payment_reference = left(nullif(trim(coalesce(p_reference, '')), ''), 120),
    updated_at = now()
  where order_id = v_order.id and status <> 'Cancelled';
  update public.orders set status = 'Payment Sent' where id = v_order.id;
end;
$$;

create or replace function public.confirm_payment_received(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders := public.order_for_step(p_order_id, 'supplier');
begin
  if v_order.status not in ('Invoiced', 'Payment Sent') then
    raise exception 'This order has no unpaid invoice.' using errcode = 'P0001';
  end if;
  update public.supplier_invoices set
    status = 'Paid', paid_at = current_date, supplier_confirmed_paid_at = now(), updated_at = now()
  where order_id = v_order.id and status <> 'Cancelled';
  update public.orders set status = 'Paid' where id = v_order.id;
end;
$$;

create or replace function public.mark_order_dispatched(p_order_id uuid, p_carrier text, p_tracking_number text, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders := public.order_for_step(p_order_id, 'supplier');
begin
  if v_order.status <> 'Paid' then
    raise exception 'Dispatch the order once the payment is confirmed.' using errcode = 'P0001';
  end if;
  update public.orders set
    status = 'Dispatched',
    dispatch_carrier = left(coalesce(nullif(trim(coalesce(p_carrier, '')), ''), shipping_method), 120),
    tracking_number = left(nullif(trim(coalesce(p_tracking_number, '')), ''), 120),
    dispatch_note = left(nullif(trim(coalesce(p_note, '')), ''), 1000),
    dispatched_at = now()
  where id = v_order.id;
end;
$$;

create or replace function public.confirm_order_received(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders := public.order_for_step(p_order_id, 'buyer');
begin
  if v_order.status <> 'Dispatched' then
    raise exception 'The order has not been dispatched yet.' using errcode = 'P0001';
  end if;
  update public.orders set status = 'Closed', received_at = now(), closed_at = now() where id = v_order.id;
end;
$$;

create or replace function public.cancel_order(p_order_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders := public.order_for_step(p_order_id, 'either');
begin
  if v_order.status not in ('Awaiting PO', 'PO Issued', 'Invoiced') then
    raise exception 'Orders can only be cancelled before payment is made.' using errcode = 'P0001';
  end if;
  if nullif(trim(coalesce(p_reason, '')), '') is null then
    raise exception 'Give a reason for cancelling.' using errcode = 'P0001';
  end if;
  update public.supplier_invoices set status = 'Cancelled', updated_at = now()
  where order_id = v_order.id and status <> 'Cancelled';
  update public.orders set
    status = 'Cancelled', cancelled_at = now(), cancelled_by = auth.uid(), cancel_reason = left(trim(p_reason), 500)
  where id = v_order.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Notifications for each step (replaces the generic status messages)
-- ---------------------------------------------------------------------------

create or replace function public.notify_order_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text := coalesce(new.po_number, 'Order ' || upper(left(new.id::text, 8)));
  v_part text := coalesce((select pt.part_number from public.parts pt where pt.id = new.part_id), public.rfq_part_label(new.rfq_id));
  v_buyer_link text := '/buyer/orders/' || new.id;
  v_supplier_link text := '/supplier/purchase-orders/' || new.id;
  v_invoice public.supplier_invoices;
begin
  if tg_op = 'INSERT' then
    perform public.notify_user(new.buyer_id, 'order', 'orders', 'Quotation accepted: create your purchase order',
      format('Create the purchase order for %s × %s so the supplier can invoice you.', new.quantity, v_part), v_buyer_link);
    perform public.notify_user(new.supplier_id, 'order', 'orders', 'Your quotation was accepted',
      format('The buyer accepted your quotation for %s × %s. You will be notified when their purchase order arrives.', new.quantity, v_part), v_supplier_link);
    return new;
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  select * into v_invoice from public.supplier_invoices where order_id = new.id and status <> 'Cancelled' order by created_at desc limit 1;

  case new.status
    when 'PO Issued' then
      perform public.notify_user(new.supplier_id, 'order', 'orders', 'Purchase order received',
        format('%s for %s × %s. Create the invoice to proceed.', v_ref, new.quantity, v_part), v_supplier_link);
    when 'Invoiced' then
      perform public.notify_user(new.buyer_id, 'order', 'orders', 'Invoice received',
        format('Invoice %s for %s %s. Pay the supplier, then mark the invoice as paid.', coalesce(v_invoice.invoice_number, ''), new.currency, to_char(coalesce(v_invoice.total_amount, new.total_amount), 'FM999,999,999,990.00')), v_buyer_link);
    when 'Payment Sent' then
      perform public.notify_user(new.supplier_id, 'order', 'orders', 'Buyer marked the invoice as paid',
        format('Confirm the payment for invoice %s once you receive it.', coalesce(v_invoice.invoice_number, v_ref)), v_supplier_link);
    when 'Paid' then
      perform public.notify_user(new.buyer_id, 'order', 'orders', 'Payment confirmed',
        format('The supplier confirmed your payment for %s. The order will be dispatched next.', v_ref), v_buyer_link);
    when 'Dispatched' then
      perform public.notify_user(new.buyer_id, 'order', 'orders', 'Order dispatched',
        format('%s was dispatched%s%s. Confirm when you receive it.', v_ref,
          coalesce(' via ' || new.dispatch_carrier, ''), coalesce(', tracking ' || new.tracking_number, '')), v_buyer_link);
    when 'Closed' then
      perform public.notify_user(new.supplier_id, 'order', 'orders', 'Order received and closed',
        format('The buyer confirmed receiving %s. The order is closed.', v_ref), v_supplier_link);
    when 'Cancelled' then
      if new.cancelled_by is distinct from new.buyer_id then
        perform public.notify_user(new.buyer_id, 'order', 'orders', 'Order cancelled',
          format('%s was cancelled by the supplier: %s', v_ref, coalesce(new.cancel_reason, '')), v_buyer_link);
      end if;
      if new.cancelled_by is distinct from new.supplier_id then
        perform public.notify_user(new.supplier_id, 'order', 'orders', 'Order cancelled',
          format('%s was cancelled by the buyer: %s', v_ref, coalesce(new.cancel_reason, '')), v_supplier_link);
      end if;
    else
      null;
  end case;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------

revoke execute on function public.orders_start_awaiting_po() from public, anon, authenticated;
revoke execute on function public.next_document_number(text) from public, anon, authenticated;
revoke execute on function public.order_for_step(uuid, text) from public, anon, authenticated;
revoke execute on function public.notify_order_events() from public, anon, authenticated;

revoke execute on function public.issue_purchase_order(uuid, integer, text, text, text, text, text, text, text, text, date, text) from public, anon;
revoke execute on function public.issue_invoice(uuid, numeric, date, text, text, text, text, text, text, text, text, boolean) from public, anon;
revoke execute on function public.mark_invoice_paid(uuid, text) from public, anon;
revoke execute on function public.confirm_payment_received(uuid) from public, anon;
revoke execute on function public.mark_order_dispatched(uuid, text, text, text) from public, anon;
revoke execute on function public.confirm_order_received(uuid) from public, anon;
revoke execute on function public.cancel_order(uuid, text) from public, anon;

grant execute on function public.issue_purchase_order(uuid, integer, text, text, text, text, text, text, text, text, date, text) to authenticated;
grant execute on function public.issue_invoice(uuid, numeric, date, text, text, text, text, text, text, text, text, boolean) to authenticated;
grant execute on function public.mark_invoice_paid(uuid, text) to authenticated;
grant execute on function public.confirm_payment_received(uuid) to authenticated;
grant execute on function public.mark_order_dispatched(uuid, text, text, text) to authenticated;
grant execute on function public.confirm_order_received(uuid) to authenticated;
grant execute on function public.cancel_order(uuid, text) to authenticated;
