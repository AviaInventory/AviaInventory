"use client";

import { supabase } from "@/lib/supabase";

/* ==========================================================
   TYPES
========================================================== */

export interface Order {
  id: string;

  rfq_id: string;
  quote_id: string;

  buyer_id: string;
  supplier_id: string;

  part_id: string | null;

  quantity: number;

  unit_price: number;

  currency: string;

  total_amount: number;

  status: string;

  delivery_location: string | null;

  required_date: string | null;

  supplier_message: string | null;

  buyer_message: string | null;

  created_at: string;

  updated_at: string;

  part?: {
    id: string;
    part_number: string;
    description: string | null;
    manufacturer: string | null;
  } | null;

  supplier?: {
    id: string;
    company_name: string | null;
    business_type?: string | null;
    website?: string | null;
    country?: string | null;
    city?: string | null;
  } | null;
}

/* ==========================================================
   SERVICE RESPONSE
========================================================== */

export interface OrderServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/* ==========================================================
   SUPABASE RESPONSE TYPES
========================================================== */

interface SupabaseOrderRow {
  id: string;
  rfq_id: string;
  quote_id: string;
  buyer_id: string;
  supplier_id: string;
  part_id: string | null;
  quantity: number;
  unit_price: number;
  currency: string;
  total_amount: number;
  status: string;
  delivery_location: string | null;
  required_date: string | null;
  supplier_message: string | null;
  buyer_message: string | null;
  created_at: string;
  updated_at: string;

  part:
    | {
        id: string;
        part_number: string;
        description: string | null;
        manufacturer: string | null;
      }[]
    | null;

  supplier:
    | {
        id: string;
        company_name: string | null;
        business_type?: string | null;
        website?: string | null;
        country?: string | null;
        city?: string | null;
      }[]
    | null;
}

/* ==========================================================
   NORMALIZE SUPABASE ORDER
========================================================== */

function normalizeOrder(
  row: SupabaseOrderRow
): Order {
  return {
    id: row.id,
    rfq_id: row.rfq_id,
    quote_id: row.quote_id,
    buyer_id: row.buyer_id,
    supplier_id: row.supplier_id,
    part_id: row.part_id,
    quantity: row.quantity,
    unit_price: row.unit_price,
    currency: row.currency,
    total_amount: row.total_amount,
    status: row.status,
    delivery_location: row.delivery_location,
    required_date: row.required_date,
    supplier_message: row.supplier_message,
    buyer_message: row.buyer_message,
    created_at: row.created_at,
    updated_at: row.updated_at,

    // Supabase returns these relationships as arrays.
    // Our application uses a single related object.
    part: row.part?.[0] ?? null,

    supplier: row.supplier?.[0] ?? null,
  };
}

/* ==========================================================
   ORDER SELECT
========================================================== */

const ORDER_SELECT = `
  id,
  rfq_id,
  quote_id,
  buyer_id,
  supplier_id,
  part_id,
  quantity,
  unit_price,
  currency,
  total_amount,
  status,
  delivery_location,
  required_date,
  supplier_message,
  buyer_message,
  created_at,
  updated_at,

  part:parts (
    id,
    part_number,
    description,
    manufacturer
  ),

  supplier:suppliers (
    id,
    company_name,
    business_type,
    website,
    city
  )
`;

/* ==========================================================
   GET CURRENT USER
========================================================== */

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error(
      "GET CURRENT USER ERROR:",
      error
    );

    return null;
  }

  if (!user) {
    console.error(
      "GET CURRENT USER ERROR: No authenticated user."
    );

    return null;
  }

  return user;
}

/* ==========================================================
   GET BUYER ORDERS
========================================================== */

export async function getBuyerOrders(): Promise<Order[]> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return [];
    }

    const {
      data,
      error,
    } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("buyer_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "GET BUYER ORDERS ERROR:",
        error
      );

      return [];
    }

    const rows =
      (data ?? []) as unknown as SupabaseOrderRow[];

    return rows.map(normalizeOrder);

  } catch (error) {
    console.error(
      "GET BUYER ORDERS EXCEPTION:",
      error
    );

    return [];
  }
}

/* ==========================================================
   GET RECENT BUYER ORDERS
========================================================== */

export async function getRecentBuyerOrders(
  limit = 5
): Promise<Order[]> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return [];
    }

    const {
      data,
      error,
    } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("buyer_id", user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(limit);

    if (error) {
      console.error(
        "GET RECENT BUYER ORDERS ERROR:",
        error
      );

      return [];
    }

    const rows =
      (data ?? []) as unknown as SupabaseOrderRow[];

    return rows.map(normalizeOrder);

  } catch (error) {
    console.error(
      "GET RECENT BUYER ORDERS EXCEPTION:",
      error
    );

    return [];
  }
}

/* ==========================================================
   GET SINGLE BUYER ORDER
========================================================== */

export async function getBuyerOrder(
  orderId: string
): Promise<Order | null> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return null;
    }

    if (!orderId) {
      console.error(
        "GET BUYER ORDER ERROR: Missing order ID."
      );

      return null;
    }

    const {
      data,
      error,
    } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", orderId)
      .eq("buyer_id", user.id)
      .single();

    if (error) {
      console.error(
        "GET BUYER ORDER ERROR:",
        error
      );

      return null;
    }

    if (!data) {
      return null;
    }

    const row =
      data as unknown as SupabaseOrderRow;

    return normalizeOrder(row);

  } catch (error) {
    console.error(
      "GET BUYER ORDER EXCEPTION:",
      error
    );

    return null;
  }
}

/* ==========================================================
   GET ORDER BY QUOTE
========================================================== */

