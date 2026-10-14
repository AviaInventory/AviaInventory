// Supplier verification readiness checks. Pure functions shared by the supplier's
// Verification Center and the platform console, so both always agree.

export type VerificationCheckKey = "company" | "contact" | "registration" | "aviation" | "quality" | "documents";

export type VerificationCheck = { key: VerificationCheckKey; label: string; detail: string; complete: boolean };

export type ChecksSupplier = {
  company_name: string | null;
  business_type: string | null;
  address: string | null;
  city: string | null;
};

export type ChecksProfile = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  registration_number: string | null;
} | null;

export type ChecksDocument = { document_type: string; document_name: string; verification_status: string };

const AVIATION_DOCUMENT = /FAA|EASA|Air Operator|Maintenance|AMO|Repair Station|Authorized Release/i;
const QUALITY_DOCUMENT = /quality|ISO|AS9100|AS9110|AS9120/i;
const REGISTRATION_DOCUMENT = /incorporation|business registration|tax registration/i;

export function isAviationDocument(doc: ChecksDocument) {
  return AVIATION_DOCUMENT.test(`${doc.document_type} ${doc.document_name}`);
}

export function isQualityDocument(doc: ChecksDocument) {
  return QUALITY_DOCUMENT.test(`${doc.document_type} ${doc.document_name}`);
}

/** Documents that still count (a replaced version is superseded by its successor). */
function current(documents: ChecksDocument[]) {
  return documents.filter((doc) => doc.verification_status !== "Replaced");
}

export function getVerificationChecks(supplier: ChecksSupplier, profile: ChecksProfile, documents: ChecksDocument[]): VerificationCheck[] {
  const docs = current(documents);
  const aviationDocs = docs.filter(isAviationDocument);
  const qualityDocs = docs.filter(isQualityDocument);
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

  return [
    {
      key: "company",
      label: "Company information",
      detail: "Company name, business type, address and city",
      complete: Boolean(supplier.company_name && supplier.business_type && supplier.address && supplier.city),
    },
    {
      key: "contact",
      label: "Identity & contact",
      detail: "Named contact, email and phone",
      complete: Boolean(profile?.full_name && profile.email && profile.phone),
    },
    {
      key: "registration",
      label: "Business registration",
      detail: "Registration number or registration document",
      complete: Boolean(profile?.registration_number || docs.some((doc) => REGISTRATION_DOCUMENT.test(doc.document_type))),
    },
    {
      key: "aviation",
      label: "Aviation certifications",
      detail: `${plural(aviationDocs.length, "aviation credential")} on file, at least one verified by AviaInventory`,
      complete: aviationDocs.some((doc) => doc.verification_status === "Verified"),
    },
    {
      key: "quality",
      label: "Quality certifications",
      detail: `${plural(qualityDocs.length, "quality credential")} on file, at least one verified by AviaInventory`,
      complete: qualityDocs.some((doc) => doc.verification_status === "Verified"),
    },
    {
      key: "documents",
      label: "Supporting documents",
      detail: `${plural(docs.length, "document")} uploaded`,
      complete: docs.length > 0,
    },
  ];
}

/** Readiness as a whole percentage of checks met. */
export function verificationCompletion(checks: VerificationCheck[]) {
  return Math.round((checks.filter((check) => check.complete).length / checks.length) * 100);
}
