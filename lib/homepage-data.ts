import { getPublicSupabase } from "@/lib/marketplace-server";

export interface SupplierSummary {
  id: string;
  company_name: string;
  country: string | null;
  city: string | null;
  listings: number;
  rating: number | null;
  review_count: number;
  logo_url: string | null;
  tone: "primary" | "accent" | "dark";
  verification_status: string;
}

export async function getHomepageSupplierSummaries(limit = 3): Promise<SupplierSummary[]> {
  try {
    const supabase = getPublicSupabase();
    const { data, error } = await supabase.rpc("get_public_supplier_summaries", { result_limit: limit });
    if (error) throw error;

    return (data ?? []).map((row: {
      id: string;
      company_name: string | null;
      country: string | null;
      city: string | null;
      listing_count: number | string | null;
      average_rating: number | string | null;
      review_count: number | string | null;
      logo_url: string | null;
      verification_status?: string | null;
    }, index: number) => ({
      id: row.id,
      company_name: row.company_name || "Supplier",
      country: row.country,
      city: row.city,
      listings: Number(row.listing_count ?? 0),
      rating: row.average_rating == null ? null : Number(row.average_rating),
      review_count: Number(row.review_count ?? 0),
      logo_url: row.logo_url ?? null,
      tone: (["primary", "accent", "dark"] as const)[index % 3],
      verification_status: row.verification_status || "Draft",
    }));
  } catch (error) {
    console.error("GET HOMEPAGE SUPPLIER SUMMARIES ERROR:",{message:error instanceof Error?error.message:"Unknown error",details:(error as any)?.details,hint:(error as any)?.hint,code:(error as any)?.code});
    return [];
  }
}

export interface SupplierReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  reviewer_name: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getPublicSupplierProfile(supplierId: string) {
  // Anything that isn't a UUID would make Postgres raise 22P02 instead of "not found".
  if (!UUID_PATTERN.test(supplierId)) return null;

  const supabase = getPublicSupabase();

  // Country lives on profiles, not suppliers (selecting suppliers.country caused a 500).
  const [{ data: supplier, error: supplierError }, { data: owner }, { data: reviews, error: reviewError }] = await Promise.all([
    supabase
      .from("suppliers")
      .select("id,business_type,city,supplier_categories,verification_status,verification_completion,mro_capable")
      .eq("id", supplierId)
      .maybeSingle(),
    supabase.from("profiles").select("country").eq("id", supplierId).maybeSingle(),
    supabase
      .from("supplier_reviews")
      .select("id,rating,title,comment,created_at,reviewer_id")
      .eq("supplier_id", supplierId)
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
  ]);

  if (supplierError) throw supplierError;
  if (reviewError) throw reviewError;
  if (!supplier) return null;

  const reviewerIds = [...new Set((reviews ?? []).map((review) => review.reviewer_id).filter(Boolean))];
  const { data: profiles } = reviewerIds.length
    ? await supabase.from("profiles").select("id,full_name").in("id", reviewerIds)
    : { data: [] as Array<{ id: string; full_name: string | null }> };
  const reviewerMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));

  const normalizedReviews: SupplierReview[] = (reviews ?? []).map((review) => ({
    id: review.id,
    rating: Number(review.rating),
    title: review.title,
    comment: review.comment,
    created_at: review.created_at,
    reviewer_name: reviewerMap.get(review.reviewer_id) || "Verified Buyer",
  }));

  const rating = normalizedReviews.length
    ? normalizedReviews.reduce((sum, review) => sum + review.rating, 0) / normalizedReviews.length
    : null;

  const { count: listingCount } = await supabase
    .from("parts")
    .select("id", { count: "exact", head: true })
    .eq("supplier_id", supplierId)
    .eq("status", "Published");

  return {
    supplier: { ...supplier, country: (owner?.country as string | null) ?? null, mro_capable: Boolean(supplier.mro_capable) },
    reviews: normalizedReviews,
    rating,
    reviewCount: normalizedReviews.length,
    listingCount: listingCount ?? 0,
  };
}

/* ---------------------------------------------------------------------------
   Homepage promotions and the supplier / MRO directory
--------------------------------------------------------------------------- */

export interface DirectorySupplier extends SupplierSummary {
  business_type: string | null;
  mro_capable: boolean;
  promoted: boolean;
}

