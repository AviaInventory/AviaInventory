-- AviaInventory: client feedback (Oct 2026) — RFQ types, expiry, closing quotes, MRO suppliers.
--
-- 1. RFQs get real columns for what used to live only in the message text:
--      rfq_type        'parts' (aircraft parts) or 'mro' (repair / overhaul service)
--      required_date   mandatory for new RFQs, at least 3 days after the RFQ is created
--      attachment_urls storage paths in the private rfq-attachments bucket
--    Existing RFQs are backfilled from their "Required Date:" message line.
-- 2. An RFQ expires once its required date is reached: it becomes 'Expired' and no
--    supplier can quote on it. expire_overdue_rfqs() does the status change (the app
--    calls it, and pg_cron runs it daily where available); the quote policy checks the
--    date itself, so quoting stops on time even before the status is updated.
-- 3. Sent RFQs and quotations are historical records: buyers cannot edit an RFQ's
--    details and suppliers cannot edit a sent quotation (status changes still work).
-- 4. 'Closed' replaces 'Rejected' for quotations that were not selected. A buyer who
--    accepts a quote is asked to close the others (close_other_quotes()).
-- 5. suppliers.mro_capable marks suppliers with MRO (repair / overhaul) capability. They
--    are listed on the public MRO Services page and receive MRO service RFQs.
-- 6. Public helpers for the homepage: promoted listings and promoted suppliers / MROs.

-- ---------------------------------------------------------------------------
-- 1. RFQ columns
-- ---------------------------------------------------------------------------

alter table public.rfqs add column if not exists rfq_type text not null default 'parts';
alter table public.rfqs add column if not exists required_date date;
alter table public.rfqs add column if not exists attachment_urls text[] not null default array[]::text[];

alter table public.rfqs drop constraint if exists rfqs_rfq_type_check;
alter table public.rfqs add constraint rfqs_rfq_type_check check (rfq_type in ('parts', 'mro'));

update public.rfqs r
set required_date = substring(r.message from '(?m)^Required Date:\s*(\d{4}-\d{2}-\d{2})')::date
where r.required_date is null
  and r.message ~ '(?m)^Required Date:\s*\d{4}-\d{2}-\d{2}';

-- Status lists: drop whatever status checks exist (names differ between environments)
-- and add one that includes the new values. 'Rejected' stays allowed for old rows.
do $$
declare
  v_name text;
begin
  for v_name in
    select c.conname from pg_constraint c
    where c.conrelid = 'public.rfqs'::regclass and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%status%'
  loop
    execute format('alter table public.rfqs drop constraint %I', v_name);
  end loop;

  for v_name in
    select c.conname from pg_constraint c
    where c.conrelid = 'public.quotes'::regclass and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%status%'
  loop
    execute format('alter table public.quotes drop constraint %I', v_name);
  end loop;
end;
$$;

alter table public.rfqs add constraint rfqs_status_check
  check (status in ('Pending', 'Quoted', 'Accepted', 'Rejected', 'Cancelled', 'Closed', 'Expired'));
alter table public.quotes add constraint quotes_status_check
  check (status in ('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Closed'));

-- New RFQs must carry a required date at least 3 days out.
create or replace function public.validate_new_rfq()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.required_date is null then
    raise exception 'Please choose the date the RFQ is required by.' using errcode = 'P0001';
  end if;
  if new.required_date < (coalesce(new.created_at, now()) at time zone 'utc')::date + 3 then
    raise exception 'The required-by date must be at least 3 days from today.' using errcode = 'P0001';
  end if;
  new.attachment_urls := coalesce(new.attachment_urls, array[]::text[]);
  return new;
end;
$$;

revoke execute on function public.validate_new_rfq() from public, anon, authenticated;

drop trigger if exists validate_new_rfq on public.rfqs;
create trigger validate_new_rfq
before insert on public.rfqs
for each row execute function public.validate_new_rfq();

-- ---------------------------------------------------------------------------
-- 2. Expiry
-- ---------------------------------------------------------------------------

