import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

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
  totalOrderValue: number;
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
      supabase.from("orders").select("quantity, total_amount"),
    ]);

  for (const [name, result] of Object.entries({ users, buyers, suppliers, published, parts, rfqs, quotes, orders })) {
    if (result.error) console.error(`ADMIN ${name.toUpperCase()} ERROR:`, result.error);
  }

  const orderRows = (orders.data ?? []) as Array<{ quantity: number | null; total_amount: number | null }>;

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
    totalOrderValue: orderRows.reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0),
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