/**
 * True when PostgREST reports the RPC doesn't exist (PGRST202): the database has not had the
 * 20261024000100_rfq_types_expiry_mro migration yet. That is an expected state during rollout,
 * so callers fall back quietly instead of logging an error on every page view.
 */
function isMissingFunction(error: unknown) {
  return (error as { code?: string } | null)?.code === "PGRST202";
}

/** Supplier cards ordered promoted first; `mroOnly` lists MRO-capable suppliers only. */
export async function getSupplierDirectory(limit = 24, mroOnly = false): Promise<DirectorySupplier[]> {
  try {
    const supabase = getPublicSupabase();
    const { data, error } = await supabase.rpc("get_public_supplier_directory", { result_limit: limit, mro_only: mroOnly });
    if (error) throw error;
    return (data ?? []).map((row: {
      id: string; company_name: string | null; country: string | null; city: string | null;
      listing_count: number | string | null; average_rating: number | string | null; review_count: number | string | null;
      logo_url: string | null; verification_status: string | null; business_type: string | null;
      mro_capable: boolean | null; promoted: boolean | null;
    }, index: number) => ({
      id: row.id,
      company_name: row.company_name || "Supplier",
      country: row.country,
      city: row.city,
      listings: Number(row.listing_count ?? 0),
      rating: row.average_rating == null ? null : Number(row.average_rating),
      review_count: Number(row.review_count ?? 0),
      logo_url: row.logo_url ?? null,
      tone: (["primary", "accent", "dark"] as const)[index % 3],
      verification_status: row.verification_status || "Draft",
      business_type: row.business_type,
      mro_capable: Boolean(row.mro_capable),
      promoted: Boolean(row.promoted),
    }));
  } catch (error) {
    const info = error as { message?: string; details?: string; hint?: string; code?: string } | null;
    if (!isMissingFunction(error)) {
      console.error("GET SUPPLIER DIRECTORY ERROR:", { message: info?.message ?? "Unknown error", details: info?.details, hint: info?.hint, code: info?.code });
    }
    // Before the directory RPC exists, fall back to the plain supplier list (no MRO data).
    if (mroOnly) return [];
    const suppliers = await getHomepageSupplierSummaries(limit);
    return suppliers.map((supplier) => ({ ...supplier, business_type: null, mro_capable: false, promoted: false }));
  }
}

export interface PromotedListing {
  id: string;
  part_number: string;
  description: string | null;
  manufacturer: string | null;
  category: string | null;
  condition: string | null;
  image_urls: string[] | null;
  currency: string | null;
  price_type: string | null;
  price_basis: string | null;
  supplier_id: string;
  promoted: boolean;
}

/**
 * Promoted parts / services for the homepage; newest listings when nothing is promoted.
 * No price or supplier name: visitors cannot read them, and signed-in users get them
 * from <PartPrice> / <SupplierName>.
 */
export async function getPromotedListings(limit = 8): Promise<PromotedListing[]> {
  const supabase = getPublicSupabase();
  const columns = "id,part_number,description,manufacturer,category,condition,image_urls,currency,price_type,price_basis,supplier_id,created_at";
  try {
    let promotedIds: string[] = [];
    const { data: promoted, error: promotedError } = await supabase.rpc("get_public_promoted_listings", { result_limit: limit });
    if (promotedError && !isMissingFunction(promotedError)) console.error("GET PROMOTED LISTINGS ERROR:", promotedError.message);
    else promotedIds = (promoted ?? []).map((row: { part_id: string }) => row.part_id);

    const rows: Array<Record<string, unknown>> = [];
    if (promotedIds.length) {
      const { data } = await supabase.from("parts").select(columns).in("id", promotedIds).eq("status", "Published");
      const byId = new Map((data ?? []).map((part) => [part.id, part]));
      for (const id of promotedIds) if (byId.has(id)) rows.push({ ...byId.get(id)!, promoted: true });
    }
    if (rows.length < limit) {
      const { data } = await supabase.from("parts").select(columns).eq("status", "Published").order("created_at", { ascending: false }).limit(limit + rows.length);
      for (const part of data ?? []) {
        if (rows.length >= limit) break;
        if (!promotedIds.includes(part.id)) rows.push({ ...part, promoted: false });
      }
    }

    return rows as unknown as PromotedListing[];
  } catch (error) {
    console.error("GET HOMEPAGE PROMOTED LISTINGS ERROR:",{message:error instanceof Error?error.message:"Unknown error"});
    return [];
  }
}
