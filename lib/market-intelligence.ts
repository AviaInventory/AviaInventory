import type { SupabaseClient } from "@supabase/supabase-js";

/** Shape returned by get_market_intelligence() (see the 20261107000200 migration). */
export type MarketIntelligence = {
  period_days: number;
  generated_at: string;
  /** Companies needed before a price, country or buyer count is shown. */
  min_companies: number;
  summary: {
    rfqs: number;
    rfqs_previous: number;
    parts_rfqs: number;
    mro_rfqs: number;
    buyers: number | null;
    median_first_quote_hours: number | null;
    quotes: number;
    quotes_per_rfq: number | null;
  };
  top_parts: { part_number: string; category: string | null; rfqs: number; quantity: number | null; buyers: number | null; includes_mro: boolean }[];
  categories: { category: string; rfqs: number; rfqs_previous: number }[];
  countries: { country: string; rfqs: number; other: boolean }[];
  price_ranges: { part_number: string; currency: string; suppliers: number; quotes: number; low: number; median: number; high: number }[];
  mro_demand: { category: string; rfqs: number }[];
  my_performance: {
    rfqs_available: number;
    rfqs_quoted: number;
    quotes: number;
    quotes_won: number;
    median_response_hours: number | null;
    market_median_response_hours: number | null;
    price_vs_median_pct: number | null;
    price_compared_quotes: number;
  };
  opportunities: { id: string; part_number: string | null; category: string | null; quantity: number | null; required_date: string | null; rfq_type: string; created_at: string; matches_category: boolean; quotes: number }[];
};

export type MarketReport = { id: string; title: string; summary: string | null; category: string | null; file_name: string; file_size: number | null; published_at: string };

export const INTELLIGENCE_PERIODS = [30, 90, 180, 365] as const;
export const REPORTS_BUCKET = "market-intelligence-reports";

export function parsePeriod(value: string | undefined): number {
  const days = Number(value);
  return (INTELLIGENCE_PERIODS as readonly number[]).includes(days) ? days : 90;
}

export async function getMarketIntelligence(client: SupabaseClient, days: number): Promise<{ data: MarketIntelligence | null; error: string | null }> {
  const { data, error } = await client.rpc("get_market_intelligence", { p_days: days });
  if (error) {
    console.error("MARKET INTELLIGENCE ERROR:", error.message);
    return { data: null, error: error.message };
  }
  return { data: data as MarketIntelligence, error: null };
}

export async function getPublishedReports(client: SupabaseClient): Promise<MarketReport[]> {
  const { data, error } = await client
    .from("market_intelligence_reports")
    .select("id, title, summary, category, file_name, file_size, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("MARKET REPORTS ERROR:", error.message);
    return [];
  }
  return (data ?? []) as MarketReport[];
}

/** "3.5 h", "2 days" */
export function formatHours(hours: number | null | undefined): string {
  if (hours == null) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${Number(hours.toFixed(1)).toLocaleString()} h`;
  return `${Math.round(hours / 24)} days`;
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
