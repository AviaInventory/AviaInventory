import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getVerificationChecks,
  verificationCompletion,
  type VerificationCheck,
} from "@/lib/supplier-verification-checks";

// Platform-console review of supplier verification. Uses the service role: the console
// authenticates with its own admin session (see lib/admin-auth.ts), not a Supabase user.

export const SUPPLIER_DECISION_STATUSES = [
  "Under Review",
  "More Information Required",
  "Verified",
  "Rejected",
  "Suspended",
] as const;
export type SupplierDecisionStatus = (typeof SUPPLIER_DECISION_STATUSES)[number];

export const DOCUMENT_REVIEW_STATUSES = ["Under Review", "Verified", "Rejected", "Expired"] as const;
export type DocumentReviewStatus = (typeof DOCUMENT_REVIEW_STATUSES)[number];

/** Queue order: what needs a reviewer first. */
const QUEUE_ORDER = ["Submitted", "Under Review", "More Information Required", "Draft", "Verified", "Suspended", "Rejected"];

const actor = () => process.env.ADMIN_USERNAME || "AviaInventory platform administrator";

export type SupplierQueueRow = {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  country: string | null;
  verification_status: string;
  verification_completion: number;
  verification_submitted_at: string | null;
  verification_reviewed_at: string | null;
  documents_total: number;
  documents_verified: number;
  documents_awaiting: number;
  documents_expired: number;
  documents_expiring: number;
};

export type SupplierDocument = {
  id: string;
  document_type: string;
  document_name: string;
  issue_date: string | null;
  expiry_date: string | null;
  issuing_authority: string | null;
  verification_status: string;
  version: number;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  reviewed_by_admin: string | null;
  created_at: string;
};

export type ReviewEvent = {
  id: string;
  subject: "document" | "supplier";
  document_id: string | null;
  actor_admin: string;
  from_status: string | null;
  to_status: string;
  comments: string | null;
  created_at: string;
};

function daysUntil(date: string | null) {
  if (!date) return null;
  return Math.floor((new Date(`${date}T00:00:00Z`).getTime() - Date.now()) / 86_400_000);
}

export async function getSupplierVerificationQueue(): Promise<SupplierQueueRow[]> {
  const supabase = createAdminClient();
  const { data: suppliers, error } = await supabase
    .from("suppliers")
    .select("id,company_name,verification_status,verification_completion,verification_submitted_at,verification_reviewed_at");
  if (error) throw error;

  const ids = (suppliers ?? []).map((supplier) => supplier.id);
  if (!ids.length) return [];

  const [{ data: profiles, error: profilesError }, { data: documents, error: documentsError }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,email,country").in("id", ids),
    supabase
      .from("supplier_verification_documents")
      .select("supplier_id,verification_status,expiry_date")
      .in("supplier_id", ids)
      .neq("verification_status", "Replaced"),
  ]);
  if (profilesError) throw profilesError;
  if (documentsError) throw documentsError;

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return (suppliers ?? [])
    .map((supplier) => {
      const docs = (documents ?? []).filter((doc) => doc.supplier_id === supplier.id);
      const profile = profileMap.get(supplier.id);
      return {
        id: supplier.id,
        company_name: supplier.company_name || "Unnamed supplier",
        contact_name: profile?.full_name ?? null,
        email: profile?.email ?? null,
        country: profile?.country ?? null,
        verification_status: supplier.verification_status || "Draft",
        verification_completion: Number(supplier.verification_completion ?? 0),
        verification_submitted_at: supplier.verification_submitted_at,
        verification_reviewed_at: supplier.verification_reviewed_at,
        documents_total: docs.length,
        documents_verified: docs.filter((doc) => doc.verification_status === "Verified").length,
        documents_awaiting: docs.filter((doc) => ["Pending", "Under Review"].includes(doc.verification_status)).length,
        documents_expired: docs.filter((doc) => (daysUntil(doc.expiry_date) ?? 1) < 0).length,
        documents_expiring: docs.filter((doc) => {
          const days = daysUntil(doc.expiry_date);
          return days !== null && days >= 0 && days <= 30;
        }).length,
      };
    })
    .sort((a, b) => {
      const byStatus = QUEUE_ORDER.indexOf(a.verification_status) - QUEUE_ORDER.indexOf(b.verification_status);
      if (byStatus) return byStatus;
      // Oldest submission first, so nobody waits longest.
      return (a.verification_submitted_at ?? "9999").localeCompare(b.verification_submitted_at ?? "9999");
    });
}

