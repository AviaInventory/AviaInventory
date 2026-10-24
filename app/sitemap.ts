import type { MetadataRoute } from "next";
import { getPublicSupabase } from "@/lib/marketplace-server";

export const SITE_URL = "https://www.aviainventory.com";

// Regenerated hourly so new listings and suppliers reach search engines.
export const revalidate = 3600;

const STATIC_PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/marketplace", priority: 0.9, changeFrequency: "daily" },
  { path: "/suppliers", priority: 0.8, changeFrequency: "daily" },
  { path: "/pricing", priority: 0.7, changeFrequency: "monthly" },
  { path: "/book-demo", priority: 0.6, changeFrequency: "monthly" },
  { path: "/register", priority: 0.6, changeFrequency: "monthly" },
  { path: "/rfqs", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.1, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  try {
    const supabase = getPublicSupabase();
    const [{ data: parts }, { data: suppliers }] = await Promise.all([
      supabase.from("parts").select("id, updated_at").eq("status", "Published").limit(5000),
      supabase.rpc("get_public_supplier_summaries", { result_limit: 1000 }),
    ]);

    for (const part of parts ?? []) {
      entries.push({ url: `${SITE_URL}/marketplace/${part.id}`, lastModified: part.updated_at ?? undefined, changeFrequency: "weekly", priority: 0.7 });
    }
    for (const supplier of (suppliers ?? []) as { id: string }[]) {
      entries.push({ url: `${SITE_URL}/suppliers/${supplier.id}`, changeFrequency: "weekly", priority: 0.6 });
    }
  } catch (error) {
    // The static pages are still listed if the database is unreachable.
    console.error("SITEMAP DATA ERROR:", error instanceof Error ? error.message : error);
  }

  return entries;
}
