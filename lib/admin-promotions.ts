import "server-only";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/*
 * Platform console: homepage promotions.
 * - Listing promotions live in featured_listings (Active / Approved rows inside their
 *   window are shown by get_public_promoted_listings).
 * - Suppliers / MROs are featured with suppliers.featured; suppliers.mro_capable puts them
 *   on the MRO Services page. Both are admin-only flags written with the service role.
 * The homepage and MRO Services page are ISR, so every change revalidates them.
 */

export const DEFAULT_PROMOTION_DAYS = 30;

export interface PromotionRequestRow {
  id: string;
  listing_id: string;
  supplier_id: string;
  part_number: string;
  description: string | null;
  supplier_name: string;
  requested_at: string;
}

export interface PromotableListingRow {
  id: string;
  part_number: string;
  description: string | null;
  manufacturer: string | null;
  supplier_id: string;
  supplier_name: string;
  created_at: string;
  promotion: { id: string; status: string; starts_at: string | null; ends_at: string | null } | null;
  /** True when the promotion is Active / Approved and inside its window. */
  promoted: boolean;
}

export interface AdminSupplierRow {
  id: string;
  company_name: string;
  business_type: string | null;
  verification_status: string;
  listing_count: number;
  featured: boolean;
  mro_capable: boolean;
}

export interface AdminPromotionsSnapshot {
  requests: PromotionRequestRow[];
  listings: PromotableListingRow[];
  suppliers: AdminSupplierRow[];
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertId(value: unknown, label: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) throw new Error(`A valid ${label} is required.`);
  return value;
}

function isLive(promotion: { status: string; starts_at: string | null; ends_at: string | null } | null, now = Date.now()) {
  if (!promotion || !["Active", "Approved"].includes(promotion.status)) return false;
  if (promotion.starts_at && new Date(promotion.starts_at).getTime() > now) return false;
  if (promotion.ends_at && new Date(promotion.ends_at).getTime() <= now) return false;
  return true;
}

/** End date for a promotion: the admin's date (end of that day, UTC) or the default length. */
function resolveEndsAt(endDate: unknown): string {
  if (typeof endDate === "string" && endDate.trim()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) throw new Error("Enter the end date as YYYY-MM-DD.");
    const ends = new Date(`${endDate}T23:59:59.000Z`);
    if (Number.isNaN(ends.getTime())) throw new Error("Enter a valid end date.");
    if (ends.getTime() <= Date.now()) throw new Error("The end date must be in the future.");
    return ends.toISOString();
  }
  return new Date(Date.now() + DEFAULT_PROMOTION_DAYS * 86_400_000).toISOString();
}

function revalidatePublicPages() {
  revalidatePath("/");
  revalidatePath("/suppliers");
}

