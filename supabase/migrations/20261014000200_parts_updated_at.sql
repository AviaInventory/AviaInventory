-- AviaInventory: add the parts.updated_at column the listing lifecycle relies on.
--
-- transition_listing_status() (20260917001200_listing_lifecycle) runs
--   update public.parts set status = ..., updated_at = now()
-- and the app's Part type reads updated_at, but no migration ever created the column.
-- Publishing, archiving or otherwise changing a listing's status failed with
-- 42703 'column "updated_at" of relation "parts" does not exist'.

alter table public.parts
  add column if not exists updated_at timestamptz not null default now();

-- Existing listings: last change unknown, so use their creation time.
update public.parts set updated_at = coalesce(created_at, now());

-- Keep it current on every edit, not only lifecycle transitions.
create or replace function public.set_parts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists parts_set_updated_at on public.parts;
create trigger parts_set_updated_at
before update on public.parts
for each row execute function public.set_parts_updated_at();
