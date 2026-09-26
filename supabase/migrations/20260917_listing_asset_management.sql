-- AviaInventory listing asset management
-- Canonical metadata for supplier-managed listing images and non-certification documents.
-- Legacy image_urls/document_urls remain on parts for marketplace compatibility.

create table if not exists public.part_listing_images (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.parts(id) on delete cascade,
  supplier_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  filename text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  upload_status text not null default 'Uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint part_listing_images_upload_status_check check (upload_status in ('Uploading','Uploaded','Upload Failed'))
);

create index if not exists part_listing_images_part_idx on public.part_listing_images(part_id, sort_order);
create unique index if not exists part_listing_images_primary_idx on public.part_listing_images(part_id) where is_primary;

create table if not exists public.part_listing_documents (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.parts(id) on delete cascade,
  supplier_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null default 'Supporting document',
  storage_path text not null,
  filename text not null,
  upload_status text not null default 'Uploaded',
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint part_listing_documents_upload_status_check check (upload_status in ('Uploaded','Upload Failed'))
);

create index if not exists part_listing_documents_part_idx on public.part_listing_documents(part_id, created_at desc);

alter table public.part_listing_images enable row level security;
alter table public.part_listing_documents enable row level security;

drop policy if exists "Suppliers manage own listing images" on public.part_listing_images;
create policy "Suppliers manage own listing images" on public.part_listing_images
  for all to authenticated using (supplier_id = auth.uid()) with check (supplier_id = auth.uid());

drop policy if exists "Suppliers manage own listing documents" on public.part_listing_documents;
create policy "Suppliers manage own listing documents" on public.part_listing_documents
  for all to authenticated using (supplier_id = auth.uid()) with check (supplier_id = auth.uid());

-- Allow suppliers to remove a listing certification record they own. Verification state is still
-- immutable to suppliers because UPDATE remains admin-only.
drop policy if exists "Suppliers can delete own listing certification documents" on public.part_certification_documents;
create policy "Suppliers can delete own listing certification documents"
  on public.part_certification_documents for delete to authenticated
  using (supplier_id = auth.uid());

-- Storage buckets used by supplier listing assets.
insert into storage.buckets (id, name, public)
values ('part-images', 'part-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "Suppliers upload own part images" on storage.objects;
create policy "Suppliers upload own part images" on storage.objects
  for insert to authenticated with check (bucket_id = 'part-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Suppliers manage own part images" on storage.objects;
create policy "Suppliers manage own part images" on storage.objects
  for delete to authenticated using (bucket_id = 'part-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Private supporting documents are scoped to the supplier's top-level folder.
drop policy if exists "Suppliers upload own listing documents" on storage.objects;
create policy "Suppliers upload own listing documents" on storage.objects
  for insert to authenticated with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Suppliers manage own listing documents storage" on storage.objects;
create policy "Suppliers manage own listing documents storage" on storage.objects
  for delete to authenticated using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- Keep metadata timestamps current.
create or replace function public.set_part_listing_asset_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists part_listing_images_updated_at on public.part_listing_images;
create trigger part_listing_images_updated_at before update on public.part_listing_images
for each row execute function public.set_part_listing_asset_updated_at();

drop trigger if exists part_listing_documents_updated_at on public.part_listing_documents;
create trigger part_listing_documents_updated_at before update on public.part_listing_documents
for each row execute function public.set_part_listing_asset_updated_at();

-- One-time compatibility backfill for legacy image_urls. URLs are converted only when they expose
-- the existing public bucket path; no invented storage path is created for opaque external URLs.
insert into public.part_listing_images (part_id, supplier_id, storage_path, public_url, filename, sort_order, is_primary)
select p.id, p.supplier_id,
       regexp_replace(split_part(u.url, '/object/public/part-images/', 2), '\?.*$', ''),
       u.url,
       coalesce(nullif(regexp_replace(split_part(split_part(u.url, '/object/public/part-images/', 2), '?', 1), '^.*/', ''), ''), 'part-image'),
       u.ord - 1,
       u.ord = 1
from public.parts p
cross join lateral unnest(coalesce(p.image_urls, array[]::text[])) with ordinality as u(url, ord)
where u.url like '%/object/public/part-images/%'
  and not exists (select 1 from public.part_listing_images i where i.part_id = p.id);
