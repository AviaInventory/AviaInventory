-- AviaInventory: in-app notifications for RFQs, quotes, orders, messages and verification.
--
-- Notifications are written only by the security-definer triggers below, so they cannot be
-- forged from the browser. Each user's Account -> Notifications switches
-- (account_preferences.notification_preferences: rfq, quotes, orders, messages, verification) are
-- respected; a missing key means "on".

alter table public.notifications
  add column if not exists type text not null default 'general',
  add column if not exists link text;

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

-- Previously "Users manage own notifications" (ALL) let users insert or rewrite their own rows.
drop policy if exists "Users manage own notifications" on public.notifications;

create policy "Users can view their notifications"
on public.notifications for select to authenticated
using (user_id = auth.uid());

create policy "Users can mark their notifications read"
on public.notifications for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their notifications"
on public.notifications for delete to authenticated
using (user_id = auth.uid());

-- Only is_read may change from the browser.
create or replace function public.guard_notification_updates()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_direct_client_write() then
    new.id := old.id;
    new.user_id := old.user_id;
    new.type := old.type;
    new.title := old.title;
    new.message := old.message;
    new.link := old.link;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_notification_updates on public.notifications;
create trigger guard_notification_updates
before update on public.notifications
for each row execute function public.guard_notification_updates();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.wants_notification(p_user uuid, p_pref text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select ap.notification_preferences->>p_pref from public.account_preferences ap where ap.user_id = p_user), 'true') <> 'false';
$$;

