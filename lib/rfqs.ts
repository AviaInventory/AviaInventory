import { supabase } from "@/lib/supabase";

/* ==========================================================
   STATUS ENUMS
========================================================== */

export enum RFQStatus {
  Pending = "Pending",
  Quoted = "Quoted",
  Accepted = "Accepted",
  /** Legacy value only: the database stores it as Closed. */
  Rejected = "Rejected",
  Cancelled = "Cancelled",
  Closed = "Closed",
  Expired = "Expired",
}

export enum QuoteStatus {
  Draft = "Draft",
  Sent = "Sent",
  Accepted = "Accepted",
  /** Legacy value only: the database stores it as Closed. */
  Rejected = "Rejected",
  Expired = "Expired",
  /** Not selected: the buyer accepted another quotation or closed the RFQ. */
  Closed = "Closed",
}

/** "parts" = aircraft parts RFQ, "mro" = repair / overhaul service RFQ. */
export type RFQType = "parts" | "mro";

export const RFQ_TYPE_LABELS: Record<RFQType, string> = {
  parts: "Aircraft Parts RFQ",
  mro: "MRO Services RFQ",
};

/** Buyers must give suppliers at least this many days before the required-by date. */
export const RFQ_MIN_LEAD_DAYS = 3;

// "*" rather than a column list: rfq_type, required_date and attachment_urls come from the
// 20261024000100 migration, and naming them would break every RFQ read until it is applied.
// hydrateRFQs() falls back to the message text and defaults when they are absent.
const RFQ_COLUMNS = "*";

/* ==========================================================
   COMMON TYPES
========================================================== */

export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: unknown;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface PartSummary {
  id: string;
  part_number: string;
  manufacturer?: string | null;
  description?: string | null;
  image_urls?: string[] | null;
}

export interface BuyerProfile {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  country?: string | null;
}

export interface SupplierProfile {
  id: string;
  company_name?: string | null;
  country?: string | null;
}

export interface RFQ {
  id: string;
  buyer_id: string;
  supplier_id: string | null;
  part_id: string | null;
  quantity: number;
  message: string | null;
  status: RFQStatus;
  created_at: string;
  rfq_type: RFQType;

  /* Derived / optional display fields. */
  /** Storage paths in the private rfq-attachments bucket; see getRFQAttachmentUrl(). */
  attachment_urls?: string[];
  component?: string | null;
  component_manufacturer?: string | null;
  forward_exchange?: string | null;
  part_number?: string | null;
  description?: string | null;
  preferred_condition?: string | null;
  certification_required?: string | null;
  ata_chapter?: string | null;
  category?: string | null;
  aircraft_manufacturer?: string | null;
  aircraft_model?: string | null;
  engine_manufacturer?: string | null;
  engine_model?: string | null;
  required_date?: string | null;
  delivery_location?: string | null;
  notes?: string | null;
  distribution_method?: "broadcast" | "selected";
  supplier_ids?: string[];
  attachments?: string[];

  buyer?: BuyerProfile;
  supplier?: SupplierProfile;
  part?: PartSummary;
  quote_count?: number;
}

export interface CreateRFQData {
  rfq_type?: RFQType;
  /* MRO services RFQ fields. */
  component?: string;
  component_manufacturer?: string;
  forward_exchange?: "Yes" | "No" | "";
  part_number: string;
  description: string;
  quantity: number;
  required_date: string;
  preferred_condition: string;
  certification_required: string;
  ata_chapter?: string;
  category?: string;
  aircraft_manufacturer?: string;
  aircraft_model?: string;
  engine_manufacturer?: string;
  engine_model?: string;
  delivery_location?: string;
  notes: string;
  distribution_method: "broadcast" | "selected";
  supplier_ids: string[];
  attachments: string[];
}

export interface Quote {
  id: string;
  rfq_id: string;
  supplier_id: string;
  buyer_id: string;
  unit_price: number;
  currency: string;
  lead_time: string;
  condition: string;
  warranty: string;
  valid_until: string;
  certification: string[];
  message: string;
  status: QuoteStatus;
  created_at: string;
  supplier?: SupplierProfile;
  rfq?: RFQ;
}

