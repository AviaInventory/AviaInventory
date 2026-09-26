import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isValidAdminSessionToken } from "@/lib/admin-auth";

export const LISTING_CERTIFICATION_REVIEW_STATUSES = [
  "Not reviewed",
  "Pending review",
  "Under review",
  "Reviewed",
] as const;

export const LISTING_CERTIFICATION_VERIFICATION_STATUSES = [
  "Not verified",
  "Verified",
  "Rejected",
  "Expired",
  "Replaced",
] as const;

export function requireAdminToken(token?: string) {
  if (!isValidAdminSessionToken(token)) throw new Error("Administrator access required.");
}

export interface AdminListingCertificationRow {
  id: string;
  part_id: string;
  supplier_id: string;
  part_number: string;
  supplier_name: string;
  document_type: string;
  filename: string;
  upload_status: string;
  uploaded_at: string;
  review_status: string;
  verification_status: string;
  expiry_date: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  verified_at: string | null;
  verified_by: string | null;
  reviewer_notes: string | null;
  storage_path: string;
}

export async function getAdminListingCertificationDocuments() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("part_certification_documents")
    .select("*")
    .neq("verification_status", "Replaced")
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) throw error;
  const rows = data ?? [];
  const partIds = [...new Set(rows.map((row) => row.part_id))];
  const supplierIds = [...new Set(rows.map((row) => row.supplier_id))];

  const partsResult = partIds.length
    ? await supabase.from("parts").select("id,part_number").in("id", partIds)
    : { data: [], error: null };
  const suppliersResult = supplierIds.length
    ? await supabase.from("suppliers").select("id,company_name").in("id", supplierIds)
    : { data: [], error: null };
  const { data: parts, error: partsError } = partsResult;
  const { data: suppliers, error: suppliersError } = suppliersResult;
  if (partsError) throw partsError;
  if (suppliersError) throw suppliersError;

  const partMap = new Map((parts ?? []).map((part) => [part.id, part.part_number]));
  const supplierMap = new Map((suppliers ?? []).map((supplier) => [supplier.id, supplier.company_name || "Supplier"]));

  return rows.map((row) => ({
    ...row,
    part_number: partMap.get(row.part_id) ?? "Unknown part",
    supplier_name: supplierMap.get(row.supplier_id) ?? "Supplier",
  })) as AdminListingCertificationRow[];
}

export async function reviewListingCertificationDocument({
  documentId,
  reviewStatus,
  verificationStatus,
  expiryDate,
  reviewerNotes,
}: {
  documentId: string;
  reviewStatus: string;
  verificationStatus: string;
  expiryDate?: string | null;
  reviewerNotes?: string | null;
}) {
  if (!(LISTING_CERTIFICATION_REVIEW_STATUSES as readonly string[]).includes(reviewStatus)) throw new Error("Invalid review status.");
  if (!(LISTING_CERTIFICATION_VERIFICATION_STATUSES as readonly string[]).includes(verificationStatus)) throw new Error("Invalid verification status.");
  if (["Verified", "Rejected", "Expired"].includes(verificationStatus) && reviewStatus !== "Reviewed") throw new Error("A document must be reviewed before it can receive a final verification outcome.");
  if (reviewStatus === "Under review" && verificationStatus !== "Not verified") throw new Error("A document under review cannot have a final verification outcome.");

  const supabase = createAdminClient();
  const { data: before, error: beforeError } = await supabase
    .from("part_certification_documents")
    .select("id,review_status,verification_status")
    .eq("id", documentId)
    .single();
  if (beforeError) throw beforeError;

  const actor = process.env.ADMIN_USERNAME || "AviaInventory platform administrator";
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("part_certification_documents")
    .update({
      review_status: reviewStatus,
      verification_status: verificationStatus,
      expiry_date: expiryDate || null,
      reviewer_notes: reviewerNotes?.trim() || null,
      reviewed_at: reviewStatus === "Under review" || reviewStatus === "Reviewed" ? now : null,
      reviewed_by_admin: reviewStatus === "Under review" || reviewStatus === "Reviewed" ? actor : null,
      verified_at: verificationStatus === "Verified" ? now : null,
      verified_by_admin: verificationStatus === "Verified" ? actor : null,
      verified_by: null,
      reviewed_by: null,
    })
    .eq("id", documentId)
    .select("*")
    .single();

  if (error) throw error;

  const { error: eventError } = await supabase
    .from("part_certification_document_review_events")
    .insert({
      document_id: documentId,
      actor_admin: actor,
      from_review_status: before.review_status,
      to_review_status: reviewStatus,
      from_verification_status: before.verification_status,
      to_verification_status: verificationStatus,
      notes: reviewerNotes?.trim() || null,
    });
  if (eventError) throw eventError;

  return data;
}

export async function getAdminListingCertificationFile(documentId: string) {
  const supabase = createAdminClient();
  const { data: doc, error } = await supabase
    .from("part_certification_documents")
    .select("storage_path")
    .eq("id", documentId)
    .single();
  if (error) throw error;

  const { data, error: signedError } = await supabase.storage
    .from("part-certification-documents")
    .createSignedUrl(doc.storage_path, 300);
  if (signedError) throw signedError;
  return data.signedUrl;
}
