-- AviaInventory: signed-in users must be able to read suppliers.mro_capable.
--
-- suppliers uses column-level SELECT grants (20261016000200_supplier_private_columns), so the
-- column added by 20261024000100 was not readable by `authenticated`. The RFQ visibility
-- policy reads it, which made every RFQ read by a signed-in user fail with
-- "permission denied for table suppliers"; the MRO switch in account settings failed too.

grant select (mro_capable) on public.suppliers to authenticated;

notify pgrst, 'reload schema';
