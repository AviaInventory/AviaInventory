-- AviaInventory: add "Maintenance Release" as a listing certification document type.

alter table public.part_certification_documents
  drop constraint if exists part_certification_documents_type_check;

alter table public.part_certification_documents
  add constraint part_certification_documents_type_check check (
    document_type in ('FAA 8130-3', 'EASA Form 1', 'Dual Release', 'Certificate of Conformity', 'Maintenance Release', 'OEM documentation', 'Other')
  );