export interface CreateQuoteData {
  rfq_id: string;
  supplier_id: string;
  buyer_id: string;
  unit_price: number;
  currency: string;
  lead_time: string;
  condition: string;
  warranty: string;
  valid_until: string;
  certification: string[];
  message: string;
}

export interface RFQMessage {
  id: string;
  rfq_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: BuyerProfile;
  recipient?: BuyerProfile;
}

function handleError<T = never>(error: unknown): ServiceResponse<T> {
  console.error(error);
  return { success: false, error };
}

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("User not authenticated.");

  return user;
}

/* ==========================================================
   PROFILE / SUPPLIER HELPERS
   No nested profiles relationships are used.
========================================================== */

async function getProfilesByIds(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];

  if (!uniqueIds.length) {
    return new Map<string, BuyerProfile>();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, company_name, country")
    .in("id", uniqueIds);

  if (error) {
    console.warn("GET PROFILES ERROR:", error);
    return new Map<string, BuyerProfile>();
  }

  return new Map(
    (data ?? []).map((profile) => [
      profile.id,
      profile as BuyerProfile,
    ])
  );
}

async function getSuppliersByIds(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];

  if (!uniqueIds.length) {
    return new Map<string, SupplierProfile>();
  }

  const { data, error } = await supabase
    .from("suppliers")
    .select("id, company_name")
    .in("id", uniqueIds);

  if (error) {
    console.warn("GET SUPPLIERS ERROR:", error);
    return new Map<string, SupplierProfile>();
  }

  return new Map(
    (data ?? []).map((supplier) => [
      supplier.id,
      supplier as SupplierProfile,
    ])
  );
}

async function getPartsByIds(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];

  if (!uniqueIds.length) {
    return new Map<string, PartSummary>();
  }

  const { data, error } = await supabase
    .from("parts")
    .select(
      "id, part_number, manufacturer, description, image_urls"
    )
    .in("id", uniqueIds);

  if (error) {
    console.warn("GET RFQ PARTS ERROR:", error);
    return new Map<string, PartSummary>();
  }

  return new Map(
    (data ?? []).map((part) => [
      part.id,
      part as PartSummary,
    ])
  );
}

async function hydrateRFQs(
  rows: Record<string, unknown>[]
): Promise<RFQ[]> {
  const rfqRows = rows as Array<{
    id: string;
    buyer_id: string;
    supplier_id: string | null;
    part_id: string | null;
    quantity: number;
    message: string | null;
    status: RFQStatus;
    created_at: string;
    rfq_type?: RFQType | null;
    required_date?: string | null;
    attachment_urls?: string[] | null;
  }>;

  const buyerMap = await getProfilesByIds(
    rfqRows.map((row) => row.buyer_id)
  );

  const supplierMap = await getSuppliersByIds(
    rfqRows
      .map((row) => row.supplier_id)
      .filter((id): id is string => Boolean(id))
  );

  const partMap = await getPartsByIds(
    rfqRows
      .map((row) => row.part_id)
      .filter((id): id is string => Boolean(id))
  );

  const rfqIds = rfqRows.map((row) => row.id);
  const quoteCounts = new Map<string, number>();

  if (rfqIds.length) {
    const { data: quotes, error } = await supabase
      .from("quotes")
      .select("id, rfq_id")
      .in("rfq_id", rfqIds);

    if (!error) {
      for (const quote of quotes ?? []) {
        quoteCounts.set(
          quote.rfq_id,
          (quoteCounts.get(quote.rfq_id) ?? 0) + 1
        );
      }
    }
  }

  return rfqRows.map((row) => {
    const part = row.part_id
      ? partMap.get(row.part_id)
      : undefined;
    const details = parseRFQMessage(row.message);

    return {
      ...row,
      buyer: buyerMap.get(row.buyer_id),
      supplier: row.supplier_id
        ? supplierMap.get(row.supplier_id)
        : undefined,
      part,
      ...details,
      part_number: part?.part_number ?? details.part_number ?? null,
      description:
        part?.description ??
        details.description ??
        row.message ??
        null,
      quote_count: quoteCounts.get(row.id) ?? 0,

      rfq_type: row.rfq_type === "mro" ? "mro" : "parts",
      status: row.status === RFQStatus.Rejected ? RFQStatus.Closed : row.status,
      required_date: row.required_date || details.required_date || null,
      attachment_urls: row.attachment_urls ?? [],
      attachments: row.attachment_urls ?? [],

      /* Parsed from rfqs.message: they are not columns in the rfqs table. */
      delivery_location: details.delivery_location || null,
      notes: details.notes || null,
      supplier_ids: row.supplier_id
        ? [row.supplier_id]
        : [],
      distribution_method: row.supplier_id
        ? "selected"
        : "broadcast",
    } as RFQ;
  });
}