export async function getOrderByQuote(
  quoteId: string
): Promise<Order | null> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return null;
    }

    if (!quoteId) {
      return null;
    }

    const {
      data,
      error,
    } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("quote_id", quoteId)
      .eq("buyer_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(
        "GET ORDER BY QUOTE ERROR:",
        error
      );

      return null;
    }

    if (!data) {
      return null;
    }

    const row =
      data as unknown as SupabaseOrderRow;

    return normalizeOrder(row);

  } catch (error) {
    console.error(
      "GET ORDER BY QUOTE EXCEPTION:",
      error
    );

    return null;
  }
}

/* ==========================================================
   GET ORDER BY RFQ
========================================================== */

export async function getOrderByRFQ(
  rfqId: string
): Promise<Order | null> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return null;
    }

    if (!rfqId) {
      return null;
    }

    const {
      data,
      error,
    } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("rfq_id", rfqId)
      .eq("buyer_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(
        "GET ORDER BY RFQ ERROR:",
        error
      );

      return null;
    }

    if (!data) {
      return null;
    }

    const row =
      data as unknown as SupabaseOrderRow;

    return normalizeOrder(row);

  } catch (error) {
    console.error(
      "GET ORDER BY RFQ EXCEPTION:",
      error
    );

    return null;
  }
}

/* ==========================================================
   GET ORDER COUNT
========================================================== */

export async function getBuyerOrderCount(): Promise<number> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return 0;
    }

    const {
      count,
      error,
    } = await supabase
      .from("orders")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("buyer_id", user.id);

    if (error) {
      console.error(
        "GET BUYER ORDER COUNT ERROR:",
        error
      );

      return 0;
    }

    return count ?? 0;

  } catch (error) {
    console.error(
      "GET BUYER ORDER COUNT EXCEPTION:",
      error
    );

    return 0;
  }
}

/* ==========================================================
   GET ORDERS BY STATUS
========================================================== */

export async function getBuyerOrdersByStatus(
  status: string
): Promise<Order[]> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return [];
    }

    if (!status) {
      return [];
    }

    const {
      data,
      error,
    } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("buyer_id", user.id)
      .eq("status", status)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "GET BUYER ORDERS BY STATUS ERROR:",
        error
      );

      return [];
    }

    const rows =
      (data ?? []) as unknown as SupabaseOrderRow[];

    return rows.map(normalizeOrder);

  } catch (error) {
    console.error(
      "GET BUYER ORDERS BY STATUS EXCEPTION:",
      error
    );

    return [];
  }
}

/* ==========================================================
   FORMAT DATE
========================================================== */

export function formatOrderDate(
  value: string | null
): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

/* ==========================================================
   FORMAT CURRENCY
========================================================== */

export function formatOrderAmount(
  amount: number,
  currency: string
): string {
  const numericAmount =
    Number(amount);

  if (Number.isNaN(numericAmount)) {
    return `${currency} 0.00`;
  }

  return `${currency} ${numericAmount.toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

/* ==========================================================
   FORMAT ORDER STATUS
========================================================== */

export function formatOrderStatus(
  status: string
): string {
  if (!status) {
    return "Unknown";
  }

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}

/* ==========================================================
   GET SUPPLIER ORDERS
========================================================== */

export async function getSupplierOrders(): Promise<Order[]> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return [];
    }

    const {
      data,
      error,
    } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("supplier_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "GET SUPPLIER ORDERS ERROR:",
        error
      );

      return [];
    }

    const rows =
      (data ?? []) as unknown as SupabaseOrderRow[];

    return rows.map(normalizeOrder);

  } catch (error) {
    console.error(
      "GET SUPPLIER ORDERS EXCEPTION:",
      error
    );

    return [];
  }
}

/* ==========================================================
   GET SINGLE SUPPLIER ORDER
========================================================== */

export async function getSupplierOrder(
  orderId: string
): Promise<Order | null> {
  try {
    const user = await getCurrentUser();

    if (!user || !orderId) {
      return null;
    }

    const {
      data,
      error,
    } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", orderId)
      .eq("supplier_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(
        "GET SUPPLIER ORDER ERROR:",
        error
      );

      return null;
    }

    if (!data) {
      return null;
    }

    const row =
      data as unknown as SupabaseOrderRow;

    return normalizeOrder(row);

  } catch (error) {
    console.error(
      "GET SUPPLIER ORDER EXCEPTION:",
      error
    );

    return null;
  }
}

/* ==========================================================
   UPDATE SUPPLIER ORDER STATUS
========================================================== */

export async function updateSupplierOrderStatus(
  orderId: string,
  status: string
): Promise<OrderServiceResponse<Order>> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: "User not authenticated.",
      };
    }

    if (!orderId) {
      return {
        success: false,
        error: "Order ID is required.",
      };
    }

    const allowedStatuses = [
      "Pending",
      "Processing",
      "Packed",
      "Shipped",
      "Delivered",
      "Completed",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return {
        success: false,
        error: "Invalid order status.",
      };
    }

    const {
      data,
      error,
    } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("supplier_id", user.id)
      .select(ORDER_SELECT)
      .maybeSingle();

    if (error) {
      console.error(
        "UPDATE SUPPLIER ORDER STATUS ERROR:",
        error
      );

      return {
        success: false,
        error: error.message,
      };
    }

    if (!data) {
      return {
        success: false,
        error: "Order not found.",
      };
    }

    const row =
      data as unknown as SupabaseOrderRow;

    return {
      success: true,
      data: normalizeOrder(row),
    };

  } catch (error) {
    console.error(
      "UPDATE SUPPLIER ORDER STATUS EXCEPTION:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to update order.",
    };
  }
}