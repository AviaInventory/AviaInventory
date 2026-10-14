-- AviaInventory listing certification workflow v2
-- Separates supplier declaration, upload, review, and AviaInventory verification.
-- Supplier-level verification remains on suppliers.verification_status.

alter table public.part_certification_documents
  add column if not exists review_status text not null default 'Not reviewed';

-- Existing rows created by v1 are mapped into the new two-axis workflow.
update public.part_certification_documents
set review_status = case
  when verification_status = 'Pending' then 'Pending review'
  when verification_status = 'Under Review' then 'Under review'
  when verification_status in ('Verified','Rejected','Expired','Replaced') then 'Reviewed'
  else 'Not reviewed'
end
where review_status = 'Not reviewed';

alter table public.part_certification_documents
  drop constraint if exists part_certification_documents_verification_status_check;

-- Convert the v1 combined status into explicit verification state before adding the new constraint.
update public.part_certification_documents
set verification_status = case
  when verification_status in ('Pending','Under Review') then 'Not verified'
  else verification_status
end;

alter table public.part_certification_documents
  add constraint part_certification_documents_verification_status_check
  check (verification_status in ('Not verified','Verified','Rejected','Expired','Replaced'));

alter table public.part_certification_documents
  drop constraint if exists part_certification_documents_review_status_check;
alter table public.part_certification_documents
  add constraint part_certification_documents_review_status_check
  check (review_status in ('Not reviewed','Pending review','Under review','Reviewed'));

alter table public.part_certification_documents
  drop constraint if exists part_certification_documents_no_verify_without_reviewer;
alter table public.part_certification_documents
  add constraint part_certification_documents_verified_requires_review
  check (
    verification_status <> 'Verified'
    or (review_status = 'Reviewed' and verified_by is not null and verified_at is not null)
  );

alter table public.part_certification_documents
  add constraint part_certification_documents_reviewed_requires_reviewer
  check (
    review_status in ('Not reviewed','Pending review')
    or verification_status = 'Replaced'
    or (reviewed_by is not null and reviewed_at is not null)
  );

-- Remove the v1 overloaded signature so there is one explicit four-state reviewer contract.
drop function if exists public.review_part_certification_document(uuid,text,date,text);

-- Controlled reviewer transition. Suppliers do not receive UPDATE permission.
create or replace function public.review_part_certification_document(
  p_document_id uuid,
  p_review_status text,
  p_verification_status text,
  p_expiry_date date default null,
  p_reviewer_notes text default null
)
returns public.part_certification_documents
language plpgsql
security definer
set search_path = public
as $$
declare v_doc public.part_certification_documents%rowtype;
begin
  if not public.is_platform_admin() then
    raise exception 'Platform administrator access required';
  end if;

  if p_review_status not in ('Not reviewed','Pending review','Under review','Reviewed') then
    raise exception 'Invalid review status';
  end if;

  if p_verification_status not in ('Not verified','Verified','Rejected','Expired','Replaced') then
    raise exception 'Invalid verification status';
  end if;

  if p_verification_status in ('Verified','Rejected','Expired') and p_review_status <> 'Reviewed' then
    raise exception 'A document must be reviewed before it can receive a final verification outcome';
  end if;

  if p_review_status = 'Under review' and p_verification_status <> 'Not verified' then
    raise exception 'A document under review cannot already be marked verified, rejected, or expired';
  end if;

  update public.part_certification_documents
  set review_status = p_review_status,
      verification_status = p_verification_status,
      expiry_date = coalesce(p_expiry_date, expiry_date),
      reviewer_notes = p_reviewer_notes,
      reviewed_by = case
        when p_review_status in ('Under review','Reviewed') then auth.uid()
        else reviewed_by
      end,
      reviewed_at = case
        when p_review_status in ('Under review','Reviewed') then now()
        else reviewed_at
      end,
      verified_by = case
        when p_verification_status = 'Verified' then auth.uid()
        when p_verification_status in ('Not verified','Rejected','Expired','Replaced') then null
        else verified_by
      end,
      verified_at = case
        when p_verification_status = 'Verified' then now()
        when p_verification_status in ('Not verified','Rejected','Expired','Replaced') then null
        else verified_at
      end
  where id = p_document_id
  returning * into v_doc;

  if not found then
    raise exception 'Listing certification document not found';
  end if;

  return v_doc;
