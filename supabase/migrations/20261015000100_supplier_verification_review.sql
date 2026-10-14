-- AviaInventory: platform-console review of supplier verification.
--
-- Suppliers could submit verification but nothing let AviaInventory review it. The
-- console (which authenticates with its own admin session, not a Supabase user) now
-- reviews supplier documents and decides the supplier's status through the service
-- role. This migration adds what that needs:
--   * who/when reviewed each supplier document (console admins have no auth.users id,
--     so reviewed_by stays null and the admin name is recorded as text, as for
--     listing certifications);
--   * an append-only audit trail of every document and supplier decision.

alter table public.supplier_verification_documents
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by_admin text;

create table if not exists public.supplier_verification_review_events (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  document_id uuid references public.supplier_verification_documents(id) on delete set null,
  subject text not null check (subject in ('document', 'supplier')),
  actor_admin text not null,
  from_status text,
  to_status text not null,
  comments text,
  created_at timestamptz not null default now()
);

create index if not exists supplier_verification_review_events_supplier_idx
  on public.supplier_verification_review_events (supplier_id, created_at desc);

-- Written only by the console through the service role. Suppliers see decisions
-- through suppliers.verification_comments, not this log.
alter table public.supplier_verification_review_events enable row level security;

drop policy if exists "Platform admins can read supplier verification events" on public.supplier_verification_review_events;
create policy "Platform admins can read supplier verification events"
  on public.supplier_verification_review_events for select to authenticated
  using (public.is_platform_admin());
