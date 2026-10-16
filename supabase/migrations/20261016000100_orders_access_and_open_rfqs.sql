-- AviaInventory: make accepted quotes visible as orders, and let RFQs go to all suppliers.
--
-- 1. orders had RLS enabled but no policies, so nobody could read the orders that
--    accept_quote() creates: the Orders tab stayed empty for buyers and suppliers.
-- 2. An RFQ with no named supplier (supplier_id is null) is an "open" RFQ that every
--    supplier may see and quote on. Previously suppliers only saw RFQs addressed to them.
-- 3. A new quote moves its RFQ from Pending to Quoted in the database. The app tried to
--    do this itself, but suppliers have no UPDATE right on rfqs, so it silently failed.

-- 1. Orders ------------------------------------------------------------------------

drop policy if exists "Buyers and suppliers can view their orders" on public.orders;
create policy "Buyers and suppliers can view their orders"
  on public.orders for select to authenticated
  using (buyer_id = auth.uid() or supplier_id = auth.uid() or public.is_platform_admin());

drop policy if exists "Suppliers can update their orders" on public.orders;
create policy "Suppliers can update their orders"
  on public.orders for update to authenticated
  using (supplier_id = auth.uid())
  with check (supplier_id = auth.uid());

-- Orders are created only by accept_quote() (security definer); no INSERT/DELETE policies.

-- Suppliers may only change the status, and only forward through fulfilment.
create or replace function public.guard_order_updates()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_allowed text[];
begin
  if not public.is_direct_client_write() then
    return new;
  end if;

  -- Everything except status and updated_at stays as it was.
  new.rfq_id := old.rfq_id;
  new.quote_id := old.quote_id;
  new.buyer_id := old.buyer_id;
  new.supplier_id := old.supplier_id;
  new.part_id := old.part_id;
  new.quantity := old.quantity;
  new.unit_price := old.unit_price;
  new.currency := old.currency;
  new.total_amount := old.total_amount;
  new.created_at := old.created_at;

  if new.status is distinct from old.status then
    v_allowed := case old.status
      when 'Pending' then array['Processing', 'Cancelled']
      when 'Processing' then array['Packed', 'Cancelled']
      when 'Packed' then array['Shipped', 'Cancelled']
      when 'Shipped' then array['Delivered']
      when 'Delivered' then array['Completed']
      else array[]::text[]
    end;
    if not (new.status = any(v_allowed)) then
      raise exception 'An order that is % cannot be changed to %.', old.status, new.status
        using errcode = 'P0001';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists guard_order_updates on public.orders;
create trigger guard_order_updates
before update on public.orders
for each row execute function public.guard_order_updates();

-- 2. Open RFQs ---------------------------------------------------------------------

drop policy if exists "Suppliers can view open RFQs" on public.rfqs;
create policy "Suppliers can view open RFQs"
  on public.rfqs for select to authenticated
  using (
    supplier_id is null
    and buyer_id <> auth.uid()
    and exists (select 1 from public.suppliers s where s.id = auth.uid())
    and (
      status in ('Pending', 'Quoted')
      -- Keep RFQs a supplier has quoted on visible after the buyer decides.
      or exists (select 1 from public.quotes q where q.rfq_id = rfqs.id and q.supplier_id = auth.uid())
    )
  );

-- A supplier quotes on an RFQ addressed to them or an open RFQ, never their own.
drop policy if exists "Suppliers can create their own quotes" on public.quotes;
create policy "Suppliers can create their own quotes"
  on public.quotes for insert to authenticated
  with check (
    supplier_id = auth.uid()
    and exists (
      select 1 from public.rfqs r
      where r.id = rfq_id
        and r.buyer_id = quotes.buyer_id
        and r.buyer_id <> auth.uid()
        and (r.supplier_id = auth.uid() or r.supplier_id is null)
        and r.status in ('Pending', 'Quoted')
    )
  );
-- The broad "Suppliers manage own quotes" (ALL) policy also allowed inserts without the
-- RFQ checks above; narrow it to reading and updating.
drop policy if exists "Suppliers manage own quotes" on public.quotes;
drop policy if exists "Suppliers can update their own quotes" on public.quotes;
create policy "Suppliers can update their own quotes"
  on public.quotes for update to authenticated
  using (supplier_id = auth.uid())
  with check (supplier_id = auth.uid());

-- 3. A new quote marks the RFQ as Quoted -------------------------------------------

create or replace function public.mark_rfq_quoted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.rfqs set status = 'Quoted' where id = new.rfq_id and status = 'Pending';
  return new;
end;
$$;

revoke execute on function public.mark_rfq_quoted() from public, anon, authenticated;

drop trigger if exists quotes_mark_rfq_quoted on public.quotes;
create trigger quotes_mark_rfq_quoted
after insert on public.quotes
for each row execute function public.mark_rfq_quoted();
