-- AviaInventory listing lifecycle and transaction-aware deletion protection.
-- Lifecycle: Draft -> Published -> Reserved -> Sold -> Archived
--                    \-> Inactive -> Published/Archived
-- Draft may be archived. Archived is terminal.

alter table public.parts drop constraint if exists parts_listing_status_check;
alter table public.parts
  add constraint parts_listing_status_check
  check (status in ('Draft','Published','Reserved','Sold','Inactive','Archived'))
  not valid;

create or replace function public.get_listing_transaction_context(p_part_id uuid)
returns table(
  rfq_count bigint,
  quote_count bigint,
  order_count bigint,
  shipment_count bigint,
  invoice_count bigint,
  has_history boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rfq bigint := 0;
  v_quote bigint := 0;
  v_order bigint := 0;
  v_shipment bigint := 0;
  v_invoice bigint := 0;
  v_owner uuid;
begin
  select supplier_id into v_owner from public.parts where id = p_part_id;
  if v_owner is null then raise exception 'Listing not found'; end if;
  if auth.uid() is null or v_owner <> auth.uid() then raise exception 'You do not own this listing'; end if;

  select count(*) into v_rfq from public.rfqs where part_id = p_part_id;
  select count(*) into v_quote
    from public.quotes q
    join public.rfqs r on r.id = q.rfq_id
   where r.part_id = p_part_id;
  select count(*) into v_order from public.orders where part_id = p_part_id;
  select count(*) into v_shipment
    from public.supplier_shipments s
    join public.orders o on o.id = s.order_id
   where o.part_id = p_part_id;
  select count(*) into v_invoice
    from public.supplier_invoices i
    join public.orders o on o.id = i.order_id
   where o.part_id = p_part_id;

  rfq_count := v_rfq;
  quote_count := v_quote;
  order_count := v_order;
  shipment_count := v_shipment;
  invoice_count := v_invoice;
  has_history := (v_rfq + v_quote + v_order + v_shipment + v_invoice) > 0;
  return next;
end;
$$;

create or replace function public.transition_listing_status(p_part_id uuid, p_target_status text)
returns public.parts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_part public.parts;
  v_has_history boolean := false;
  v_rfq bigint := 0;
  v_quote bigint := 0;
  v_order bigint := 0;
  v_shipment bigint := 0;
  v_invoice bigint := 0;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into v_part from public.parts where id = p_part_id for update;
  if not found or v_part.supplier_id <> auth.uid() then raise exception 'Listing not found or not owned by you'; end if;
  if p_target_status not in ('Draft','Published','Reserved','Sold','Inactive','Archived') then raise exception 'Invalid listing status'; end if;
  if v_part.status = p_target_status then return v_part; end if;

  if not (
    (v_part.status = 'Draft' and p_target_status in ('Published','Archived')) or
    (v_part.status = 'Published' and p_target_status in ('Reserved','Inactive','Archived')) or
    (v_part.status = 'Reserved' and p_target_status in ('Published','Sold','Inactive')) or
    (v_part.status = 'Sold' and p_target_status = 'Archived') or
    (v_part.status = 'Inactive' and p_target_status in ('Published','Archived'))
  ) then
    raise exception 'Transition from % to % is not allowed', v_part.status, p_target_status;
  end if;

  select coalesce(x.rfq_count,0), coalesce(x.quote_count,0), coalesce(x.order_count,0), coalesce(x.shipment_count,0), coalesce(x.invoice_count,0), coalesce(x.has_history,false)
    into v_rfq, v_quote, v_order, v_shipment, v_invoice, v_has_history
    from public.get_listing_transaction_context(p_part_id) x;

  -- Once a listing participates in a business workflow, it is never converted
  -- back to Draft and is not hard-deleted. Inactive/Archived preserve history.
  if v_has_history and p_target_status = 'Draft' then
    raise exception 'Listings with business history cannot return to Draft; use Inactive or Archived';
  end if;

  update public.parts set status = p_target_status, updated_at = now() where id = p_part_id returning * into v_part;
  return v_part;
end;
$$;

-- Hard deletion is deliberately restricted to clean drafts with no transactional history.
-- UI should prefer archive/inactive for every listing that has entered a business workflow.
create or replace function public.hard_delete_clean_draft_listing(p_part_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_owner uuid;
  v_has_history boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select status, supplier_id into v_status, v_owner from public.parts where id = p_part_id for update;
  if v_owner is null or v_owner <> auth.uid() then raise exception 'Listing not found or not owned by you'; end if;
  if v_status <> 'Draft' then raise exception 'Only clean Draft listings can be permanently deleted'; end if;
  select has_history into v_has_history from public.get_listing_transaction_context(p_part_id);
  if coalesce(v_has_history,false) then raise exception 'This listing has business history and must be archived instead of deleted'; end if;
  delete from public.parts where id = p_part_id and supplier_id = auth.uid();
  return true;
end;
$$;

revoke all on function public.get_listing_transaction_context(uuid) from public;
revoke all on function public.transition_listing_status(uuid,text) from public;
revoke all on function public.hard_delete_clean_draft_listing(uuid) from public;
grant execute on function public.get_listing_transaction_context(uuid) to authenticated;
grant execute on function public.transition_listing_status(uuid,text) to authenticated;
grant execute on function public.hard_delete_clean_draft_listing(uuid) to authenticated;

create or replace function public.guard_listing_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_history boolean := false;
begin
  if new.status = old.status then return new; end if;
  if new.status not in ('Draft','Published','Reserved','Sold','Inactive','Archived') then
    raise exception 'Invalid listing status';
  end if;

  if auth.uid() is not null and auth.uid() <> old.supplier_id then
    raise exception 'You do not own this listing';
  end if;

  if not (
    (old.status = 'Draft' and new.status in ('Published','Archived')) or
    (old.status = 'Published' and new.status in ('Reserved','Inactive','Archived')) or
    (old.status = 'Reserved' and new.status in ('Published','Sold','Inactive')) or
    (old.status = 'Sold' and new.status = 'Archived') or
    (old.status = 'Inactive' and new.status in ('Published','Archived'))
  ) then
    raise exception 'Transition from % to % is not allowed', old.status, new.status;
  end if;

  if new.status = 'Draft' then
    select has_history into v_has_history from public.get_listing_transaction_context(old.id);
    if coalesce(v_has_history,false) then
      raise exception 'Listings with business history cannot return to Draft';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists parts_listing_status_guard on public.parts;
create trigger parts_listing_status_guard
before update of status on public.parts
for each row execute function public.guard_listing_status_transition();

revoke all on function public.guard_listing_status_transition() from public;

create table if not exists public.part_listing_status_history (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.parts(id),
  supplier_id uuid not null references auth.users(id),
  from_status text not null,
  to_status text not null,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now()
);

create index if not exists part_listing_status_history_part_idx on public.part_listing_status_history(part_id, changed_at desc);
alter table public.part_listing_status_history enable row level security;
drop policy if exists "Suppliers read own listing status history" on public.part_listing_status_history;
create policy "Suppliers read own listing status history" on public.part_listing_status_history
  for select to authenticated using (supplier_id = auth.uid());

create or replace function public.record_listing_status_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> old.status then
    insert into public.part_listing_status_history(part_id, supplier_id, from_status, to_status, changed_by)
    values (new.id, new.supplier_id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists parts_listing_status_history on public.parts;
create trigger parts_listing_status_history
after update of status on public.parts
for each row execute function public.record_listing_status_history();
revoke all on function public.record_listing_status_history() from public;
