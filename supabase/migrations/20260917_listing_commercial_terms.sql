-- AviaInventory commercial listing model.
-- Price is explicit: type (fixed/negotiable/RFQ) + basis (unit/lot).

alter table public.parts
  add column if not exists price_type text not null default 'fixed',
  add column if not exists price_basis text not null default 'unit',
  add column if not exists lot_size integer,
  add column if not exists minimum_order_quantity integer not null default 1,
  add column if not exists availability text,
  add column if not exists incoterms text,
  add column if not exists payment_terms text,
  add column if not exists price_valid_until date;

-- A numeric price is optional only for Request Quote. Lot pricing must declare the lot size.
alter table public.parts alter column unit_price drop not null;

alter table public.parts drop constraint if exists parts_price_type_check;
alter table public.parts add constraint parts_price_type_check
  check (price_type in ('fixed','negotiable','request_quote')) not valid;

alter table public.parts drop constraint if exists parts_price_basis_check;
alter table public.parts add constraint parts_price_basis_check
  check (price_basis in ('unit','lot')) not valid;

alter table public.parts drop constraint if exists parts_commercial_price_check;
alter table public.parts add constraint parts_commercial_price_check
  check (
    (price_type = 'request_quote' and unit_price is null)
    or
    (price_type in ('fixed','negotiable') and unit_price is not null and unit_price >= 0)
  ) not valid;

alter table public.parts drop constraint if exists parts_lot_size_check;
alter table public.parts add constraint parts_lot_size_check
  check (
    (price_basis = 'unit' and lot_size is null)
    or
    (price_basis = 'lot' and lot_size is not null and lot_size > 0)
  ) not valid;

alter table public.parts drop constraint if exists parts_moq_check;
alter table public.parts add constraint parts_moq_check
  check (minimum_order_quantity > 0 and minimum_order_quantity <= quantity) not valid;

-- Existing records that used 0 as a placeholder are treated as Request Quote rather than
-- being presented to buyers as a real zero-price offer.
update public.parts
set price_type = 'request_quote', unit_price = null
where coalesce(unit_price, 0) = 0 and price_type = 'fixed';

comment on column public.parts.price_type is 'fixed, negotiable, or request_quote';
comment on column public.parts.price_basis is 'unit or lot';
comment on column public.parts.lot_size is 'Number of physical units represented by a lot price';
comment on column public.parts.minimum_order_quantity is 'Minimum number of physical units a buyer may order';
comment on column public.parts.availability is 'Supplier-declared availability, e.g. In stock, Limited stock, On request';
comment on column public.parts.incoterms is 'Optional Incoterms 2020 term and named place';
comment on column public.parts.payment_terms is 'Optional supplier payment terms';
comment on column public.parts.price_valid_until is 'Date through which the displayed fixed/negotiable price is valid';
