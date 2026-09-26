-- AviaInventory progressive onboarding metadata.
-- Keeps detailed onboarding optional while retaining a single company profile.

alter table public.profiles
  add column if not exists onboarding_status text not null default 'in_progress',
  add column if not exists onboarding_completion integer not null default 0,
  add column if not exists onboarding_data jsonb not null default '{}'::jsonb;

alter table public.profiles
  drop constraint if exists profiles_onboarding_status_check;

alter table public.profiles
  add constraint profiles_onboarding_status_check
  check (onboarding_status in ('in_progress', 'complete'));

alter table public.profiles
  drop constraint if exists profiles_onboarding_completion_check;

alter table public.profiles
  add constraint profiles_onboarding_completion_check
  check (onboarding_completion between 0 and 100);

create index if not exists profiles_onboarding_status_idx
  on public.profiles (onboarding_status);