export async function getAdminPromotionsSnapshot(): Promise<AdminPromotionsSnapshot> {
  const supabase = createAdminClient();

  const [{ data: promotions, error: promotionError }, { data: parts, error: partsError }, { data: suppliers, error: supplierError }] = await Promise.all([
    supabase.from("featured_listings").select("id,listing_id,supplier_id,status,starts_at,ends_at,created_at").order("created_at", { ascending: false }),
    supabase.from("parts").select("id,part_number,description,manufacturer,supplier_id,created_at,status").eq("status", "Published").order("created_at", { ascending: false }).limit(1000),
    // "*": featured arrives with a later migration; reading it by name would fail before then.
    supabase.from("suppliers").select("*").order("company_name", { ascending: true }),
  ]);
  if (promotionError) throw promotionError;
  if (partsError) throw partsError;
  if (supplierError) throw supplierError;

  const supplierNames = new Map((suppliers ?? []).map((row) => [row.id as string, (row.company_name as string | null) || "Supplier"]));
  const listingCounts = new Map<string, number>();
  for (const part of parts ?? []) listingCounts.set(part.supplier_id, (listingCounts.get(part.supplier_id) ?? 0) + 1);
  const promotionByListing = new Map((promotions ?? []).map((row) => [row.listing_id as string, row]));

  // Requested listings may not be in the published list (e.g. unpublished since); look them up.
  const requestRows = (promotions ?? []).filter((row) => row.status === "Submitted");
  const partById = new Map((parts ?? []).map((part) => [part.id as string, part]));
  const missingIds = requestRows.map((row) => row.listing_id).filter((id) => !partById.has(id));
  if (missingIds.length) {
    const { data: extra } = await supabase.from("parts").select("id,part_number,description,manufacturer,supplier_id,created_at,status").in("id", missingIds);
    for (const part of extra ?? []) partById.set(part.id, part);
  }

  const requests: PromotionRequestRow[] = requestRows.map((row) => {
    const part = partById.get(row.listing_id);
    return {
      id: row.id,
      listing_id: row.listing_id,
      supplier_id: row.supplier_id,
      part_number: part?.part_number ?? "Listing removed",
      description: part?.description ?? null,
      supplier_name: supplierNames.get(row.supplier_id) ?? "Supplier",
      requested_at: row.created_at,
    };
  });

  const listings: PromotableListingRow[] = (parts ?? []).map((part) => {
    const promotion = promotionByListing.get(part.id) ?? null;
    return {
      id: part.id,
      part_number: part.part_number,
      description: part.description,
      manufacturer: part.manufacturer,
      supplier_id: part.supplier_id,
      supplier_name: supplierNames.get(part.supplier_id) ?? "Supplier",
      created_at: part.created_at,
      promotion: promotion ? { id: promotion.id, status: promotion.status, starts_at: promotion.starts_at, ends_at: promotion.ends_at } : null,
      promoted: isLive(promotion ? { status: promotion.status, starts_at: promotion.starts_at, ends_at: promotion.ends_at } : null),
    };
  });
  // Live promotions first (soonest to end first), then the newest listings.
  listings.sort((a, b) => Number(b.promoted) - Number(a.promoted)
    || (a.promoted && b.promoted ? new Date(a.promotion?.ends_at ?? "9999").getTime() - new Date(b.promotion?.ends_at ?? "9999").getTime() : 0)
    || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const supplierRows: AdminSupplierRow[] = (suppliers ?? []).map((row) => ({
    id: row.id,
    company_name: (row.company_name as string | null) || "Supplier",
    business_type: (row.business_type as string | null) ?? null,
    verification_status: (row.verification_status as string | null) || "Draft",
    listing_count: listingCounts.get(row.id) ?? 0,
    featured: Boolean(row.featured),
    mro_capable: Boolean(row.mro_capable),
  }));

  return { requests, listings, suppliers: supplierRows };
}

/** Approve (status Active from now) or decline (stored as 'Rejected', shown as "Declined") a supplier's request. */
export async function decidePromotionRequest(input: { id: unknown; decision: unknown; endDate?: unknown }) {
  const id = assertId(input.id, "promotion request");
  if (input.decision !== "approve" && input.decision !== "decline") throw new Error("Choose approve or decline.");
  const supabase = createAdminClient();

  const { data: request, error: loadError } = await supabase.from("featured_listings").select("id,status").eq("id", id).maybeSingle();
  if (loadError) throw loadError;
  if (!request) throw new Error("Promotion request not found.");
  if (request.status !== "Submitted") throw new Error("This request has already been decided.");

  const now = new Date().toISOString();
  const patch = input.decision === "approve"
    ? { status: "Active", starts_at: now, ends_at: resolveEndsAt(input.endDate), updated_at: now }
    : { status: "Rejected", updated_at: now };
  const { error } = await supabase.from("featured_listings").update(patch).eq("id", id);
  if (error) throw error;
  revalidatePublicPages();
}

/** Start or stop promoting a published listing on the homepage. */
export async function setListingPromotion(input: { listingId: unknown; promote: unknown; endDate?: unknown }) {
  const listingId = assertId(input.listingId, "listing");
  if (typeof input.promote !== "boolean") throw new Error("Choose whether to promote the listing.");
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  if (input.promote) {
    const { data: part, error: partError } = await supabase.from("parts").select("id,supplier_id,status").eq("id", listingId).maybeSingle();
    if (partError) throw partError;
    if (!part || part.status !== "Published") throw new Error("Only published listings can be promoted.");

    // listing_id is unique: one promotion row per listing, reused when promoted again.
    const { error } = await supabase.from("featured_listings").upsert(
      { supplier_id: part.supplier_id, listing_id: listingId, status: "Active", starts_at: now, ends_at: resolveEndsAt(input.endDate), priority: 10, updated_at: now },
      { onConflict: "listing_id" },
    );
    if (error) throw error;
  } else {
    const { error } = await supabase.from("featured_listings")
      .update({ status: "Expired", ends_at: now, updated_at: now })
      .eq("listing_id", listingId)
      .in("status", ["Active", "Approved"]);
    if (error) throw error;
  }
  revalidatePublicPages();
}

/** Toggle a supplier's homepage feature or MRO capability. */
export async function setSupplierFlag(input: { supplierId: unknown; flag: unknown; value: unknown }) {
  const supplierId = assertId(input.supplierId, "supplier");
  if (input.flag !== "featured" && input.flag !== "mro_capable") throw new Error("Unknown supplier setting.");
  if (typeof input.value !== "boolean") throw new Error("Choose on or off.");
  const supabase = createAdminClient();

  const { data, error } = await supabase.from("suppliers").update({ [input.flag]: input.value }).eq("id", supplierId).select("id").maybeSingle();
  if (error) {
    if (error.code === "PGRST204" || error.code === "42703") throw new Error("Apply the latest database migration before using this setting.");
    throw error;
  }
  if (!data) throw new Error("Supplier not found.");
  revalidatePublicPages();
}