-- The quote status guard rejected every update without a signed-in user, which also
-- blocked internal jobs (the daily expiry run, migrations). Requests through the API
-- always carry JWT claims; with none, the change comes from the database itself.
create or replace function public.guard_quote_status_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null and coalesce(current_setting('request.jwt.claims', true), '') = '' then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if new.rfq_id <> old.rfq_id
     or new.supplier_id <> old.supplier_id
     or new.buyer_id <> old.buyer_id then
    raise exception 'Quotation ownership fields cannot be changed';
  end if;

  -- Buyer-controlled terminal decisions are accepted/closed. Supplier-side
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

revoke all on function public.guard_quote_status_changes() from public;

create or replace function public.expire_overdue_rfqs()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.rfqs
  set status = 'Expired'
  where status in ('Pending', 'Quoted')
    and required_date is not null
    and required_date <= current_date;
  get diagnostics v_count = row_count;

  -- Quotations still waiting on an expired RFQ expire with it.
  update public.quotes q
  set status = 'Expired', updated_at = now()
  from public.rfqs r
  where r.id = q.rfq_id and r.status = 'Expired' and q.status in ('Draft', 'Sent');

  return v_count;
end;
$$;

revoke execute on function public.expire_overdue_rfqs() from public, anon;
grant execute on function public.expire_overdue_rfqs() to authenticated;

do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule(jobid) from cron.job where jobname = 'expire-overdue-rfqs';
  perform cron.schedule('expire-overdue-rfqs', '5 0 * * *', 'select public.expire_overdue_rfqs()');
exception when others then
  raise notice 'pg_cron not available; RFQs expire when the app calls expire_overdue_rfqs(): %', sqlerrm;
end;
$$;

select public.expire_overdue_rfqs();

-- ---------------------------------------------------------------------------
-- 3. Sent RFQs and quotations are read-only
-- ---------------------------------------------------------------------------

create or replace function public.guard_rfq_updates()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.is_direct_client_write() then
    return new;
  end if;

  if new.message is distinct from old.message
     or new.quantity is distinct from old.quantity
     or new.supplier_id is distinct from old.supplier_id
     or new.part_id is distinct from old.part_id
     or new.buyer_id is distinct from old.buyer_id
     or new.rfq_type is distinct from old.rfq_type
     or new.required_date is distinct from old.required_date
     or new.attachment_urls is distinct from old.attachment_urls
     or new.created_at is distinct from old.created_at then
    raise exception 'A sent RFQ cannot be edited. Cancel it and create a new RFQ instead.' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke execute on function public.guard_rfq_updates() from public, anon, authenticated;

drop trigger if exists guard_rfq_updates on public.rfqs;
create trigger guard_rfq_updates
before update on public.rfqs
for each row execute function public.guard_rfq_updates();

create or replace function public.guard_sent_quote_terms()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.is_direct_client_write() then
    return new;
  end if;

  -- Drafts may still be completed; once sent, only the status may change.
  if old.status <> 'Draft' and (
       new.unit_price is distinct from old.unit_price
       or new.currency is distinct from old.currency
       or new.lead_time is distinct from old.lead_time
       or new.condition is distinct from old.condition
       or new.warranty is distinct from old.warranty
       or new.valid_until is distinct from old.valid_until
       or new.certification is distinct from old.certification
       or new.message is distinct from old.message) then
    raise exception 'A sent quotation cannot be edited.' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke execute on function public.guard_sent_quote_terms() from public, anon, authenticated;

drop trigger if exists guard_sent_quote_terms on public.quotes;
create trigger guard_sent_quote_terms
before update on public.quotes
for each row execute function public.guard_sent_quote_terms();

-- ---------------------------------------------------------------------------
-- 4. Closed instead of Rejected
-- ---------------------------------------------------------------------------

update public.quotes set status = 'Closed' where status = 'Rejected';
update public.rfqs set status = 'Closed' where status = 'Rejected';

-- accept_quote() and older clients may still write 'Rejected'; store it as 'Closed'.
create or replace function public.quotes_rejected_is_closed()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'Rejected' then
    new.status := 'Closed';
  end if;
  return new;
