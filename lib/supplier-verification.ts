import { supabase } from "@/lib/supabase";

export const SUPPLIER_VERIFICATION_STATUSES = [
  "Draft",
  "Submitted",
  "Under Review",
  "More Information Required",
  "Verified",
  "Suspended",
  "Rejected",
] as const;

export type SupplierVerificationStatus = (typeof SUPPLIER_VERIFICATION_STATUSES)[number];
export type VerificationDocumentStatus = "Pending" | "Under Review" | "Verified" | "Rejected" | "Expired" | "Replaced";

export interface SupplierVerificationDocument {
  id: string;
  supplier_id: string;
  document_type: string;
  document_name: string;
  issue_date: string | null;
  expiry_date: string | null;
  issuing_authority: string | null;
  verification_status: VerificationDocumentStatus;
  storage_path: string;
  version: number;
  reviewer_notes: string | null;
  uploaded_by: string;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierVerificationSummary {
  verification_status: SupplierVerificationStatus;
  verification_completion: number;
  verification_comments: string | null;
  verification_missing_information: string[];
  document_count: number;
  verified_document_count: number;
  expiring_document_count: number;
  expired_document_count: number;
}

/** The signed-in supplier's own verification workspace (supplierId must be the current user). */
export async function getSupplierVerification(supplierId: string) {
  const [{ data: publicFields, error: supplierError }, { data: privateRows, error: privateError }, { data: documents, error: documentsError }, { data: summary, error: summaryError }, { data: profile, error: profileError }] = await Promise.all([
    supabase
      .from("suppliers")
      .select("id,company_name,business_type,website,city,verification_status,verification_completion")
      .eq("id", supplierId)
      .single(),
    // Address, registration number and reviewer comments are readable only by their owner.
    supabase.rpc("get_my_supplier_private"),
    supabase
      .from("supplier_verification_documents")
      .select("*")
      .eq("supplier_id", supplierId)
      .neq("verification_status", "Replaced")
      .order("expiry_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase.rpc("get_supplier_verification_summary", { p_supplier_id: supplierId }),
    supabase.from("profiles").select("full_name,email,phone,registration_number,onboarding_data").eq("id", supplierId).maybeSingle(),
  ]);

  if (supplierError) throw supplierError;
  if (privateError) throw privateError;
  if (documentsError) throw documentsError;
  if (summaryError) throw summaryError;
  if (profileError) throw profileError;

  const privateFields = (privateRows as Array<Record<string, unknown>> | null)?.[0] ?? {};
  const supplier = {
    ...publicFields,
    address: (privateFields.address as string | null) ?? null,
    verification_comments: (privateFields.verification_comments as string | null) ?? null,
    verification_missing_information: (privateFields.verification_missing_information as string[] | null) ?? [],
    verification_submitted_at: (privateFields.verification_submitted_at as string | null) ?? null,
    verification_reviewed_at: (privateFields.verification_reviewed_at as string | null) ?? null,
  };

  return {
    supplier,
    documents: (documents ?? []) as SupplierVerificationDocument[],
    summary: ((summary?.[0] ?? null) as SupplierVerificationSummary | null),
    profile,
  };
}

export async function submitSupplierVerification() {
  const { data, error } = await supabase.rpc("submit_supplier_verification");
  if (error) throw error;
  return data;
}

export function documentExpiryState(expiryDate?: string | null) {
  if (!expiryDate) return { key: "none" as const, label: "No expiry", days: null as number | null };
  const expiry = new Date(`${expiryDate}T23:59:59`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { key: "expired" as const, label: `Expired ${Math.abs(days)}d ago`, days };
  if (days <= 30) return { key: "critical" as const, label: `Expires in ${days}d`, days };
  if (days <= 90) return { key: "warning" as const, label: `Expires in ${days}d`, days };
  return { key: "valid" as const, label: `Valid to ${new Date(`${expiryDate}T12:00:00`).toLocaleDateString()}`, days };
}