/* ==========================================================
   RFQ DETAILS <-> MESSAGE TEXT
   The rfqs table has no columns for most RFQ details, so they are
   stored as "Label: value" lines in rfqs.message. These two helpers
   are the only place that format is written or read.
========================================================== */

type RFQDetailKey =
  | "component" | "part_number" | "description" | "component_manufacturer" | "forward_exchange"
  | "preferred_condition" | "certification_required"
  | "ata_chapter" | "category" | "aircraft_manufacturer" | "aircraft_model"
  | "engine_manufacturer" | "engine_model" | "required_date" | "delivery_location" | "notes";

// MRO-only labels are written only for MRO RFQs, so parts RFQ messages keep their format.
const MRO_ONLY_KEYS: RFQDetailKey[] = ["component", "component_manufacturer", "forward_exchange"];

const RFQ_DETAIL_LABELS: [RFQDetailKey, string][] = [
  ["component", "Component"],
  ["part_number", "Part Number"],
  ["component_manufacturer", "Component Manufacturer"],
  ["forward_exchange", "Forward Exchange"],
  ["description", "Description"],
  ["preferred_condition", "Preferred Condition"],
  ["certification_required", "Certification Required"],
  ["ata_chapter", "ATA Chapter"],
  ["category", "Category"],
  ["aircraft_manufacturer", "Aircraft Manufacturer"],
  ["aircraft_model", "Aircraft Model"],
  ["engine_manufacturer", "Engine Manufacturer"],
  ["engine_model", "Engine Model"],
  ["required_date", "Required Date"],
  ["delivery_location", "Delivery Location"],
  ["notes", "Notes"],
];

export function composeRFQMessage(
  details: Partial<Record<RFQDetailKey, string | null | undefined>>,
  rfqType: RFQType = "parts",
): string {
  return RFQ_DETAIL_LABELS
    .filter(([key]) => rfqType === "mro" || !MRO_ONLY_KEYS.includes(key))
    .map(([key, label]) => `${label}: ${String(details[key] ?? "").trim() || "-"}`)
    .join("\n");
}

export function parseRFQMessage(message: string | null | undefined): Partial<Record<RFQDetailKey, string>> {
  const byLabel = new Map(RFQ_DETAIL_LABELS.map(([key, label]) => [label.toLowerCase(), key]));
  const result: Partial<Record<RFQDetailKey, string>> = {};
  let current: RFQDetailKey | null = null;

  for (const line of (message ?? "").split("\n")) {
    const match = line.match(/^([A-Za-z ]+):\s?(.*)$/);
    const key = match ? byLabel.get(match[1].trim().toLowerCase()) : undefined;
    // Older RFQs stored "Aircraft: <make> <model>" and "Engine: <make> <model>" on one line.
    const legacy = match && !key ? { aircraft: "aircraft_model", engine: "engine_model" }[match[1].trim().toLowerCase()] : undefined;
    const target = (key ?? legacy) as RFQDetailKey | undefined;

    if (match && target) {
      current = target;
      result[target] = match[2].trim() === "-" ? "" : match[2].trim();
    } else if (current) {
      // Multi-line values (e.g. long notes) continue until the next label.
      result[current] = `${result[current] ?? ""}\n${line}`.trim();
    }
  }
  return result;
}

/* ==========================================================
   CREATE RFQ
   Current database columns:
   buyer_id, supplier_id, part_id, quantity,
   message, status, created_at.
========================================================== */