end;
$$;

revoke execute on function public.quotes_rejected_is_closed() from public, anon, authenticated;

drop trigger if exists a_quotes_rejected_is_closed on public.quotes;
create trigger a_quotes_rejected_is_closed
before insert or update on public.quotes
for each row execute function public.quotes_rejected_is_closed();

drop trigger if exists a_rfqs_rejected_is_closed on public.rfqs;
create trigger a_rfqs_rejected_is_closed
before insert or update on public.rfqs
for each row execute function public.quotes_rejected_is_closed();

-- Buyer closes the remaining open quotations on an RFQ once one has been accepted.
create or replace function public.close_other_quotes(p_rfq_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not exists (select 1 from public.rfqs r where r.id = p_rfq_id and r.buyer_id = auth.uid()) then
    raise exception 'RFQ not found.' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.quotes q where q.rfq_id = p_rfq_id and q.status = 'Accepted') then
    raise exception 'Accept a quotation before closing the others.' using errcode = 'P0001';
  end if;

  update public.quotes
  set status = 'Closed', updated_at = now()
  where rfq_id = p_rfq_id and status in ('Draft', 'Sent');
  get diagnostics v_count = row_count;

  update public.rfqs set status = 'Accepted' where id = p_rfq_id and status in ('Pending', 'Quoted');

  return v_count;
end;
$$;

revoke execute on function public.close_other_quotes(uuid) from public, anon;
grant execute on function public.close_other_quotes(uuid) to authenticated;

-- The "not selected" notification now fires for Closed quotations.
create or replace function public.notify_quote_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company text;
  v_part text := public.rfq_part_label(new.rfq_id);
begin
  if tg_op = 'INSERT' then
    select s.company_name into v_company from public.suppliers s where s.id = new.supplier_id;
    perform public.notify_user(
      new.buyer_id, 'quote', 'quotes', 'New quotation received',
      format('%s quoted %s %s for %s.', coalesce(v_company, 'A supplier'), coalesce(new.currency, ''), new.unit_price, v_part),
      '/buyer/rfqs/' || new.rfq_id || '#quotations'
    );
  elsif new.status is distinct from old.status and new.status = 'Closed' then
    perform public.notify_user(
      new.supplier_id, 'quote', 'quotes', 'RFQ closed',
      format('The buyer has closed the RFQ for %s and selected another quotation.', v_part),
      '/supplier/quotes/' || new.id
    );
  end if;
  return new;
end;
$$;

revoke execute on function public.notify_quote_events() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. MRO-capable suppliers
-- ---------------------------------------------------------------------------

alter table public.suppliers add column if not exists mro_capable boolean not null default false;

-- Suppliers who registered as an MRO / repair station already have the capability.
update public.suppliers
set mro_capable = true
where not mro_capable
  and (business_type ilike '%mro%' or business_type ilike '%repair%' or business_type ilike '%overhaul%');

update public.suppliers s
set mro_capable = true
from public.profiles p
where p.id = s.id and not s.mro_capable
  and (p.onboarding_data->>'mroCapable' = 'true' or p.onboarding_data->>'supplierType' ilike '%mro%');

-- The registration form records the "MRO capabilities" tick in profiles.onboarding_data;
-- carry it over when the supplier row is created (by handle_new_auth_user or an upgrade).
create or replace function public.set_supplier_mro_capable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not new.mro_capable then
    select coalesce(p.onboarding_data->>'mroCapable' = 'true', false)
           or coalesce(p.onboarding_data->>'supplierType' ilike '%mro%', false)
           or coalesce(new.business_type ilike '%mro%', false)
      into new.mro_capable
    from public.profiles p where p.id = new.id;
    new.mro_capable := coalesce(new.mro_capable, false);
  end if;
  return new;
end;
$$;

revoke execute on function public.set_supplier_mro_capable() from public, anon, authenticated;

drop trigger if exists set_supplier_mro_capable on public.suppliers;
create trigger set_supplier_mro_capable
before insert on public.suppliers
for each row execute function public.set_supplier_mro_capable();

