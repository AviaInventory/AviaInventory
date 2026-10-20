-- AviaInventory: the accepted quotation is final.
-- The purchase order no longer changes the quantity or total: quantity, unit price,
-- amount and currency stay exactly as quoted through the PO and the invoice.

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
  -- p_quantity is kept for compatibility but ignored: the accepted quote is final.
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

revoke execute on function public.issue_purchase_order(uuid, integer, text, text, text, text, text, text, text, text, date, text) from public, anon;
grant execute on function public.issue_purchase_order(uuid, integer, text, text, text, text, text, text, text, text, date, text) to authenticated;