export async function createRFQ(
  rfq: CreateRFQData
): Promise<ServiceResponse<RFQ>> {
  try {
    const user = await getCurrentUser();

    const supplierId =
      rfq.distribution_method === "selected"
        ? rfq.supplier_ids[0] ?? null
        : null;

    if (rfq.distribution_method === "selected" && !supplierId) {
      return handleError(
        "Please select a supplier."
      );
    }

    if (supplierId === user.id) {
      return handleError("You can't request a quote from your own company.");
    }

    const dateError = validateRequiredDate(rfq.required_date);
    if (dateError) return handleError(dateError);

    const rfqType: RFQType = rfq.rfq_type === "mro" ? "mro" : "parts";
    const message = composeRFQMessage(rfq, rfqType);

    const { data, error } = await supabase
      .from("rfqs")
      .insert({
        buyer_id: user.id,
        supplier_id: supplierId,
        part_id: null,
        quantity: Number(rfq.quantity),
        message,
        status: RFQStatus.Pending,
        rfq_type: rfqType,
        required_date: rfq.required_date,
        attachment_urls: rfq.attachments ?? [],
      })
      .select(RFQ_COLUMNS)
      .single();

    if (error) {
      return handleError(error);
    }

    const [hydrated] = await hydrateRFQs([data]);

    return {
      success: true,
      data: hydrated,
    };
  } catch (error) {
    return handleError(error);
  }
}

/* ==========================================================
   BUYER RFQS
========================================================== */

export async function getBuyerRFQs(): Promise<RFQ[]> {
  try {
    const user = await getCurrentUser();
    await expireOverdueRFQs();

    const { data, error } = await supabase
      .from("rfqs")
      .select(RFQ_COLUMNS)
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET BUYER RFQS ERROR:", error);
      return [];
    }

    return hydrateRFQs(data ?? []);
  } catch (error) {
    console.error("GET BUYER RFQS ERROR:", error);
    return [];
  }
}

/* ==========================================================
   SUPPLIER RFQS
========================================================== */

export async function getSupplierRFQs(): Promise<RFQ[]> {
  try {
    const user = await getCurrentUser();
    await expireOverdueRFQs();

    const { data, error } = await supabase
      .from("rfqs")
      .select(RFQ_COLUMNS)
      .or(`supplier_id.eq.${user.id},supplier_id.is.null`)
      .neq("buyer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET SUPPLIER RFQS ERROR:", error);
      return [];
    }

    return hydrateRFQs(data ?? []);
  } catch (error) {
    console.error("GET SUPPLIER RFQS ERROR:", error);
    return [];
  }
}

/* ==========================================================
   SINGLE RFQ
========================================================== */

export async function getRFQById(
  id: string
): Promise<ServiceResponse<RFQ>> {
  try {
    if (!id) {
      return handleError("Invalid RFQ ID.");
    }

    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from("rfqs")
      .select(RFQ_COLUMNS)
      .eq("id", id)
      .or(
        `buyer_id.eq.${user.id},supplier_id.eq.${user.id},supplier_id.is.null`
      )
      .maybeSingle();

    if (error) {
      return handleError(error);
    }

    if (!data) {
      return handleError("RFQ not found.");
    }

    const [hydrated] = await hydrateRFQs([data]);

    return {
      success: true,
      data: hydrated,
    };
  } catch (error) {
    return handleError(error);
  }
}

/* ==========================================================
   EXPIRY
   Sent RFQs are read-only (enforced in the database). An RFQ
   expires once its required-by date is reached.
========================================================== */

/** A date as YYYY-MM-DD in the user's local time zone. */
function localISODate(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

/** Earliest required-by date a buyer may choose (YYYY-MM-DD). */
export function minRequiredDate(from = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() + RFQ_MIN_LEAD_DAYS);
  return localISODate(date);
}

export function validateRequiredDate(value: string | null | undefined): string | null {
  if (!value) return "Please choose the date the RFQ is required by.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Please enter a valid required-by date.";
  if (value < minRequiredDate()) {
    return `The required-by date must be at least ${RFQ_MIN_LEAD_DAYS} days from today.`;
  }
  return null;
}

/** True once the required-by date is reached: suppliers can no longer quote. */
export function isRFQExpired(rfq: Pick<RFQ, "status" | "required_date">) {
  if (rfq.status === RFQStatus.Expired) return true;
  if (!rfq.required_date) return false;
  const open = rfq.status === RFQStatus.Pending || rfq.status === RFQStatus.Quoted;
  return open && rfq.required_date.slice(0, 10) <= localISODate(new Date());
}