end;
$$;

grant execute on function public.review_part_certification_document(uuid,text,text,date,text) to authenticated;

comment on column public.part_certification_documents.document_type is
  'Supplier-declared document/certification type; this is not an AviaInventory verification result.';
comment on column public.part_certification_documents.upload_status is
  'Technical file-upload outcome. Uploaded does not mean reviewed or verified.';
comment on column public.part_certification_documents.review_status is
  'AviaInventory review workflow state, separate from verification outcome.';
comment on column public.part_certification_documents.verification_status is
  'AviaInventory listing-document verification outcome, separate from supplier verification.';

-- The existing platform console uses a dedicated administrator session rather than a Supabase auth user.
-- Keep those audit identities separate from supplier/user UUIDs; never fabricate an auth.users UUID.
alter table public.part_certification_documents
  add column if not exists reviewed_by_admin text,
  add column if not exists verified_by_admin text;

alter table public.part_certification_documents
  drop constraint if exists part_certification_documents_verified_requires_review;
alter table public.part_certification_documents
  add constraint part_certification_documents_verified_requires_review
  check (
    verification_status <> 'Verified'
    or (
      review_status = 'Reviewed'
      and (verified_by is not null or verified_by_admin is not null)
      and verified_at is not null
    )
  );

alter table public.part_certification_documents
  drop constraint if exists part_certification_documents_reviewed_requires_reviewer;
alter table public.part_certification_documents
  add constraint part_certification_documents_reviewed_requires_reviewer
  check (
    review_status in ('Not reviewed','Pending review')
    or verification_status = 'Replaced'
    or ((reviewed_by is not null or reviewed_by_admin is not null) and reviewed_at is not null)
  );

create table if not exists public.part_certification_document_review_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.part_certification_documents(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_admin text,
  from_review_status text,
  to_review_status text not null,
  from_verification_status text,
  to_verification_status text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists part_certification_review_events_document_idx
  on public.part_certification_document_review_events(document_id, created_at desc);

alter table public.part_certification_document_review_events enable row level security;

drop policy if exists "Admins can view listing certification review events" on public.part_certification_document_review_events;
create policy "Admins can view listing certification review events"
  on public.part_certification_document_review_events for select to authenticated
  using (public.is_platform_admin());

comment on column public.part_certification_documents.reviewed_by_admin is
  'Administrator identity from the dedicated platform console when no auth.users identity is available.';
comment on column public.part_certification_documents.verified_by_admin is
  'Administrator identity from the dedicated platform console when no auth.users identity is available.';

-- Public buyers may see only safe metadata for currently verified listing documents.
-- Private files, reviewer notes, and unverified/rejected evidence remain inaccessible.
create or replace function public.get_public_part_verified_certifications(p_part_ids uuid[])
returns table(part_id uuid, document_type text, expiry_date date)
language sql
security definer
stable
set search_path = public
as $$
  select d.part_id, d.document_type, d.expiry_date
  from public.part_certification_documents d
  join public.parts p on p.id = d.part_id and p.status = 'Published'
  where d.part_id = any(coalesce(p_part_ids, array[]::uuid[]))
    and d.verification_status = 'Verified'
    and (d.expiry_date is null or d.expiry_date >= current_date)
    and d.document_type <> 'No certification document'
  order by d.part_id, d.created_at desc;
$$;

grant execute on function public.get_public_part_verified_certifications(uuid[]) to anon, authenticated;
