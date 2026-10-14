-- AviaInventory: let a Buyer & Supplier (hybrid) account switch back to Buyer only,
-- e.g. to choose the Buyer Basic plan. The reverse of upgrade_to_hybrid_account().
--
-- Safe by design:
--   * refused while the company still has live listings (Published/Reserved), open
--     purchase orders as a supplier, or a paid Buyer & Supplier plan;
--   * the suppliers row, listings and documents are kept, so enabling selling again
--     restores everything;
--   * a running hybrid trial becomes a buyer trial with the same end date.
-- account_roles can only change through security-definer functions like this one
-- (see 20261013000300_lock_privileged_columns).

create or replace function public.downgrade_to_buyer_account()
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_profile from public.profiles where id = v_user_id for update;
  if not found then
    raise exception 'Account profile not found';
  end if;

  if v_profile.account_type = 'admin' or 'admin' = any(v_profile.account_roles) then
    raise exception 'Admin accounts cannot be changed here';
  end if;

  if not ('supplier' = any(v_profile.account_roles)) then
    return v_profile.account_roles; -- already Buyer only
  end if;

  if exists (select 1 from public.parts where supplier_id = v_user_id and status in ('Published', 'Reserved')) then
    raise exception 'You still have live listings. Mark them Inactive or Archived before disabling selling.'
      using errcode = 'P0001';
  end if;

  if exists (select 1 from public.orders where supplier_id = v_user_id and status not in ('Completed', 'Cancelled')) then
    raise exception 'You have open purchase orders as a supplier. Complete or cancel them before disabling selling.'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.subscriptions
    where user_id = v_user_id
      and status in ('active', 'past_due', 'incomplete')
      and plan_code in ('hybrid_basic', 'hybrid_bronze', 'hybrid_platinum')
  ) then
    raise exception 'You are on a paid Buyer & Supplier plan. Change or cancel it before disabling selling.'
      using errcode = 'P0001';
  end if;

  update public.profiles set account_roles = array['buyer'], account_type = 'buyer' where id = v_user_id;

  update public.subscriptions
  set account_type = 'buyer',
      plan_code = case when plan_code = 'hybrid_trial' then 'buyer_trial' else plan_code end,
      updated_at = now()
  where user_id = v_user_id and status in ('trialing', 'active', 'past_due', 'incomplete');

  return array['buyer'];
end;
$$;

revoke execute on function public.downgrade_to_buyer_account() from public, anon;
grant execute on function public.downgrade_to_buyer_account() to authenticated;