/** Status to display, with expiry applied before the database catches up. */
export function effectiveRFQStatus(rfq: Pick<RFQ, "status" | "required_date">): RFQStatus {
  if (rfq.status === RFQStatus.Rejected) return RFQStatus.Closed;
  return isRFQExpired(rfq) ? RFQStatus.Expired : rfq.status;
}

export function effectiveQuoteStatus(status: QuoteStatus | string): QuoteStatus {
  return status === QuoteStatus.Rejected ? QuoteStatus.Closed : (status as QuoteStatus);
}

/**
 * The RFQ's status as one supplier sees it in Received RFQs:
 * Pending (can quote), Quoted (this supplier quoted), Accepted (this supplier's quote
 * was accepted), Closed (buyer chose another quote, closed or cancelled the RFQ) or Expired.
 */
export function supplierRFQStatus(
  rfq: Pick<RFQ, "status" | "required_date">,
  myQuote?: Pick<Quote, "status"> | null,
): RFQStatus {
  if (myQuote) {
    const quoteStatus = effectiveQuoteStatus(myQuote.status);
    if (quoteStatus === QuoteStatus.Accepted) return RFQStatus.Accepted;
    if (quoteStatus === QuoteStatus.Closed) return RFQStatus.Closed;
    if (quoteStatus === QuoteStatus.Expired) return RFQStatus.Expired;
    return RFQStatus.Quoted;
  }
  const status = effectiveRFQStatus(rfq);
  if (status === RFQStatus.Pending || status === RFQStatus.Quoted) return RFQStatus.Pending;
  if (status === RFQStatus.Expired) return RFQStatus.Expired;
  return RFQStatus.Closed;
}

/** A supplier may submit a quote only while the RFQ is Pending for them. */
export function canSupplierQuote(
  rfq: Pick<RFQ, "status" | "required_date">,
  myQuote?: Pick<Quote, "status"> | null,
) {
  return supplierRFQStatus(rfq, myQuote) === RFQStatus.Pending;
}

/** Moves overdue RFQs (and their open quotes) to Expired. Best effort. */
export async function expireOverdueRFQs() {
  const { error } = await supabase.rpc("expire_overdue_rfqs");
  // PGRST202: the function arrives with the 20261024000100 migration; until then, skip quietly.
  if (error && error.code !== "PGRST202") console.warn("EXPIRE OVERDUE RFQS ERROR:", error.message);
}

/* ==========================================================
   CANCEL / CLOSE / DELETE
========================================================== */

