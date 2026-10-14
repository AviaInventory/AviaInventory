-- AviaInventory: a company cannot send an RFQ to itself.
--
-- With Buyer & Supplier (hybrid) accounts the buyer and supplier can be the same
-- account. Such an RFQ cannot be answered (messaging yourself is rejected) and makes
-- no business sense. The app now blocks it; this enforces it in the database too.
-- NOT VALID: existing rows are left alone, every new or edited RFQ is checked.

alter table public.rfqs drop constraint if exists rfqs_buyer_is_not_supplier;
alter table public.rfqs
  add constraint rfqs_buyer_is_not_supplier
  check (supplier_id is null or supplier_id <> buyer_id) not valid;
