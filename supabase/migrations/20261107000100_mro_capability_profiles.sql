-- AviaInventory: MRO Capabilities & Approvals form.
--
-- 1. mro_profiles holds one MRO's answers: capability item keys (see lib/mro-form.ts),
--    notes, aircraft types, AOG response time, other locations and approvals
--    (regulatory, quality, OEM) with certificate number, expiry and scope.
-- 2. Suppliers save their own profile through save_mro_profile(), which also lists them
--    on MRO Services (mro_capable). Visitors who fill the form before signing up send it
--    in onboarding_data.mroProfile; it is saved when their supplier row is created.
-- 3. get_mro_profiles() is the public read. Signed-out visitors get capabilities and
--    approval names only; certificate numbers, expiry dates and scope need a sign-in.

create table if not exists public.mro_profiles (
  supplier_id uuid primary key references public.suppliers(id) on delete cascade,
  capabilities text[] not null default array[]::text[],
  component_notes text,
  aircraft_types text,
  aog_response_hours numeric(6, 1),
  other_locations text,
  approvals jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mro_profiles_approvals_array check (jsonb_typeof(approvals) = 'array'),
  constraint mro_profiles_aog_hours check (aog_response_hours is null or aog_response_hours >= 0)
);

alter table public.mro_profiles enable row level security;

drop policy if exists "Suppliers can view their own MRO profile" on public.mro_profiles;
create policy "Suppliers can view their own MRO profile"
  on public.mro_profiles for select to authenticated
  using (supplier_id = auth.uid());

revoke all on public.mro_profiles from anon;
grant select on public.mro_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Writing (internal): cleans the JSON from the form and upserts it.
-- ---------------------------------------------------------------------------

create or replace function public.write_mro_profile(p_supplier_id uuid, p_profile jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capabilities text[];
  v_approvals jsonb;
  v_hours text := btrim(coalesce(p_profile->>'aogResponseHours', ''));
begin
  if p_profile is null or jsonb_typeof(p_profile) <> 'object' then
    raise exception 'Invalid MRO profile' using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct value), array[]::text[])
    into v_capabilities
  from (
    select value from jsonb_array_elements_text(
      case when jsonb_typeof(p_profile->'capabilities') = 'array' then p_profile->'capabilities' else '[]'::jsonb end
    ) as value
    where value ~ '^[a-z0-9-]+:[a-z0-9-]+$' and length(value) <= 160
    limit 300
  ) items;

  select coalesce(jsonb_agg(item), '[]'::jsonb)
    into v_approvals
  from (
    select jsonb_build_object(
             'group', a->>'group',
             'key', left(coalesce(a->>'key', ''), 40),
             'name', left(btrim(coalesce(a->>'name', '')), 120),
             'certificateNo', left(btrim(coalesce(a->>'certificateNo', '')), 80),
             'expiry', case when coalesce(a->>'expiry', '') ~ '^\d{4}-\d{2}-\d{2}$' then a->>'expiry' else '' end,
             'scope', left(btrim(coalesce(a->>'scope', '')), 500)
           ) as item
    from jsonb_array_elements(
      case when jsonb_typeof(p_profile->'approvals') = 'array' then p_profile->'approvals' else '[]'::jsonb end
    ) as a
    where jsonb_typeof(a) = 'object'
      and a->>'group' in ('regulatory', 'quality', 'oem')
      and btrim(coalesce(a->>'name', '')) <> ''
    limit 30
  ) approvals;

  insert into public.mro_profiles as m (
    supplier_id, capabilities, component_notes, aircraft_types, aog_response_hours, other_locations, approvals, updated_at
  ) values (
    p_supplier_id,
    v_capabilities,
    nullif(left(btrim(coalesce(p_profile->>'componentNotes', '')), 2000), ''),
    nullif(left(btrim(coalesce(p_profile->>'aircraftTypes', '')), 1000), ''),
    case when v_hours ~ '^\d{1,5}(\.\d+)?$' then round(v_hours::numeric, 1) end,
    nullif(left(btrim(coalesce(p_profile->>'otherLocations', '')), 1000), ''),
    v_approvals,
    now()
  )
  on conflict (supplier_id) do update set
    capabilities = excluded.capabilities,
    component_notes = excluded.component_notes,
    aircraft_types = excluded.aircraft_types,
    aog_response_hours = excluded.aog_response_hours,
    other_locations = excluded.other_locations,
    approvals = excluded.approvals,
    updated_at = now();
end;
$$;

revoke execute on function public.write_mro_profile(uuid, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Saving from the app (signed-in supplier).
-- ---------------------------------------------------------------------------

create or replace function public.save_mro_profile(p_profile jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Sign in to save your MRO capabilities' using errcode = '42501';
  end if;
  if not exists (select 1 from public.suppliers s where s.id = v_uid) then
    raise exception 'Only supplier accounts can list MRO capabilities' using errcode = '42501';
  end if;

  perform public.write_mro_profile(v_uid, p_profile);
  update public.suppliers set mro_capable = true where id = v_uid and not mro_capable;
end;
$$;

revoke execute on function public.save_mro_profile(jsonb) from public, anon;
grant execute on function public.save_mro_profile(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Sign-up: the form filled before the account existed travels in onboarding_data.
-- ---------------------------------------------------------------------------

create or replace function public.apply_signup_mro_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile jsonb;
begin
  select p.onboarding_data->'mroProfile' into v_profile from public.profiles p where p.id = new.id;
  if v_profile is not null and jsonb_typeof(v_profile) = 'object' then
    begin
      perform public.write_mro_profile(new.id, v_profile);
      if not new.mro_capable then
        update public.suppliers set mro_capable = true where id = new.id;
      end if;
    exception when others then
      -- Never block sign-up over the optional MRO details; they can be entered again later.
      raise warning 'MRO profile from sign-up was not saved for %: %', new.id, sqlerrm;
    end;
  end if;
  return null;
end;
$$;

revoke execute on function public.apply_signup_mro_profile() from public, anon, authenticated;

drop trigger if exists apply_signup_mro_profile on public.suppliers;
create trigger apply_signup_mro_profile
after insert on public.suppliers
for each row execute function public.apply_signup_mro_profile();

-- ---------------------------------------------------------------------------
-- Public read for MRO Services and supplier pages.
-- ---------------------------------------------------------------------------

create or replace function public.get_mro_profiles(p_supplier_ids uuid[])
returns table (
  supplier_id uuid,
  capabilities text[],
  component_notes text,
  aircraft_types text,
  aog_response_hours numeric,
  other_locations text,
  approvals jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select m.supplier_id, m.capabilities, m.component_notes, m.aircraft_types, m.aog_response_hours, m.other_locations,
         coalesce((
           select jsonb_agg(
                    case when auth.uid() is null
                      then jsonb_build_object('group', a->>'group', 'key', a->>'key', 'name', a->>'name',
                                              'expired', coalesce(a->>'expiry', '') <> '' and (a->>'expiry')::date < current_date)
                      else a || jsonb_build_object('expired', coalesce(a->>'expiry', '') <> '' and (a->>'expiry')::date < current_date)
                    end
                    order by ord)
           from jsonb_array_elements(m.approvals) with ordinality as x(a, ord)
         ), '[]'::jsonb) as approvals
  from public.mro_profiles m
  join public.suppliers s on s.id = m.supplier_id and s.mro_capable
  where m.supplier_id = any((coalesce(p_supplier_ids, array[]::uuid[]))[1:100]);
$$;

grant execute on function public.get_mro_profiles(uuid[]) to anon, authenticated;

notify pgrst, 'reload schema';
