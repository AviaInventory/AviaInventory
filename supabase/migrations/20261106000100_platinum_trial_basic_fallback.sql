-- 90-day Platinum trial with Basic fallback.
--
-- Every new account (buyer or buyer & supplier) gets all Platinum entitlements for the
-- 90-day trial. When the trial ends the account keeps working on its Basic plan at no
-- charge; Platinum services return only once a paid plan is bought.
-- Mirrors lib/billing/plans.ts and lib/billing/entitlements.ts. Non-destructive.

update public.subscription_plans
set name = 'Platinum Trial',
    entitlements = (select entitlements from public.subscription_plans where code = 'hybrid_platinum'),
    updated_at = now()
where code in ('buyer_trial', 'hybrid_trial');

create or replace function public.has_subscription_entitlement(p_user_id uuid, p_entitlement text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.subscriptions s
    join public.subscription_plans p on p.code = s.plan_code
    where s.user_id = p_user_id
      and (
        -- Trial in progress, paid plan, or paid plan inside its 7-day grace period.
        (
          p.entitlements ? p_entitlement
          and (
            (s.status = 'trialing' and s.trial_ends_at > now())
            or s.status = 'active'
            or (s.status = 'past_due' and coalesce(s.current_period_end, now()) + make_interval(days => 7) > now())
          )
        )
        -- Trial ended: the account runs on its Basic plan.
        or (
          s.status = 'trialing'
          and s.trial_ends_at <= now()
          and exists (
            select 1 from public.subscription_plans b
            where b.code = case when s.account_type = 'hybrid' then 'hybrid_basic' else 'buyer_basic' end
              and b.entitlements ? p_entitlement
          )
        )
      )
  );
$$;
grant execute on function public.has_subscription_entitlement(uuid,text) to authenticated, anon;

-- Trial suppliers get the Platinum search boost while the trial runs.
create or replace function public.marketplace_supplier_search_boosts(p_supplier_ids uuid[])
returns table(supplier_id uuid, boost integer)
language sql
security definer
set search_path = public
stable
as $$
  select s.user_id,
    case
      when s.plan_code in ('hybrid_platinum', 'hybrid_trial', 'buyer_trial') then 25
      when s.plan_code = 'hybrid_bronze' then 15
      else 0
    end as boost
  from public.subscriptions s
  where s.user_id = any(p_supplier_ids)
    and s.status in ('trialing','active','past_due')
    and (s.status <> 'trialing' or s.trial_ends_at > now())
    and s.plan_code in ('hybrid_bronze','hybrid_platinum','hybrid_trial','buyer_trial');
$$;
grant execute on function public.marketplace_supplier_search_boosts(uuid[]) to anon, authenticated;

notify pgrst, 'reload schema';
