"use client";

import { supabase } from "@/lib/supabase";
import { parseRFQMessage } from "@/lib/rfqs";

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

  /* Purchase order (set by the buyer) */
  po_number: string | null;
  po_issued_at: string | null;
  buyer_company_name: string | null;
  supplier_company_name: string | null;
  ship_to_name: string | null;
  ship_to_company: string | null;
  ship_to_address: string | null;
  ship_to_city: string | null;
  ship_to_country: string | null;
  ship_to_phone: string | null;
  shipping_method: string | null;
  shipping_account_number: string | null;

  /* Dispatch and closing */
  dispatch_carrier: string | null;
  tracking_number: string | null;
  dispatch_note: string | null;
  dispatched_at: string | null;
  received_at: string | null;
  closed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;

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

type SupabaseOrderRow = Omit<Order, "part" | "supplier"> & {
  // PostgREST returns many-to-one embeds as a single object (older typings used arrays).
  part: OneOrMany<NonNullable<Order["part"]>>;
  supplier: OneOrMany<NonNullable<Order["supplier"]>>;
  rfq: OneOrMany<{ message: string | null }>;
};

type OneOrMany<T> = T | T[] | null;

function one<T>(value: OneOrMany<T> | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function normalizeOrder(row: SupabaseOrderRow): Order {
  // Orders created from a free-text RFQ have no catalogue part; use the RFQ's part details.
  const details = parseRFQMessage(one(row.rfq)?.message);
  const part = one(row.part) ?? (details.part_number
    ? { id: "", part_number: details.part_number, description: details.description || null, manufacturer: null }
    : null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { part: _part, supplier, rfq: _rfq, ...fields } = row;
  return { ...fields, part, supplier: one(supplier) };
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
  po_number,
  po_issued_at,
  buyer_company_name,
  supplier_company_name,
  ship_to_name,
  ship_to_company,
  ship_to_address,
  ship_to_city,
  ship_to_country,
  ship_to_phone,
  shipping_method,
  shipping_account_number,
  dispatch_carrier,
  tracking_number,
  dispatch_note,
  dispatched_at,
  received_at,
  closed_at,
  cancelled_at,
  cancelled_by,
  cancel_reason,

  part:parts (
    id,
    part_number,
    description,
    manufacturer
  ),

  rfq:rfqs (
    message
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

    return (data ?? []).map((row) => normalizeOrder(row as unknown as SupabaseOrderRow));

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

    return (data ?? []).map((row) => normalizeOrder(row as unknown as SupabaseOrderRow));

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

    return normalizeOrder(data as unknown as SupabaseOrderRow);

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

    return data ? normalizeOrder(data as unknown as SupabaseOrderRow) : null;

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

    return data ? normalizeOrder(data as unknown as SupabaseOrderRow) : null;

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

    return (data ?? []).map((row) => normalizeOrder(row as unknown as SupabaseOrderRow));

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

  return status
    .charAt(0)
    .toUpperCase() +
    status.slice(1);
}
/* ==========================================================
   GET SUPPLIER ORDERS
========================================================== */

export async function getSupplierOrders(): Promise<Order[]> {
  try {
    const user = await getCurrentUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("supplier_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET SUPPLIER ORDERS ERROR:", error);
      return [];
    }

    return (data ?? []).map((row) => normalizeOrder(row as unknown as SupabaseOrderRow));
  } catch (error) {
    console.error("GET SUPPLIER ORDERS EXCEPTION:", error);
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
    if (!user || !orderId) return null;

    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", orderId)
      .eq("supplier_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("GET SUPPLIER ORDER ERROR:", error);
      return null;
    }

    return data ? normalizeOrder(data as unknown as SupabaseOrderRow) : null;
  } catch (error) {
    console.error("GET SUPPLIER ORDER EXCEPTION:", error);
    return null;
  }
}

/* ==========================================================
   ORDER WORKFLOW STEPS
   Each step is a database function that checks who is acting
   and the current step (migration 20261020000100).
========================================================== */

export interface Invoice {
  id: string;
  order_id: string;
  supplier_id: string;
  buyer_id: string | null;
  invoice_number: string;
  currency: string;
  description: string | null;
  quantity: number | null;
  unit_price: number | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  issued_at: string | null;
  due_date: string | null;
  paid_at: string | null;
  payment_terms: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_branch: string | null;
  bank_swift: string | null;
  payment_instructions: string | null;
  notes: string | null;
  buyer_marked_paid_at: string | null;
  buyer_payment_reference: string | null;
  supplier_confirmed_paid_at: string | null;
  created_at: string;
}

export interface PaymentDetails {
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_branch: string | null;
  bank_swift: string | null;
  payment_instructions: string | null;
  payment_terms: string | null;
}

export interface PurchaseOrderInput {
  quantity: number;
  shipToName: string;
  shipToCompany: string;
  shipToAddress: string;
  shipToCity: string;
  shipToCountry: string;
  shipToPhone: string;
  shippingMethod: string;
  shippingAccountNumber: string;
  requiredDate: string;
  notes: string;
}

export interface InvoiceInput extends PaymentDetails {
  taxRate: number;
  dueDate: string;
  notes: string;
  saveDefaults: boolean;
}

/** Runs a step function and turns its error into a message for the user. */
async function step<T = null>(fn: string, params: Record<string, unknown>): Promise<OrderServiceResponse<T>> {
  const { data, error } = await supabase.rpc(fn, params);
  if (error) {
    console.error(`${fn.toUpperCase()} ERROR:`, error);
    // The step functions raise P0001 with a sentence meant for the user.
    return { success: false, error: error.code === "P0001" ? error.message : "Something went wrong. Please try again." };
  }
  return { success: true, data: data as T };
}

export function issuePurchaseOrder(orderId: string, input: PurchaseOrderInput) {
  return step<string>("issue_purchase_order", {
    p_order_id: orderId,
    p_quantity: input.quantity,
    p_ship_to_name: input.shipToName,
    p_ship_to_company: input.shipToCompany,
    p_ship_to_address: input.shipToAddress,
    p_ship_to_city: input.shipToCity,
    p_ship_to_country: input.shipToCountry,
    p_ship_to_phone: input.shipToPhone,
    p_shipping_method: input.shippingMethod,
    p_shipping_account_number: input.shippingAccountNumber,
    p_required_date: input.requiredDate || null,
    p_notes: input.notes,
  });
}

export function issueInvoice(orderId: string, input: InvoiceInput) {
  return step<string>("issue_invoice", {
    p_order_id: orderId,
    p_tax_rate: input.taxRate,
    p_due_date: input.dueDate || null,
    p_payment_terms: input.payment_terms,
    p_bank_name: input.bank_name,
    p_bank_account_name: input.bank_account_name,
    p_bank_account_number: input.bank_account_number,
    p_bank_branch: input.bank_branch,
    p_bank_swift: input.bank_swift,
    p_payment_instructions: input.payment_instructions,
    p_notes: input.notes,
    p_save_defaults: input.saveDefaults,
  });
}

export const markInvoicePaid = (orderId: string, reference: string) =>
  step("mark_invoice_paid", { p_order_id: orderId, p_reference: reference });

export const confirmPaymentReceived = (orderId: string) =>
  step("confirm_payment_received", { p_order_id: orderId });

export const markOrderDispatched = (orderId: string, carrier: string, trackingNumber: string, note: string) =>
  step("mark_order_dispatched", { p_order_id: orderId, p_carrier: carrier, p_tracking_number: trackingNumber, p_note: note });

export const confirmOrderReceived = (orderId: string) =>
  step("confirm_order_received", { p_order_id: orderId });

export const cancelOrder = (orderId: string, reason: string) =>
  step("cancel_order", { p_order_id: orderId, p_reason: reason });

/** The order with its live invoice, for either party. */
export async function getOrderWithInvoice(orderId: string): Promise<{ order: Order | null; invoice: Invoice | null }> {
  const [{ data: orderRow, error: orderError }, { data: invoiceRow, error: invoiceError }] = await Promise.all([
    supabase.from("orders").select(ORDER_SELECT).eq("id", orderId).maybeSingle(),
    supabase.from("supplier_invoices").select("*").eq("order_id", orderId).neq("status", "Cancelled").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (orderError) console.error("GET ORDER ERROR:", orderError);
  if (invoiceError) console.error("GET ORDER INVOICE ERROR:", invoiceError);
  return {
    order: orderRow ? normalizeOrder(orderRow as unknown as SupabaseOrderRow) : null,
    invoice: (invoiceRow as Invoice | null) ?? null,
  };
}

export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  const { data, error } = await supabase.from("supplier_invoices").select("*").eq("id", invoiceId).maybeSingle();
  if (error) console.error("GET INVOICE ERROR:", error);
  return (data as Invoice | null) ?? null;
}

/** The supplier's saved bank/payment details, to prefill the next invoice. */
export async function getSavedPaymentDetails(): Promise<PaymentDetails | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data } = await supabase
    .from("supplier_payment_details")
    .select("bank_name,bank_account_name,bank_account_number,bank_branch,bank_swift,payment_instructions,payment_terms")
    .eq("supplier_id", user.id)
    .maybeSingle();
  return (data as PaymentDetails | null) ?? null;
}

export type InvoiceWithOrder = Invoice & { order: Pick<Order, "id" | "status" | "po_number" | "supplier_company_name"> | null };

/** Invoices the signed-in buyer has received, newest first, with their order's step. */
export async function getBuyerInvoices(): Promise<InvoiceWithOrder[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const { data: invoices, error } = await supabase
    .from("supplier_invoices")
    .select("*")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("GET BUYER INVOICES ERROR:", error);
    return [];
  }
  const orderIds = [...new Set((invoices ?? []).map((invoice) => invoice.order_id))];
  const { data: orders } = orderIds.length
    ? await supabase.from("orders").select("id,status,po_number,supplier_company_name").in("id", orderIds)
    : { data: [] };
  const byId = new Map((orders ?? []).map((order) => [order.id, order]));
  return (invoices ?? []).map((invoice) => ({ ...(invoice as Invoice), order: byId.get(invoice.order_id) ?? null }));
}
