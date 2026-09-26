import { supabase } from "./supabase";

export interface Supplier {
  id: string;
  company_name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  country?: string | null;
  city?: string | null;
  categories: string[];
  logo_url?: string | null;
  description?: string | null;
  approval_status?: string | null;
  is_active?: boolean;
  business_type?: string | null;
  registration_number?: string | null;
  verification_status?: string | null;
  verification_completion?: number | null;
}

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/*
 * The current suppliers table is the source of company information.
 * Contact/person information lives in profiles, so we deliberately
 * do not use a Supabase nested profiles relationship.
 */
export async function getApprovedSuppliers(): Promise<Supplier[]> {
  const { data: suppliers, error } = await supabase
    .from("suppliers")
    .select(`
      id,
      company_name,
      business_type,
      website,
      registration_number,
      address,
      city,
      supplier_categories,
      verification_status,
      verification_completion
    `)
    .order("company_name", { ascending: true });

  if (error) {
    console.error("GET SUPPLIERS ERROR:", error);
    return [];
  }

  const ids = (suppliers ?? []).map((supplier) => supplier.id);

  let profiles: Array<{
    id: string;
    email: string | null;
    phone: string | null;
    country: string | null;
    full_name: string | null;
  }> = [];

  if (ids.length) {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, phone, country, full_name")
      .in("id", ids);

    if (!profileError) {
      profiles = data ?? [];
    } else {
      console.warn(
        "GET SUPPLIER PROFILES ERROR:",
        profileError
      );
    }
  }

  const profileMap = new Map(
    profiles.map((profile) => [profile.id, profile])
  );

  return (suppliers ?? []).map((supplier) => {
    const profile = profileMap.get(supplier.id);

    return {
      id: supplier.id,
      company_name: supplier.company_name ?? "Unnamed Supplier",
      email: profile?.email ?? null,
      phone: profile?.phone ?? null,
      website: supplier.website ?? null,
      country: profile?.country ?? null,
      city: supplier.city ?? null,
      categories: supplier.supplier_categories ?? [],
      logo_url: null,
      description: null,
      business_type: supplier.business_type ?? null,
      registration_number:
        supplier.registration_number ?? null,
      verification_status: supplier.verification_status ?? "Draft",
      verification_completion: Number(supplier.verification_completion ?? 0),
    };
  });
}

export async function getSupplierById(
  supplierId: string
): Promise<ServiceResult<Supplier>> {
  if (!supplierId) {
    return {
      success: false,
      error: "Supplier ID is required.",
    };
  }

  const { data: supplier, error } = await supabase
    .from("suppliers")
    .select(`
      id,
      company_name,
      business_type,
      website,
      registration_number,
      address,
      city,
      supplier_categories,
      verification_status,
      verification_completion
    `)
    .eq("id", supplierId)
    .maybeSingle();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (!supplier) {
    return {
      success: false,
      error: "Supplier not found.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, phone, country")
    .eq("id", supplierId)
    .maybeSingle();

  return {
    success: true,
    data: {
      id: supplier.id,
      company_name: supplier.company_name ?? "Unnamed Supplier",
      email: profile?.email ?? null,
      phone: profile?.phone ?? null,
      website: supplier.website ?? null,
      country: profile?.country ?? null,
      city: supplier.city ?? null,
      categories: supplier.supplier_categories ?? [],
      logo_url: null,
      description: null,
      business_type: supplier.business_type ?? null,
      registration_number:
        supplier.registration_number ?? null,
      verification_status: supplier.verification_status ?? "Draft",
      verification_completion: Number(supplier.verification_completion ?? 0),
    },
  };
}

export async function searchSuppliers(
  search: string
): Promise<Supplier[]> {
  const suppliers = await getApprovedSuppliers();
  const query = search.trim().toLowerCase();

  if (!query) {
    return suppliers;
  }

  return suppliers.filter((supplier) => {
    return (
      supplier.company_name
        .toLowerCase()
        .includes(query) ||
      supplier.country
        ?.toLowerCase()
        .includes(query) ||
      supplier.city
        ?.toLowerCase()
        .includes(query) ||
      supplier.categories.some((category) =>
        category.toLowerCase().includes(query)
      )
    );
  });
}


export async function getCurrentSupplierBuyerSummary() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { name: "Supplier", verificationStatus: "Draft", rating: null as number | null, reviewCount: 0, city: null as string | null, country: null as string | null };
  const [{ data: supplier }, { data: profile }, { data: reviews }] = await Promise.all([
    supabase.from("suppliers").select("company_name,city,verification_status").eq("id", user.id).maybeSingle(),
    supabase.from("profiles").select("country").eq("id", user.id).maybeSingle(),
    supabase.from("supplier_reviews").select("rating").eq("supplier_id", user.id).eq("is_published", true),
  ]);
  const ratings = (reviews ?? []).map((review) => Number(review.rating)).filter(Number.isFinite);
  return { name: supplier?.company_name || "Supplier", verificationStatus: supplier?.verification_status || "Draft", rating: ratings.length ? ratings.reduce((a,b)=>a+b,0)/ratings.length : null, reviewCount: ratings.length, city: supplier?.city ?? null, country: profile?.country ?? null };
}
