import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type RfqFact = { id: string; buyer_id: string; rfq_type: string; status: string; created_at: string; quantity: number | null; part_number: string | null; part_key: string; category: string | null; category_key: string; country: string | null; first_quote_at: string | null };
type QuoteFact = { supplier_id: string; unit_price: number | string | null; currency: string; status: string; created_at: string; part_number: string | null; part_key: string; response_hours: number | string | null };

const cell = (value: unknown) => {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const round = (value: number | null, digits = 2) => (value == null ? null : Number(value.toFixed(digits)));
const titleCase = (text: string) => text.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());

/** Most common original spelling for a grouped value. */
function mostCommon(values: (string | null)[]): string {
  const counts = new Map<string, number>();
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

function groupBy<T>(rows: T[], key: (row: T) => string) {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(row);
  }
  return groups;
}

/**
 * Market intelligence for the platform team, as CSV. Unlike the supplier page, figures are
 * not hidden below 3 companies (admins see the whole marketplace); companies are still not
 * named. Covers the last `days` days, compared with the period before.
 */
export async function buildMarketIntelligenceCsv(days: number): Promise<string> {
  const admin = createAdminClient();
  const now = Date.now();
  const from = new Date(now - days * 86_400_000);
  const prev = new Date(now - 2 * days * 86_400_000);

  const [rfqResult, quoteResult, reportResult] = await Promise.all([
    admin.from("market_rfq_facts").select("id,buyer_id,rfq_type,status,created_at,quantity,part_number,part_key,category,category_key,country,first_quote_at").gte("created_at", prev.toISOString()).limit(50000),
    admin.from("market_quote_facts").select("supplier_id,unit_price,currency,status,created_at,part_number,part_key,response_hours").gte("created_at", from.toISOString()).limit(50000),
    admin.from("market_intelligence_reports").select("title,category,file_name,file_size,published,published_at").order("published_at", { ascending: false }),
  ]);
  if (rfqResult.error) throw new Error(rfqResult.error.message);
  if (quoteResult.error) throw new Error(quoteResult.error.message);

  const allRfqs = (rfqResult.data ?? []) as RfqFact[];
  const rfqs = allRfqs.filter((r) => new Date(r.created_at) >= from);
  const previous = allRfqs.filter((r) => new Date(r.created_at) < from);
  const quotes = (quoteResult.data ?? []) as QuoteFact[];

  const lines: string[] = [];
  const section = (title: string, header: string[], rows: unknown[][]) => {
    lines.push(cell(title), header.map(cell).join(","));
    if (rows.length) lines.push(...rows.map((row) => row.map(cell).join(",")));
    else lines.push(cell("No data in this period"));
    lines.push("");
  };

  lines.push(cell(`AviaInventory market intelligence (platform export) — last ${days} days, ${from.toISOString().slice(0, 10)} to ${new Date(now).toISOString().slice(0, 10)}`), "");

  const firstQuoteHours = rfqs.filter((r) => r.first_quote_at).map((r) => (new Date(r.first_quote_at!).getTime() - new Date(r.created_at).getTime()) / 3_600_000);
  const responseHours = quotes.map((q) => Number(q.response_hours)).filter((h) => Number.isFinite(h));
  section("Summary", ["Measure", "This period", "Previous period"], [
    ["RFQs", rfqs.length, previous.length],
    ["Parts RFQs", rfqs.filter((r) => r.rfq_type !== "mro").length, previous.filter((r) => r.rfq_type !== "mro").length],
    ["MRO service RFQs", rfqs.filter((r) => r.rfq_type === "mro").length, previous.filter((r) => r.rfq_type === "mro").length],
    ["Buyers sending RFQs", new Set(rfqs.map((r) => r.buyer_id)).size, new Set(previous.map((r) => r.buyer_id)).size],
    ["Quotes", quotes.length, ""],
    ["Suppliers quoting", new Set(quotes.map((q) => q.supplier_id)).size, ""],
    ["Quotes accepted", quotes.filter((q) => q.status === "Accepted").length, ""],
    ["Quotes per RFQ", rfqs.length ? round(quotes.length / rfqs.length, 1) : "", ""],
    ["Median hours to first quote", round(median(firstQuoteHours), 1), ""],
    ["Median quote response hours", round(median(responseHours), 1), ""],
  ]);

  const byPart = groupBy(rfqs.filter((r) => r.part_key), (r) => r.part_key);
  section("Part number demand", ["Part number", "Category", "RFQs", "Quantity requested", "Buyers", "MRO RFQs"],
    [...byPart.values()]
      .map((rows) => [mostCommon(rows.map((r) => r.part_number?.toUpperCase() ?? null)), mostCommon(rows.map((r) => r.category)), rows.length, rows.reduce((sum, r) => sum + (r.quantity ?? 0), 0), new Set(rows.map((r) => r.buyer_id)).size, rows.filter((r) => r.rfq_type === "mro").length] as const)
      .sort((a, b) => b[2] - a[2] || b[3] - a[3])
      .map((row) => [...row]));

  const categoryKeys = new Set(allRfqs.map((r) => r.category_key).filter(Boolean));
  section("Demand by category", ["Category", "RFQs", "RFQs previous period", "Change %"],
    [...categoryKeys]
      .map((key) => {
        const now = rfqs.filter((r) => r.category_key === key);
        const before = previous.filter((r) => r.category_key === key);
        const name = titleCase(mostCommon([...now, ...before].map((r) => r.category)));
        return [name, now.length, before.length, before.length ? Math.round(((now.length - before.length) / before.length) * 100) : ""] as const;
      })
      .sort((a, b) => b[1] - a[1])
      .map((row) => [...row]));

  section("Demand by buyer country", ["Country", "RFQs", "Buyers"],
    [...groupBy(rfqs, (r) => r.country ?? "Not stated").entries()]
      .map(([country, rows]) => [country, rows.length, new Set(rows.map((r) => r.buyer_id)).size])
      .sort((a, b) => (b[1] as number) - (a[1] as number)));

  section("Repair / overhaul demand", ["Category", "RFQs"],
    [...groupBy(rfqs.filter((r) => r.rfq_type === "mro"), (r) => r.category_key || "-").values()]
      .map((rows) => [titleCase(mostCommon(rows.map((r) => r.category))) || "Not stated", rows.length])
      .sort((a, b) => (b[1] as number) - (a[1] as number)));

  section("Quoted prices", ["Part number", "Currency", "Suppliers", "Quotes", "Low", "Median", "High", "Accepted quotes"],
    [...groupBy(quotes.filter((q) => q.part_key && Number(q.unit_price) > 0), (q) => `${q.part_key}|${q.currency}`).values()]
      .map((rows) => {
        const prices = rows.map((q) => Number(q.unit_price));
        return [mostCommon(rows.map((q) => q.part_number?.toUpperCase() ?? null)), rows[0].currency, new Set(rows.map((q) => q.supplier_id)).size, rows.length, round(Math.min(...prices)), round(median(prices)), round(Math.max(...prices)), rows.filter((q) => q.status === "Accepted").length];
      })
      .sort((a, b) => (b[3] as number) - (a[3] as number)));

  section("Market reports", ["Title", "Category", "File", "Size (KB)", "Status", "Published"],
    (reportResult.data ?? []).map((r) => [r.title, r.category, r.file_name, r.file_size ? Math.round(r.file_size / 1024) : "", r.published ? "Published" : "Hidden", String(r.published_at).slice(0, 10)]));

  return "﻿" + lines.join("\r\n");
}
