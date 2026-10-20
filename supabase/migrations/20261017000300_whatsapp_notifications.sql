-- AviaInventory: deliver notifications on WhatsApp as well as in the app.
--
-- * Users opt in (Account -> Notifications) with a WhatsApp number; the time of consent is
--   recorded (WhatsApp policy and the Kenya Data Protection Act require opt-in).
-- * A new notification of a WhatsApp-enabled type for an opted-in user is marked
--   whatsapp_status = 'pending'. The per-type switches (rfq, quotes, orders, messages,
--   verification) already decide whether the notification exists at all.
-- * After insert, pg_net calls the site's dispatcher (/api/notifications/whatsapp), which
--   sends the approved template and records sent/failed. Each dispatch also retries
--   earlier pending/failed rows, so a missed call is picked up by the next one.
--
-- Dispatcher URL and secret live in private_app_settings, set outside migrations:
--   insert into public.private_app_settings (key, value) values
--     ('whatsapp_dispatch_url', 'https://www.aviainventory.com/api/notifications/whatsapp'),
--     ('whatsapp_dispatch_secret', '<WHATSAPP_DISPATCH_SECRET>')
--   on conflict (key) do update set value = excluded.value;

create extension if not exists pg_net with schema extensions;

-- ---------------------------------------------------------------------------
-- Opt-in
-- ---------------------------------------------------------------------------

alter table public.account_preferences
  add column if not exists whatsapp_opt_in boolean not null default false,
  add column if not exists whatsapp_number text,
  add column if not exists whatsapp_opt_in_at timestamptz;

alter table public.account_preferences
  drop constraint if exists account_preferences_whatsapp_number_check;
alter table public.account_preferences
  add constraint account_preferences_whatsapp_number_check
  check (whatsapp_number is null or whatsapp_number ~ '^\+[1-9][0-9]{7,14}$');

create or replace function public.stamp_whatsapp_consent()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.whatsapp_opt_in and new.whatsapp_number is null then
    raise exception 'Add a WhatsApp number to receive WhatsApp notifications.' using errcode = 'P0001';
  end if;
  if new.whatsapp_opt_in and (tg_op = 'INSERT' or not old.whatsapp_opt_in or old.whatsapp_number is distinct from new.whatsapp_number) then
    new.whatsapp_opt_in_at := now();
  elsif not new.whatsapp_opt_in then
    new.whatsapp_opt_in_at := null;
  elsif tg_op = 'UPDATE' then
    new.whatsapp_opt_in_at := old.whatsapp_opt_in_at;
  end if;
  return new;
end;
$$;

drop trigger if exists stamp_whatsapp_consent on public.account_preferences;
create trigger stamp_whatsapp_consent
before insert or update on public.account_preferences
for each row execute function public.stamp_whatsapp_consent();

-- ---------------------------------------------------------------------------
-- Delivery state on notifications
-- ---------------------------------------------------------------------------

alter table public.notifications
  add column if not exists whatsapp_status text check (whatsapp_status in ('pending', 'sending', 'sent', 'failed')),
  add column if not exists whatsapp_attempts integer not null default 0,
  add column if not exists whatsapp_message_id text,
  add column if not exists whatsapp_error text,
  add column if not exists whatsapp_sent_at timestamptz;

create index if not exists notifications_whatsapp_queue_idx
  on public.notifications (created_at)
  where whatsapp_status in ('pending', 'sending', 'failed');

-- The browser may only flip is_read (guard_notification_updates); keep WhatsApp fields too.
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
  end if;
  return new;
end;
$$;

create or replace function public.queue_whatsapp_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type in ('rfq', 'quote', 'order', 'message', 'verification')
     and exists (
       select 1 from public.account_preferences ap
       where ap.user_id = new.user_id and ap.whatsapp_opt_in and ap.whatsapp_number is not null
     ) then
    new.whatsapp_status := 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists queue_whatsapp_notification on public.notifications;
create trigger queue_whatsapp_notification
before insert on public.notifications
for each row execute function public.queue_whatsapp_notification();

-- ---------------------------------------------------------------------------
-- Wake the dispatcher
-- ---------------------------------------------------------------------------

create table if not exists public.private_app_settings (
  key text primary key,
  value text not null
);
alter table public.private_app_settings enable row level security;
revoke all on table public.private_app_settings from anon, authenticated;

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
  if exists (select 1 from new_rows where whatsapp_status = 'pending') then
    -- Asynchronous: the insert never waits for (or fails because of) WhatsApp.
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

drop trigger if exists dispatch_whatsapp_notifications on public.notifications;
create trigger dispatch_whatsapp_notifications
after insert on public.notifications
referencing new table as new_rows
for each statement execute function public.dispatch_whatsapp_notifications();

-- Claim a batch for sending (service role only). Rows stuck in 'sending' for 10 minutes
-- and failed rows (up to 3 attempts, within a day) are retried.
create or replace function public.claim_whatsapp_notifications(p_limit integer default 20)
returns table (id uuid, user_id uuid, type text, title text, message text, link text, whatsapp_number text)
language sql
security definer
set search_path = public
as $$
  with picked as (
    select n.id
    from public.notifications n
    where n.created_at > now() - interval '1 day'
      and n.whatsapp_attempts < 3
      and (
        n.whatsapp_status = 'pending'
        or n.whatsapp_status = 'failed'
        or (n.whatsapp_status = 'sending' and n.created_at < now() - interval '10 minutes')
      )
    order by n.created_at
    limit greatest(1, least(p_limit, 100))
    for update skip locked
  ),
  claimed as (
    update public.notifications n
    set whatsapp_status = 'sending', whatsapp_attempts = n.whatsapp_attempts + 1
    from picked
    where n.id = picked.id
    returning n.id, n.user_id, n.type, n.title, n.message, n.link
  )
  select c.id, c.user_id, c.type, c.title, c.message, c.link, ap.whatsapp_number
  from claimed c
  left join public.account_preferences ap on ap.user_id = c.user_id and ap.whatsapp_opt_in;
$$;

revoke execute on function public.claim_whatsapp_notifications(integer) from public, anon, authenticated;
grant execute on function public.claim_whatsapp_notifications(integer) to service_role;
revoke execute on function public.queue_whatsapp_notification() from public, anon, authenticated;
revoke execute on function public.dispatch_whatsapp_notifications() from public, anon, authenticated;
revoke execute on function public.stamp_whatsapp_consent() from public, anon, authenticated;
revoke execute on function public.guard_notification_updates() from public, anon, authenticated;