export async function cancelRFQ(
  id: string
): Promise<ServiceResponse> {
  try {
    const user = await getCurrentUser();

    const { error } = await supabase
      .from("rfqs")
      .update({ status: RFQStatus.Cancelled })
      .eq("id", id)
      .eq("buyer_id", user.id);

    if (error) return handleError(error);

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function closeRFQ(
  id: string
): Promise<ServiceResponse> {
  try {
    const user = await getCurrentUser();

    const { error } = await supabase
      .from("rfqs")
      .update({ status: RFQStatus.Closed })
      .eq("id", id)
      .or(
        `buyer_id.eq.${user.id},supplier_id.eq.${user.id}`
      );

    if (error) return handleError(error);

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteRFQ(
  id: string
): Promise<ServiceResponse> {
  try {
    const user = await getCurrentUser();

    const { error } = await supabase
      .from("rfqs")
      .delete()
      .eq("id", id)
      .eq("buyer_id", user.id);

    if (error) return handleError(error);

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

/* ==========================================================
   QUOTES
========================================================== */

async function hydrateQuotes(
  rows: Record<string, unknown>[]
): Promise<Quote[]> {
  const quoteRows = rows as unknown as Quote[];

  const supplierMap = await getSuppliersByIds(
    quoteRows.map((quote) => quote.supplier_id)
  );

  const rfqIds = [...new Set(
    quoteRows.map((quote) => quote.rfq_id)
  )];

  let rfqMap = new Map<string, RFQ>();

  if (rfqIds.length) {
    const { data, error } = await supabase
      .from("rfqs")
      .select(RFQ_COLUMNS)
      .in("id", rfqIds);

    if (!error) {
      const hydrated = await hydrateRFQs(data ?? []);
      rfqMap = new Map(
        hydrated.map((rfq) => [rfq.id, rfq])
      );
    }
  }

  return quoteRows.map((quote) => ({
    ...quote,
    status: effectiveQuoteStatus(quote.status),
    supplier: supplierMap.get(quote.supplier_id),
    rfq: rfqMap.get(quote.rfq_id),
  }));
}

export async function createQuote(
  quote: CreateQuoteData
): Promise<ServiceResponse<Quote>> {
  try {
    const user = await getCurrentUser();

    const { data: rfq, error: rfqError } = await supabase
      .from("rfqs")
      .select(
        RFQ_COLUMNS
      )
      .eq("id", quote.rfq_id)
      .or(`supplier_id.eq.${user.id},supplier_id.is.null`)
      .neq("buyer_id", user.id)
      .maybeSingle();

    if (rfqError) return handleError(rfqError);

    if (!rfq) {
      return handleError(
        "This RFQ is not available to your supplier account."
      );
    }

    if (isRFQExpired(rfq as RFQ)) {
      return handleError("This RFQ has expired: its required-by date has been reached.");
    }

    if (rfq.status !== RFQStatus.Pending && rfq.status !== RFQStatus.Quoted) {
      return handleError("This RFQ is closed and no longer accepts quotations.");
    }

    const { data: existingQuote } = await supabase
      .from("quotes")
      .select("id")
      .eq("rfq_id", rfq.id)
      .eq("supplier_id", user.id)
      .limit(1)
      .maybeSingle();

    if (existingQuote) {
      return handleError("You have already submitted a quotation for this RFQ.");
    }

    const { data, error } = await supabase
      .from("quotes")
      .insert({
        rfq_id: rfq.id,
        supplier_id: user.id,
        buyer_id: rfq.buyer_id,
        unit_price: Number(quote.unit_price),
        currency: quote.currency || "USD",
        lead_time: quote.lead_time,
        condition: quote.condition,
        warranty: quote.warranty,
        valid_until: quote.valid_until,
        certification: quote.certification ?? [],
        message: quote.message?.trim() || "",
        status: QuoteStatus.Sent,
      })
      .select("*")
      .single();

    if (error) return handleError(error);

    // The quotes_mark_rfq_quoted trigger moves the RFQ from Pending to Quoted.
    const [hydrated] = await hydrateQuotes([data]);

    return {
      success: true,
      data: hydrated,
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateQuote(
  id: string,
  updates: Partial<CreateQuoteData>
): Promise<ServiceResponse<Quote>> {
  try {
    const user = await getCurrentUser();

    const payload: Record<string, unknown> = {};

    const allowedFields = [
      "unit_price",
      "currency",
      "lead_time",
      "condition",
      "warranty",
      "valid_until",
      "certification",
      "message",
      "status",
    ];

    for (const field of allowedFields) {
      if (field in updates) {
        payload[field] = (updates as Record<string, unknown>)[field];
      }
    }

    const { data, error } = await supabase
      .from("quotes")
      .update(payload)
      .eq("id", id)
      .eq("supplier_id", user.id)
      .select("*")
      .maybeSingle();

    if (error) return handleError(error);
    if (!data) return handleError("Quote not found.");

    const [hydrated] = await hydrateQuotes([data]);

    return {
      success: true,
      data: hydrated,
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function getQuotesForRFQ(
  rfqId: string
): Promise<Quote[]> {
  try {
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("rfq_id", rfqId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("GET RFQ QUOTES ERROR:", error);
      return [];
    }

    return hydrateQuotes(data ?? []);
  } catch (error) {
    console.error("GET RFQ QUOTES ERROR:", error);
    return [];
  }
}

export async function getBuyerQuotes(): Promise<Quote[]> {
  try {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET BUYER QUOTES ERROR:", error);
      return [];
    }

    return hydrateQuotes(data ?? []);
  } catch (error) {
    console.error("GET BUYER QUOTES ERROR:", error);
    return [];
  }
}

export async function getSupplierQuotes(): Promise<Quote[]> {
  try {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("supplier_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET SUPPLIER QUOTES ERROR:", error);
      return [];
    }

    return hydrateQuotes(data ?? []);
  } catch (error) {
    console.error("GET SUPPLIER QUOTES ERROR:", error);
    return [];
  }
}

export async function getQuoteById(
  id: string
): Promise<ServiceResponse<Quote>> {
  try {
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) return handleError(error);
    if (!data) return handleError("Quote not found.");

    const [hydrated] = await hydrateQuotes([data]);

    return {
      success: true,
      data: hydrated,
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateQuoteStatus(
  id: string,
  status: QuoteStatus
): Promise<ServiceResponse> {
  try {
    const user = await getCurrentUser();

    const { error } = await supabase
      .from("quotes")
      .update({ status })
      .eq("id", id)
      .or(
        `buyer_id.eq.${user.id},supplier_id.eq.${user.id}`
      );

    if (error) return handleError(error);

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function acceptQuote(
  id: string
): Promise<ServiceResponse<{ orderId: string }>> {
  try {
    await getCurrentUser();

    const { data, error } = await supabase.rpc(
      "accept_quote",
      { p_quote_id: id }
    );

    if (error) {
      console.error("ACCEPT QUOTE RPC ERROR:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    const orderId =
      typeof data === "string"
        ? data
        : data?.order_id;

    if (!orderId) {
      return {
        success: false,
        error: "The quotation was accepted but no order was created.",
      };
    }

    return {
      success: true,
      data: { orderId },
    };
  } catch (error) {
    return handleError(error);
  }
}

/** Buyer closes a quotation they will not take forward. */
export async function closeQuote(
  id: string
): Promise<ServiceResponse> {
  return updateQuoteStatus(id, QuoteStatus.Closed);
}

/**
 * After accepting a quotation: close every other open quotation on the RFQ so
 * suppliers see it as Closed and stop quoting. Returns how many were closed.
 */
export async function closeOtherQuotes(
  rfqId: string
): Promise<ServiceResponse<{ closed: number }>> {
  try {
    await getCurrentUser();
    const { data, error } = await supabase.rpc("close_other_quotes", { p_rfq_id: rfqId });
    if (error) return { success: false, error: error.message };
    return { success: true, data: { closed: Number(data ?? 0) } };
  } catch (error) {
    return handleError(error);
  }
}

export async function withdrawQuote(
  id: string
): Promise<ServiceResponse> {
  return updateQuoteStatus(id, QuoteStatus.Draft);
}

/* ==========================================================
   ATTACHMENTS
========================================================== */

export async function uploadRFQAttachment(
  file: File
): Promise<UploadResult> {
  try {
    const user = await getCurrentUser();

    // Keep a readable file name after the UUID so suppliers see what they open.
    const safeName = file.name
      .normalize("NFKD")
      .replace(/[^\w.\-]+/g, "_")
      .replace(/_+/g, "_")
      .slice(-80) || "file";

    const filePath =
      `${user.id}/${crypto.randomUUID()}-${safeName}`;

    const { error } = await supabase.storage
      .from("rfq-attachments")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // The bucket is private: keep the storage path and sign it when it is opened.
    return {
      success: true,
      url: filePath,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Upload failed.",
    };
  }
}

/** File name shown for an attachment path ("<user>/<uuid>-<name>"). */
export function rfqAttachmentName(path: string) {
  const file = path.split("/").pop() ?? path;
  return decodeURIComponent(file.replace(/^[0-9a-f-]{36}-/i, "")) || "Attachment";
}

/** Short-lived link to an RFQ attachment (bucket is private). */
export async function getRFQAttachmentUrl(path: string): Promise<string | null> {
  if (/^https?:\/\//.test(path)) return path;
  const { data, error } = await supabase.storage
    .from("rfq-attachments")
    .createSignedUrl(path, 60 * 10);
  if (error) {
    console.warn("RFQ ATTACHMENT URL ERROR:", error.message);
    return null;
  }
  return data.signedUrl;
}

export async function deleteRFQAttachment(
  path: string
): Promise<ServiceResponse> {
  try {
    const marker = "/rfq-attachments/";
    const index = path.indexOf(marker);
    const filePath = index === -1
      ? path
      : decodeURIComponent(new URL(path).pathname.split(marker)[1] ?? "");

    if (!filePath) {
      return handleError("Invalid attachment.");
    }

    const { error } = await supabase.storage
      .from("rfq-attachments")
      .remove([filePath]);

    if (error) return handleError(error);

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

/* ==========================================================
   MESSAGES
   Uses separate profile lookups; no profiles FK relationship.
========================================================== */

export async function getRFQMessages(
  rfqId: string
): Promise<RFQMessage[]> {
  try {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from("messages")
      .select(
        "id, rfq_id, sender_id, recipient_id, message, is_read, created_at"
      )
      .eq("rfq_id", rfqId)
      .or(
        `sender_id.eq.${user.id},recipient_id.eq.${user.id}`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("GET RFQ MESSAGES ERROR:", error);
      return [];
    }

    const unreadIds = (data ?? [])
      .filter(
        (item) =>
          item.recipient_id === user.id &&
          !item.is_read
      )
      .map((item) => item.id);

    if (unreadIds.length) {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .in("id", unreadIds)
        .eq("recipient_id", user.id);
    }

    const profileMap = await getProfilesByIds([
      ...(data ?? []).map((item) => item.sender_id),
      ...(data ?? []).map((item) => item.recipient_id),
    ]);

    return (data ?? []).map((item) => ({
      ...item,
      sender: profileMap.get(item.sender_id),
      recipient: profileMap.get(item.recipient_id),
    })) as RFQMessage[];
  } catch (error) {
    console.error("GET RFQ MESSAGES ERROR:", error);
    return [];
  }
}

export async function sendRFQMessage(
  rfqId: string,
  recipientId: string,
  message: string
): Promise<ServiceResponse> {
  try {
    const user = await getCurrentUser();
    const trimmed = message.trim();

    if (!trimmed) {
      return handleError("Message cannot be empty.");
    }

    if (!recipientId) {
      return handleError("Message recipient is required.");
    }

    if (recipientId === user.id) {
      return handleError("You cannot message yourself.");
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        rfq_id: rfqId,
        sender_id: user.id,
        recipient_id: recipientId,
        message: trimmed,
        is_read: false,
      })
      .select(
        "id, rfq_id, sender_id, recipient_id, message, is_read, created_at"
      )
      .single();

    if (error) return handleError(error);

    return {
      success: true,
      data,
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function markMessageAsRead(
  messageId: string
): Promise<ServiceResponse> {
  try {
    const user = await getCurrentUser();

    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("id", messageId)
      .eq("recipient_id", user.id);

    if (error) return handleError(error);

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function getSupplierMessages(): Promise<RFQMessage[]> {
  try {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from("messages")
      .select(
        "id, rfq_id, sender_id, recipient_id, message, is_read, created_at"
      )
      .or(
        `sender_id.eq.${user.id},recipient_id.eq.${user.id}`
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET SUPPLIER MESSAGES ERROR:", error);
      return [];
    }

    const profileMap = await getProfilesByIds([
      ...(data ?? []).map((item) => item.sender_id),
      ...(data ?? []).map((item) => item.recipient_id),
    ]);

    return (data ?? []).map((item) => ({
      ...item,
      sender: profileMap.get(item.sender_id),
      recipient: profileMap.get(item.recipient_id),
    })) as RFQMessage[];
  } catch (error) {
    console.error("GET SUPPLIER MESSAGES ERROR:", error);
    return [];
  }
}

/* ==========================================================
   HELPERS
========================================================== */

export function isRFQOpen(status: RFQStatus) {
  return (
    status === RFQStatus.Pending ||
    status === RFQStatus.Quoted
  );
}

export function isQuoteActive(status: QuoteStatus) {
  return (
    status === QuoteStatus.Draft ||
    status === QuoteStatus.Sent
  );
}

export function formatCurrency(
  amount: number,
  currency: string
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getRFQStatusColor(status: RFQStatus) {
  switch (status) {
    case RFQStatus.Pending:
      return "yellow";
    case RFQStatus.Quoted:
      return "blue";
    case RFQStatus.Accepted:
      return "green";
    case RFQStatus.Cancelled:
      return "gray";
    case RFQStatus.Rejected:
    case RFQStatus.Closed:
      return "slate";
    case RFQStatus.Expired:
      return "orange";
    default:
      return "gray";
  }
}

export function getQuoteStatusColor(status: QuoteStatus) {
  switch (status) {
    case QuoteStatus.Draft:
      return "gray";
    case QuoteStatus.Sent:
      return "blue";
    case QuoteStatus.Accepted:
      return "green";
    case QuoteStatus.Rejected:
    case QuoteStatus.Closed:
      return "slate";
    case QuoteStatus.Expired:
      return "orange";
    default:
      return "gray";
  }
}
