import { getPublicSupabase } from "@/lib/marketplace-server";

export interface CategoryListingCount {
  category: string;
  count: number;
}

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

const fallbackCategories = [
  "Airframes",
  "Engines",
  "Avionics",
  "Components",
  "Landing Gear",
  "Consumables",
  "Electrical",
  "Safety Equipment",
];

export async function getHomepageCategoryCounts(): Promise<CategoryListingCount[]> {
  try {
    const supabase = getPublicSupabase();
    const { data, error } = await supabase.rpc("get_public_category_listing_counts");
    if (error) throw error;

    const map = new Map<string, number>(
      (data ?? []).map((row: { category: string | null; listing_count: number | string | null }) => [
        row.category ?? "",
        Number(row.listing_count ?? 0),
      ]),
    );

    return fallbackCategories.map((category) => ({ category, count: map.get(category) ?? 0 }));
  } catch (error) {
    console.error("GET HOMEPAGE CATEGORY COUNTS ERROR:",{message:error instanceof Error?error.message:"Unknown error",details:(error as any)?.details,hint:(error as any)?.hint,code:(error as any)?.code});
    return fallbackCategories.map((category) => ({ category, count: 0 }));
  }
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
      company_name: row.company_name || "Verified Supplier",
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

export async function getPublicSupplierProfile(supplierId: string) {
  const supabase = getPublicSupabase();

  const [{ data: supplier, error: supplierError }, { data: reviews, error: reviewError }] = await Promise.all([
    supabase
      .from("suppliers")
      .select("id,company_name,business_type,website,address,city,supplier_categories,verification_status,verification_completion")
      .eq("id", supplierId)
      .maybeSingle(),
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
    supplier,
    reviews: normalizedReviews,
    rating,
    reviewCount: normalizedReviews.length,
    listingCount: listingCount ?? 0,
  };
}