export async function getSupplierVerificationDetail(supplierId: string) {
  const supabase = createAdminClient();
  const [supplierResult, profileResult, documentsResult, eventsResult] = await Promise.all([
    supabase
      .from("suppliers")
      .select("id,company_name,business_type,website,address,city,registration_number,supplier_categories,verification_status,verification_completion,verification_comments,verification_missing_information,verification_submitted_at,verification_reviewed_at,created_at")
      .eq("id", supplierId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name,email,phone,country,job_title,registration_number,created_at")
      .eq("id", supplierId)
      .maybeSingle(),
    supabase
      .from("supplier_verification_documents")
      .select("id,document_type,document_name,issue_date,expiry_date,issuing_authority,verification_status,version,reviewer_notes,reviewed_at,reviewed_by_admin,created_at")
      .eq("supplier_id", supplierId)
      .neq("verification_status", "Replaced")
      .order("created_at", { ascending: false }),
    supabase
      .from("supplier_verification_review_events")
      .select("id,subject,document_id,actor_admin,from_status,to_status,comments,created_at")
      .eq("supplier_id", supplierId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  for (const result of [supplierResult, profileResult, documentsResult, eventsResult]) {
    if (result.error) throw result.error;
  }
  if (!supplierResult.data) return null;

  const supplier = supplierResult.data;
  const profile = profileResult.data;
  const documents = (documentsResult.data ?? []) as SupplierDocument[];
  const checks: VerificationCheck[] = getVerificationChecks(supplier, profile, documents);

  return {
    supplier,
    profile,
    documents,
    events: (eventsResult.data ?? []) as ReviewEvent[],
    checks,
    completion: verificationCompletion(checks),
  };
}

/** Keeps the supplier's readiness % in step with the shared checklist after any review. */
async function refreshCompletion(supplierId: string) {
  const detail = await getSupplierVerificationDetail(supplierId);
  if (!detail) return;
  const { error } = await createAdminClient()
    .from("suppliers")
    .update({ verification_completion: detail.completion })
    .eq("id", supplierId);
  if (error) throw error;
}

export async function reviewSupplierDocument(input: { documentId: string; status: string; notes?: string | null }) {
  if (!(DOCUMENT_REVIEW_STATUSES as readonly string[]).includes(input.status)) throw new Error("Choose a valid document decision.");
  const notes = input.notes?.trim() || null;
  if (input.status === "Rejected" && !notes) throw new Error("Add a note explaining why the document was rejected; the supplier will see it.");

  const supabase = createAdminClient();
  const { data: before, error: beforeError } = await supabase
    .from("supplier_verification_documents")
    .select("id,supplier_id,verification_status")
    .eq("id", input.documentId)
    .single();
  if (beforeError) throw beforeError;
  if (before.verification_status === "Replaced") throw new Error("This document was replaced by a newer version. Review the newer version instead.");

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("supplier_verification_documents")
    .update({ verification_status: input.status, reviewer_notes: notes, reviewed_at: now, reviewed_by_admin: actor(), reviewed_by: null })
    .eq("id", input.documentId);
  if (error) throw error;

  const { error: eventError } = await supabase.from("supplier_verification_review_events").insert({
    supplier_id: before.supplier_id,
    document_id: input.documentId,
    subject: "document",
    actor_admin: actor(),
    from_status: before.verification_status,
    to_status: input.status,
    comments: notes,
  });
  if (eventError) throw eventError;

  await refreshCompletion(before.supplier_id);
}

export async function decideSupplierVerification(input: {
  supplierId: string;
  status: string;
  comments?: string | null;
  missingInformation?: string[];
}) {
  if (!(SUPPLIER_DECISION_STATUSES as readonly string[]).includes(input.status)) throw new Error("Choose a valid verification decision.");
  const status = input.status as SupplierDecisionStatus;
  const comments = input.comments?.trim() || null;
  const missing = (input.missingInformation ?? []).map((item) => item.trim()).filter(Boolean);

  if ((status === "Rejected" || status === "Suspended") && !comments) {
    throw new Error(`Add a comment explaining why the supplier is ${status.toLowerCase()}; the supplier will see it.`);
  }
  if (status === "More Information Required" && !missing.length && !comments) {
    throw new Error("List what the supplier still needs to provide.");
  }

  const detail = await getSupplierVerificationDetail(input.supplierId);
  if (!detail) throw new Error("Supplier not found.");
  if (status === "Verified" && !detail.documents.some((doc) => doc.verification_status === "Verified")) {
    throw new Error("Verify at least one of the supplier's documents before marking the supplier Verified.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("suppliers")
    .update({
      verification_status: status,
      verification_comments: comments,
      verification_missing_information: status === "More Information Required" ? missing : [],
      verification_reviewed_at: new Date().toISOString(),
      verification_completion: detail.completion,
    })
    .eq("id", input.supplierId);
  if (error) throw error;

  const { error: eventError } = await supabase.from("supplier_verification_review_events").insert({
    supplier_id: input.supplierId,
    subject: "supplier",
    actor_admin: actor(),
    from_status: detail.supplier.verification_status,
    to_status: status,
    comments: [comments, missing.length ? `Missing: ${missing.join("; ")}` : null].filter(Boolean).join("\n") || null,
  });
  if (eventError) throw eventError;
}

/** Short-lived link to a document in the private verification bucket. */
export async function getSupplierDocumentFileUrl(documentId: string) {
  const supabase = createAdminClient();
  const { data: doc, error } = await supabase
    .from("supplier_verification_documents")
    .select("storage_path")
    .eq("id", documentId)
    .single();
  if (error) throw error;

  const { data, error: signedError } = await supabase.storage
    .from("supplier-verification-documents")
    .createSignedUrl(doc.storage_path, 300);
  if (signedError) throw signedError;
  return data.signedUrl;
}
