-- AviaInventory Account Management Centre
-- Uses one master user/company profile while storing role-specific preferences separately.

alter table public.profiles
  add column if not exists trading_name text,
  add column if not exists region text,
  add column if not exists postal_code text,
  add column if not exists company_phone text,
  add column if not exists company_description text,
  add column if not exists year_established integer,
  add column if not exists avatar_url text;

create table if not exists public.account_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  buying_preferences jsonb not null default '{}'::jsonb,
  selling_preferences jsonb not null default '{}'::jsonb,
  notification_preferences jsonb not null default '{}'::jsonb,
  privacy_settings jsonb not null default '{}'::jsonb,
  language text not null default 'English',
  timezone text not null default 'UTC',
  currency text not null default 'USD',
  date_format text not null default 'DD MMM YYYY',
  measurements text not null default 'Metric',
  marketplace_density text not null default 'Comfortable',
  updated_at timestamptz not null default now()
);

alter table public.account_preferences enable row level security;
drop policy if exists "Users manage own account preferences" on public.account_preferences;
create policy "Users manage own account preferences" on public.account_preferences
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references auth.users(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  role text not null default 'Viewer',
  status text not null default 'Pending',
  created_at timestamptz not null default now(),
  unique(company_id,email)
);

alter table public.company_members enable row level security;
drop policy if exists "Company owners view members" on public.company_members;
create policy "Company owners view members" on public.company_members for select to authenticated using (company_id = auth.uid() or user_id = auth.uid());
drop policy if exists "Company owners create members" on public.company_members;
create policy "Company owners create members" on public.company_members for insert to authenticated with check (company_id = auth.uid());
drop policy if exists "Company owners update members" on public.company_members;
create policy "Company owners update members" on public.company_members for update to authenticated using (company_id = auth.uid()) with check (company_id = auth.uid());
drop policy if exists "Company owners delete members" on public.company_members;
create policy "Company owners delete members" on public.company_members for delete to authenticated using (company_id = auth.uid());

create table if not exists public.company_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references auth.users(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  role text not null default 'Viewer',
  status text not null default 'Pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz default (now() + interval '7 days')
);

alter table public.company_invitations enable row level security;
drop policy if exists "Company owners manage invitations" on public.company_invitations;
create policy "Company owners manage invitations" on public.company_invitations for all to authenticated using (company_id = auth.uid()) with check (company_id = auth.uid());

create index if not exists company_members_company_idx on public.company_members(company_id);
create index if not exists company_invitations_company_idx on public.company_invitations(company_id);

-- Seed an account-preferences row lazily through application upserts; no sensitive auth data is stored here.


-- Allow invited users to see their own pending invitation and accept it securely.
drop policy if exists "Invitees view own invitation" on public.company_invitations;
create policy "Invitees view own invitation" on public.company_invitations
for select to authenticated using (lower(email) = lower(coalesce(auth.jwt()->>'email','')));

create or replace function public.accept_company_invitation(p_invitation_id uuid)
returns public.company_members
language plpgsql
security definer
set search_path = public
as $$
declare v_inv public.company_invitations%rowtype; v_member public.company_members%rowtype; v_email text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  v_email := lower(coalesce(auth.jwt()->>'email',''));
  select * into v_inv from public.company_invitations
  where id = p_invitation_id and lower(email) = v_email and status = 'Pending'
    and (expires_at is null or expires_at > now()) for update;
  if not found then raise exception 'Invitation not found or expired'; end if;
  insert into public.company_members(company_id,user_id,email,role,status)
  values(v_inv.company_id,auth.uid(),v_email,v_inv.role,'Active')
  on conflict(company_id,email) do update set user_id=excluded.user_id, role=excluded.role, status='Active'
  returning * into v_member;
  update public.company_invitations set user_id=auth.uid(), status='Accepted' where id=v_inv.id;
  return v_member;
end;
$$;

grant execute on function public.accept_company_invitation(uuid) to authenticated;