-- ---------------------------------------------------------------------------
-- RFQ visibility and quoting rules
-- ---------------------------------------------------------------------------

-- Open parts RFQs go to every supplier; open MRO service RFQs to MRO-capable suppliers.
drop policy if exists "Suppliers can view open RFQs" on public.rfqs;
create policy "Suppliers can view open RFQs"
  on public.rfqs for select to authenticated
  using (
    supplier_id is null
    and buyer_id <> auth.uid()
    and exists (
      select 1 from public.suppliers s
      where s.id = auth.uid() and (rfqs.rfq_type <> 'mro' or s.mro_capable)
    )
    and (
      (status in ('Pending', 'Quoted') and (required_date is null or required_date > current_date))
      -- Keep RFQs a supplier has quoted on visible after the buyer decides.
      or exists (select 1 from public.quotes q where q.rfq_id = rfqs.id and q.supplier_id = auth.uid())
    )
  );

-- A supplier quotes once per RFQ, only while it is open and before its required date.
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
        and (r.required_date is null or r.required_date > current_date)
    )
    and not exists (
      select 1 from public.quotes q
      where q.rfq_id = quotes.rfq_id and q.supplier_id = auth.uid()
    )
  );

-- Same rules with clear messages, independent of what the supplier can read under RLS.
create or replace function public.validate_new_quote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rfq public.rfqs;
begin
  -- Security definer so the duplicate check sees every quote; quotes are only ever
  -- inserted by suppliers, so there is no internal writer to exempt.
  select * into v_rfq from public.rfqs where id = new.rfq_id;
  if v_rfq.required_date is not null and v_rfq.required_date <= current_date then
    raise exception 'This RFQ has expired: its required-by date has been reached.' using errcode = 'P0001';
  end if;
  if v_rfq.status is distinct from 'Pending' and v_rfq.status is distinct from 'Quoted' then
    raise exception 'This RFQ is closed and no longer accepts quotations.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.quotes q where q.rfq_id = new.rfq_id and q.supplier_id = new.supplier_id) then
    raise exception 'You have already submitted a quotation for this RFQ.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.validate_new_quote() from public, anon, authenticated;

drop trigger if exists validate_new_quote on public.quotes;
create trigger validate_new_quote
before insert on public.quotes
for each row execute function public.validate_new_quote();

-- New MRO RFQs notify MRO-capable suppliers only.
create or replace function public.notify_new_rfq()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_part text := public.rfq_part_label(new.id);
  v_message text := case when new.rfq_type = 'mro'
    then format('A buyer requested repair / overhaul of %s × %s. Review it and send your quotation.', coalesce(new.quantity, 1), v_part)
    else format('A buyer requested %s × %s. Review it and send your quotation.', coalesce(new.quantity, 1), v_part)
  end;
begin
  if new.supplier_id is not null then
    perform public.notify_user(new.supplier_id, 'rfq', 'rfq',
      case when new.rfq_type = 'mro' then 'New MRO service RFQ received' else 'New RFQ received' end,
      v_message, '/supplier/rfqs/' || new.id || '#submit-quote');
  else
    insert into public.notifications (user_id, type, title, message, link)
    select s.id, 'rfq',
      case when new.rfq_type = 'mro' then 'New MRO service RFQ' else 'New open RFQ' end,
      v_message, '/supplier/rfqs/' || new.id || '#submit-quote'
    from public.suppliers s
    where s.id <> new.buyer_id
      and (new.rfq_type <> 'mro' or s.mro_capable)
      and public.wants_notification(s.id, 'rfq');
  end if;
  return new;
end;
$$;

revoke execute on function public.notify_new_rfq() from public, anon, authenticated;

-- MRO RFQs carry the component's part number on a "Part Number:" line like parts RFQs,
-- so rfq_part_label() keeps working unchanged.

-- ---------------------------------------------------------------------------
-- RFQ attachments (private bucket; paths are stored in rfqs.attachment_urls)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values ('rfq-attachments', 'rfq-attachments', false, 20971520)
on conflict (id) do update set public = false;

