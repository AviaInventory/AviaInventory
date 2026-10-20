-- AviaInventory: log of WhatsApp Cloud API webhook events (message status updates and
-- inbound messages). Written only by the server (service role); never read by browsers.

create table if not exists public.whatsapp_events (
  id uuid primary key default gen_random_uuid(),
  event_kind text not null check (event_kind in ('status', 'message', 'other')),
  wa_message_id text,
  phone_number_id text,
  from_number text,
  status text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_events_message_idx on public.whatsapp_events (wa_message_id);
create index if not exists whatsapp_events_created_idx on public.whatsapp_events (created_at desc);

alter table public.whatsapp_events enable row level security;
revoke all on table public.whatsapp_events from anon, authenticated;
