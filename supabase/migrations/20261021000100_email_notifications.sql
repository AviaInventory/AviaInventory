-- AviaInventory: deliver notifications by email (from no-reply@aviainventory.com) as well
-- as in the app and on WhatsApp. Email is on by default (everyone registers with an
-- email address); users can turn it off in Account -> Notifications. The per-type
-- switches (rfq, quotes, orders, messages, verification) still decide whether a
-- notification exists at all.
--
-- The same dispatcher handles both channels; it now lives at /api/notifications/dispatch.

alter table public.account_preferences
  add column if not exists email_notifications boolean not null default true;

alter table public.notifications
  add column if not exists email_status text check (email_status in ('pending', 'sending', 'sent', 'failed')),
  add column if not exists email_attempts integer not null default 0,
  add column if not exists email_error text,
  add column if not exists email_sent_at timestamptz;

create index if not exists notifications_email_queue_idx
  on public.notifications (created_at)
  where email_status in ('pending', 'sending', 'failed');

-- The browser may only flip is_read; keep the delivery fields too.
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
    new.whatsapp_status := old.whatsapp_status;
    new.whatsapp_attempts := old.whatsapp_attempts;
    new.whatsapp_message_id := old.whatsapp_message_id;
    new.whatsapp_error := old.whatsapp_error;
    new.whatsapp_sent_at := old.whatsapp_sent_at;
    new.email_status := old.email_status;
    new.email_attempts := old.email_attempts;
    new.email_error := old.email_error;
    new.email_sent_at := old.email_sent_at;
  end if;
  return new;
end;
$$;

create or replace function public.queue_email_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type in ('rfq', 'quote', 'order', 'message', 'verification', 'billing')
     and not exists (
       select 1 from public.account_preferences ap
       where ap.user_id = new.user_id and not ap.email_notifications
     ) then
    new.email_status := 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists queue_email_notification on public.notifications;
create trigger queue_email_notification
before insert on public.notifications
for each row execute function public.queue_email_notification();

-- Wake the dispatcher for either channel.
create or replace function public.dispatch_whatsapp_notifications()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url text := (select value from public.private_app_settings where key = 'whatsapp_dispatch_url');
  v_secret text := (select value from public.private_app_settings where key = 'whatsapp_dispatch_secret');
begin
  if v_url is null or v_secret is null then
    return null;
  end if;
  if exists (select 1 from new_rows where whatsapp_status = 'pending' or email_status = 'pending') then
    perform net.http_post(
      url := v_url,
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_secret),
      body := '{}'::jsonb,
      timeout_milliseconds := 10000
    );
  end if;
  return null;
end;
$$;

update public.private_app_settings
set value = replace(value, '/api/notifications/whatsapp', '/api/notifications/dispatch')
where key = 'whatsapp_dispatch_url';

-- Claim a batch of emails (service role only); retries like WhatsApp.
create or replace function public.claim_email_notifications(p_limit integer default 20)
returns table (id uuid, user_id uuid, type text, title text, message text, link text, email text, full_name text)
language sql
security definer
set search_path = public
as $$
  with picked as (
    select n.id
    from public.notifications n
    where n.created_at > now() - interval '1 day'
      and n.email_attempts < 3
      and (
        n.email_status = 'pending'
        or n.email_status = 'failed'
        or (n.email_status = 'sending' and n.created_at < now() - interval '10 minutes')
      )
    order by n.created_at
    limit greatest(1, least(p_limit, 100))
    for update skip locked
  ),
  claimed as (
    update public.notifications n
    set email_status = 'sending', email_attempts = n.email_attempts + 1
    from picked
    where n.id = picked.id
    returning n.id, n.user_id, n.type, n.title, n.message, n.link
  )
  select c.id, c.user_id, c.type, c.title, c.message, c.link,
         coalesce(p.email, u.email) as email, p.full_name
  from claimed c
  left join public.profiles p on p.id = c.user_id
  left join auth.users u on u.id = c.user_id;
$$;

revoke execute on function public.claim_email_notifications(integer) from public, anon, authenticated;
grant execute on function public.claim_email_notifications(integer) to service_role;
revoke execute on function public.queue_email_notification() from public, anon, authenticated;
revoke execute on function public.dispatch_whatsapp_notifications() from public, anon, authenticated;
revoke execute on function public.guard_notification_updates() from public, anon, authenticated;