drop policy if exists "Buyers upload own RFQ attachments" on storage.objects;
create policy "Buyers upload own RFQ attachments"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'rfq-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Buyers delete own RFQ attachments" on storage.objects;
create policy "Buyers delete own RFQ attachments"
  on storage.objects for delete to authenticated
  using (bucket_id = 'rfq-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

-- Readable by the buyer and by anyone who can see an RFQ that lists the file.
drop policy if exists "RFQ participants read RFQ attachments" on storage.objects;
create policy "RFQ participants read RFQ attachments"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'rfq-attachments'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.rfqs r where storage.objects.name = any(r.attachment_urls))
    )
  );

-- ---------------------------------------------------------------------------
-- Profile photos (public bucket; each user writes only to their own folder).
-- The app stores the public URL in profiles.avatar_url.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values ('avatars', 'avatars', true, 5242880)
on conflict (id) do update set public = true;

drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- 6. Public homepage helpers
-- ---------------------------------------------------------------------------

-- Promoted listings: approved/active featured listings in their window, then listings
-- the supplier marked as featured, from suppliers whose plan includes featured listings.
create or replace function public.get_public_promoted_listings(result_limit integer default 8)
returns table(part_id uuid, priority integer)
language sql
security definer
set search_path = public
stable
as $$
  with candidates as (
    select fl.listing_id as part_id, 100 + fl.priority as priority, fl.created_at
    from public.featured_listings fl
    join public.parts p on p.id = fl.listing_id and p.status = 'Published'
    where fl.status in ('Approved', 'Active')
      and (fl.starts_at is null or fl.starts_at <= now())
      and (fl.ends_at is null or fl.ends_at > now())
    union all
    select p.id, 0, p.created_at
    from public.parts p
    where p.status = 'Published' and p.featured
      and public.has_subscription_entitlement(p.supplier_id, 'featured_listings')
  )
  select c.part_id, max(c.priority)::integer
  from candidates c
  group by c.part_id
  order by max(c.priority) desc, max(c.created_at) desc
  limit greatest(least(coalesce(result_limit, 8), 24), 0);
$$;

grant execute on function public.get_public_promoted_listings(integer) to anon, authenticated;

-- Supplier cards with MRO flag and promotion boost, optionally MRO-capable only.
create or replace function public.get_public_supplier_directory(result_limit integer default 24, mro_only boolean default false)
returns table(
  id uuid,
  company_name text,
  country text,
  city text,
  listing_count bigint,
  average_rating numeric,
  review_count bigint,
  logo_url text,
  verification_status text,
  business_type text,
  mro_capable boolean,
  promoted boolean
)
language sql
security definer
set search_path = public
stable
as $$
  with active_listings as (
    select p.supplier_id, count(*)::bigint as listing_count
    from public.parts p where p.status = 'Published' group by p.supplier_id
  ), review_summary as (
    select sr.supplier_id, round(avg(sr.rating)::numeric, 1) as average_rating, count(*)::bigint as review_count
    from public.supplier_reviews sr where sr.is_published = true group by sr.supplier_id
  ), directory as (
    select s.id, coalesce(s.company_name, 'Supplier') as company_name, pr.country, s.city,
           coalesce(al.listing_count, 0)::bigint as listing_count, rs.average_rating,
           coalesce(rs.review_count, 0)::bigint as review_count, null::text as logo_url,
           coalesce(s.verification_status, 'Draft') as verification_status, s.business_type,
           s.mro_capable,
           public.has_subscription_entitlement(s.id, 'featured_listings') as promoted
    from public.suppliers s
    left join active_listings al on al.supplier_id = s.id
    left join public.profiles pr on pr.id = s.id
    left join review_summary rs on rs.supplier_id = s.id
    where (mro_only and s.mro_capable) or (not mro_only and al.listing_count is not null)
  )
  select * from directory
  order by promoted desc, (verification_status = 'Verified') desc, listing_count desc, company_name asc
  limit greatest(least(coalesce(result_limit, 24), 100), 0);
$$;

grant execute on function public.get_public_supplier_directory(integer, boolean) to anon, authenticated;