create or replace function public.notify_user(p_user uuid, p_type text, p_pref text, p_title text, p_message text, p_link text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user is null or not public.wants_notification(p_user, p_pref) then
    return;
  end if;
  insert into public.notifications (user_id, type, title, message, link)
  values (p_user, p_type, p_title, left(p_message, 500), p_link);
end;
$$;

-- "Part Number: X" is the first line of the composed RFQ message; fall back to the linked part.
create or replace function public.rfq_part_label(p_rfq_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(nullif(trim(substring(r.message from '(?m)^Part Number:\s*(.*)$')), ''), '-'),
    (select pt.part_number from public.parts pt where pt.id = r.part_id),
    'a part'
  )
  from public.rfqs r where r.id = p_rfq_id;
$$;

-- ---------------------------------------------------------------------------
-- RFQs: tell the addressed supplier, or every supplier for an open RFQ.
-- ---------------------------------------------------------------------------

create or replace function public.notify_new_rfq()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_part text := public.rfq_part_label(new.id);
  v_message text := format('A buyer requested %s × %s. Review it and send your quotation.', coalesce(new.quantity, 1), v_part);
begin
  if new.supplier_id is not null then
    perform public.notify_user(new.supplier_id, 'rfq', 'rfq', 'New RFQ received', v_message, '/supplier/rfqs/' || new.id);
  else
    insert into public.notifications (user_id, type, title, message, link)
    select s.id, 'rfq', 'New open RFQ', v_message, '/supplier/rfqs/' || new.id
    from public.suppliers s
    where s.id <> new.buyer_id
      and public.wants_notification(s.id, 'rfq');
  end if;
  return new;
end;
$$;

drop trigger if exists rfqs_notify_new on public.rfqs;
create trigger rfqs_notify_new
after insert on public.rfqs
for each row execute function public.notify_new_rfq();

-- ---------------------------------------------------------------------------
-- Quotes: new quote -> buyer; declined quote -> supplier.
-- (Acceptance is announced by the order notification below.)
-- ---------------------------------------------------------------------------

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
      '/buyer/rfqs/' || new.rfq_id
    );
  elsif new.status is distinct from old.status and new.status = 'Rejected' then
    perform public.notify_user(
      new.supplier_id, 'quote', 'quotes', 'Quotation not selected',
      format('The buyer did not select your quotation for %s.', v_part),
      '/supplier/quotes'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists quotes_notify_events on public.quotes;
create trigger quotes_notify_events
after insert or update of status on public.quotes
for each row execute function public.notify_quote_events();

-- ---------------------------------------------------------------------------
-- Orders: created -> both parties; status change -> the other party.
-- ---------------------------------------------------------------------------

create or replace function public.notify_order_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text := upper(left(new.id::text, 8));
  v_part text := coalesce((select pt.part_number from public.parts pt where pt.id = new.part_id), public.rfq_part_label(new.rfq_id));
  v_actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    perform public.notify_user(new.supplier_id, 'order', 'orders', 'Quotation accepted: new order',
      format('Order %s for %s × %s was created from your accepted quotation.', v_ref, coalesce(new.quantity, 1), v_part),
      '/supplier/purchase-orders/' || new.id);
    perform public.notify_user(new.buyer_id, 'order', 'orders', 'Order created',
      format('Order %s for %s × %s is now with the supplier.', v_ref, coalesce(new.quantity, 1), v_part),
      '/buyer/orders/' || new.id);
  elsif new.status is distinct from old.status then
    if v_actor is distinct from new.buyer_id then
      perform public.notify_user(new.buyer_id, 'order', 'orders', 'Order ' || lower(new.status),
        format('Order %s (%s) is now %s.', v_ref, v_part, new.status), '/buyer/orders/' || new.id);
    end if;
    if v_actor is distinct from new.supplier_id then
      perform public.notify_user(new.supplier_id, 'order', 'orders', 'Order ' || lower(new.status),
        format('Order %s (%s) is now %s.', v_ref, v_part, new.status), '/supplier/purchase-orders/' || new.id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_notify_events on public.orders;
create trigger orders_notify_events
after insert or update of status on public.orders
for each row execute function public.notify_order_events();

-- ---------------------------------------------------------------------------
-- Messages: one unread notification per conversation, refreshed on new messages.
-- ---------------------------------------------------------------------------

create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid;
  v_link text;
  v_sender text;
begin
  if new.recipient_id is null or new.recipient_id = new.sender_id then
    return new;
  end if;

  select r.buyer_id into v_buyer from public.rfqs r where r.id = new.rfq_id;
  v_link := case
    when new.rfq_id is null then
      case when exists (select 1 from public.suppliers s where s.id = new.recipient_id) then '/supplier/messages' else '/buyer/messages' end
    when v_buyer = new.recipient_id then '/buyer/rfqs/' || new.rfq_id || '#supplier-conversation'
    else '/supplier/rfqs/' || new.rfq_id
  end;

  select coalesce(p.company_name, p.full_name) into v_sender from public.profiles p where p.id = new.sender_id;

  update public.notifications
  set message = left(new.message, 200), created_at = now()
  where user_id = new.recipient_id and type = 'message' and link = v_link and not is_read;

  if not found then
    perform public.notify_user(new.recipient_id, 'message', 'messages',
      'New message from ' || coalesce(v_sender, 'a marketplace user'), left(new.message, 200), v_link);
  end if;
  return new;
end;
$$;

drop trigger if exists messages_notify_new on public.messages;
create trigger messages_notify_new
after insert on public.messages
for each row execute function public.notify_new_message();

-- ---------------------------------------------------------------------------
-- Supplier verification decisions.
-- ---------------------------------------------------------------------------

create or replace function public.notify_verification_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_status is distinct from old.verification_status
     and new.verification_status in ('Verified', 'Rejected', 'More Information Required', 'Suspended') then
    perform public.notify_user(new.id, 'verification', 'verification',
      case new.verification_status
        when 'Verified' then 'Your company is verified'
        when 'Rejected' then 'Verification not approved'
        when 'Suspended' then 'Verification suspended'
        else 'More information needed for verification'
      end,
      case new.verification_status
        when 'Verified' then 'Buyers now see the Verified badge on your profile and listings.'
        else coalesce(nullif(new.verification_comments, ''), 'Open your verification page to see what the reviewer needs.')
      end,
      '/supplier/verification');
  end if;
  return new;
end;
$$;

drop trigger if exists suppliers_notify_verification on public.suppliers;
create trigger suppliers_notify_verification
after update of verification_status on public.suppliers
for each row execute function public.notify_verification_decision();

-- Trigger/helper functions are not part of the public RPC API.
revoke execute on function public.guard_notification_updates() from public, anon, authenticated;
revoke execute on function public.wants_notification(uuid, text) from public, anon, authenticated;
revoke execute on function public.notify_user(uuid, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.rfq_part_label(uuid) from public, anon, authenticated;
revoke execute on function public.notify_new_rfq() from public, anon, authenticated;
revoke execute on function public.notify_quote_events() from public, anon, authenticated;
revoke execute on function public.notify_order_events() from public, anon, authenticated;
revoke execute on function public.notify_new_message() from public, anon, authenticated;
revoke execute on function public.notify_verification_decision() from public, anon, authenticated;
