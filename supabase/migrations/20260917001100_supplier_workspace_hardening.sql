-- AviaInventory senior audit hardening
-- 1) Normalise the supplier listing lifecycle used by the UI.
-- 2) Prevent client-side role confusion around quotation status changes.
-- 3) Keep quote identity fields immutable after creation.

update public.parts
set status = 'Published'
where status = 'Active';

-- Listing lifecycle is normalised at the application boundary. Existing database
-- constraints are intentionally not replaced here because deployments may carry
-- additional legacy states.

create or replace function public.guard_quote_status_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if new.rfq_id <> old.rfq_id
     or new.supplier_id <> old.supplier_id
     or new.buyer_id <> old.buyer_id then
    raise exception 'Quotation ownership fields cannot be changed';
  end if;

  -- Buyer-controlled terminal decisions are accepted/rejected. Supplier-side
  -- editing can draft, send, withdraw and expire, but cannot self-accept.
  if auth.uid() = old.supplier_id and new.status = 'Accepted' then
    raise exception 'Only the buyer can accept a quotation';
  end if;

  if auth.uid() = old.buyer_id and new.status in ('Draft','Sent') then
    raise exception 'Buyer cannot set supplier quotation workflow status';
  end if;

  if new.status = 'Accepted' and auth.uid() <> old.buyer_id then
    raise exception 'Only the buyer can accept a quotation';
  end if;

  return new;
end;
$$;

drop trigger if exists quotes_status_guard on public.quotes;
create trigger quotes_status_guard
before update on public.quotes
for each row execute function public.guard_quote_status_changes();

revoke all on function public.guard_quote_status_changes() from public;
