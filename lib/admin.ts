import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { usdKesRate } from "@/lib/billing/pricing";

export interface AdminPartRow {
  id: string;
  part_number: string;
  manufacturer: string | null;
  quantity: number | null;
  unit_price: number | null;
  currency: string | null;
  price_type?: string | null;
  price_basis?: string | null;
  status: string | null;
  created_at: string | null;
}

export interface AdminOrderRow {
  id: string;
  part_id: string | null;
  quantity: number;
  unit_price: number;
  currency: string;
  total_amount: number;
  status: string;
  created_at: string | null;
  part?: { part_number: string; manufacturer: string | null } | null;
}

interface AdminOrderQueryRow {
  id: string;
  part_id: string | null;
  quantity: number | null;
  unit_price: number | null;
  currency: string | null;
  total_amount: number | null;
  status: string | null;
  created_at: string | null;
  part: { part_number: string; manufacturer: string | null }[] | null;
}

export interface DashboardStats {
  totalUsers: number;
  totalBuyers: number;
  totalSuppliers: number;
  totalPublishedParts: number;
  totalParts: number;
  totalRFQs: number;
  totalQuotes: number;
  totalOrders: number;
  totalPurchasedQuantity: number;
  sales: SalesOverview;
}

export interface SalesOverview {
  /** KES orders plus USD orders converted at the billing rate. */
  totalKes: number;
  /** BILLING_USD_KES_RATE, or null when it is not configured (USD then stays unconverted). */
  usdKesRate: number | null;
  /** USD included in totalKes, before conversion. */
  convertedUsd: number;
  /** Order value in currencies with no configured KES rate, kept out of totalKes. */
  unconverted: { currency: string; amount: number }[];
}

/** Totals order value in Kenya shillings, converting USD with the same rate billing uses. */
function buildSalesOverview(rows: Array<{ total_amount: number | null; currency: string | null }>): SalesOverview {
  let rate: number | null = null;
  try {
    rate = usdKesRate();
  } catch (error) {
    console.error("ADMIN SALES OVERVIEW:", error instanceof Error ? error.message : error);
  }

  const byCurrency = new Map<string, number>();
  for (const row of rows) {
    const currency = (row.currency || "USD").toUpperCase();
    byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + Number(row.total_amount ?? 0));
  }

  const kes = byCurrency.get("KES") ?? 0;
  const usd = byCurrency.get("USD") ?? 0;
  byCurrency.delete("KES");
  if (rate !== null) byCurrency.delete("USD");

  return {
    totalKes: kes + (rate !== null ? usd * rate : 0),
    usdKesRate: rate,
    convertedUsd: rate !== null ? usd : 0,
    unconverted: [...byCurrency]
      .filter(([, amount]) => amount !== 0)
      .map(([currency, amount]) => ({ currency, amount }))
      .sort((a, b) => a.currency.localeCompare(b.currency)),
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createAdminClient();

  const [users, buyers, suppliers, published, parts, rfqs, quotes, orders] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("buyers").select("id", { count: "exact", head: true }),
      supabase.from("suppliers").select("id", { count: "exact", head: true }),
      supabase.from("parts").select("id", { count: "exact", head: true }).eq("status", "Published"),
      supabase.from("parts").select("id", { count: "exact", head: true }),
      supabase.from("rfqs").select("id", { count: "exact", head: true }),
      supabase.from("quotes").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("quantity, total_amount, currency"),
    ]);

  for (const [name, result] of Object.entries({ users, buyers, suppliers, published, parts, rfqs, quotes, orders })) {
    if (result.error) console.error(`ADMIN ${name.toUpperCase()} ERROR:`, result.error);
  }

  const orderRows = (orders.data ?? []) as Array<{ quantity: number | null; total_amount: number | null; currency: string | null }>;

  return {
    totalUsers: users.count ?? 0,
    totalBuyers: buyers.count ?? 0,
    totalSuppliers: suppliers.count ?? 0,
    totalPublishedParts: published.count ?? 0,
    totalParts: parts.count ?? 0,
    totalRFQs: rfqs.count ?? 0,
    totalQuotes: quotes.count ?? 0,
    totalOrders: orderRows.length,
    totalPurchasedQuantity: orderRows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0),
    sales: buildSalesOverview(orderRows),
  };
}

export async function getAdminPublishedParts(): Promise<AdminPartRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("parts")
    .select("id, part_number, manufacturer, quantity, unit_price, currency, status, created_at")
    .eq("status", "Published")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("ADMIN PUBLISHED PARTS ERROR:", error);
    return [];
  }

  return (data ?? []) as AdminPartRow[];
}

export async function getAdminOrders(): Promise<AdminOrderRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      part_id,
      quantity,
      unit_price,
      currency,
      total_amount,
      status,
      created_at,
      part:parts(part_number, manufacturer)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("ADMIN ORDERS ERROR:", error);
    return [];
  }

  const rows = (data ?? []) as unknown as AdminOrderQueryRow[];
  return rows.map((row): AdminOrderRow => ({
    id: row.id,
    part_id: row.part_id,
    quantity: Number(row.quantity ?? 0),
    unit_price: Number(row.unit_price ?? 0),
    currency: row.currency ?? "USD",
    total_amount: Number(row.total_amount ?? 0),
    status: row.status ?? "",
    created_at: row.created_at,
    part: row.part?.[0] ?? null,
  }));
}
