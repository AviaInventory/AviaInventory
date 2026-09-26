import { supabase } from "@/lib/supabase";

/* ==========================================================
   STATUS ENUMS
========================================================== */

export enum RFQStatus {
  Pending = "Pending",
  Quoted = "Quoted",
  Accepted = "Accepted",
  Rejected = "Rejected",
  Cancelled = "Cancelled",
  Closed = "Closed",
}

export enum QuoteStatus {
  Draft = "Draft",
  Sent = "Sent",
  Accepted = "Accepted",
  Rejected = "Rejected",
  Expired = "Expired",
}

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

  /* Derived / optional display fields. */
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

function handleError(error: unknown): ServiceResponse {
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

    return {
      ...row,
      buyer: buyerMap.get(row.buyer_id),
      supplier: row.supplier_id
        ? supplierMap.get(row.supplier_id)
        : undefined,
      part,
      part_number: part?.part_number ?? null,
      description:
        part?.description ??
        row.message ??
        null,
      quote_count: quoteCounts.get(row.id) ?? 0,

      /* These fields are not columns in the current rfqs table. */
      required_date: null,
      delivery_location: null,
      notes: row.message,
      attachments: [],
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

    const message = [
      `Part Number: ${rfq.part_number.trim()}`,
      `Description: ${rfq.description.trim()}`,
      `Preferred Condition: ${rfq.preferred_condition || "-"}`,
      `Certification Required: ${rfq.certification_required || "-"}`,
      `ATA Chapter: ${rfq.ata_chapter || "-"}`,
      `Category: ${rfq.category || "-"}`,
      `Aircraft: ${rfq.aircraft_manufacturer || ""} ${rfq.aircraft_model || ""}`.trim(),
      `Engine: ${rfq.engine_manufacturer || ""} ${rfq.engine_model || ""}`.trim(),
      `Required Date: ${rfq.required_date || "-"}`,
      `Delivery Location: ${rfq.delivery_location || "-"}`,
      `Notes: ${rfq.notes || "-"}`,
    ]
      .filter(Boolean)
      .join("\n");

    const { data, error } = await supabase
      .from("rfqs")
      .insert({
        buyer_id: user.id,
        supplier_id: supplierId,
        part_id: null,
        quantity: Number(rfq.quantity),
        message,
        status: RFQStatus.Pending,
      })
      .select(
        "id, buyer_id, supplier_id, part_id, quantity, message, status, created_at"
      )
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

    const { data, error } = await supabase
      .from("rfqs")
      .select(
        "id, buyer_id, supplier_id, part_id, quantity, message, status, created_at"
      )
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

    const { data, error } = await supabase
      .from("rfqs")
      .select(
        "id, buyer_id, supplier_id, part_id, quantity, message, status, created_at"
      )
      .eq("supplier_id", user.id)
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
      .select(
        "id, buyer_id, supplier_id, part_id, quantity, message, status, created_at"
      )
      .eq("id", id)
      .or(
        `buyer_id.eq.${user.id},supplier_id.eq.${user.id}`
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
   UPDATE RFQ
========================================================== */

export async function updateRFQ(
  id: string,
  updates: Partial<CreateRFQData>
): Promise<ServiceResponse<RFQ>> {
  try {
    const user = await getCurrentUser();

    const payload: {
      quantity?: number;
      message?: string | null;
      supplier_id?: string | null;
    } = {};

    if (updates.quantity !== undefined) {
      payload.quantity = Number(updates.quantity);
    }

    const messageParts = [
      updates.part_number
        ? `Part Number: ${updates.part_number.trim()}`
        : "",
      updates.description
        ? `Description: ${updates.description.trim()}`
        : "",
      updates.preferred_condition
        ? `Preferred Condition: ${updates.preferred_condition}`
        : "",
      updates.certification_required
        ? `Certification Required: ${updates.certification_required}`
        : "",
      updates.delivery_location
        ? `Delivery Location: ${updates.delivery_location}`
        : "",
      updates.notes
        ? `Notes: ${updates.notes}`
        : "",
    ].filter(Boolean);

    if (messageParts.length) {
      payload.message = messageParts.join("\n");
    }

    if (
      updates.distribution_method === "selected"
    ) {
      payload.supplier_id =
        updates.supplier_ids?.[0] ?? null;
    }

    const { data, error } = await supabase
      .from("rfqs")
      .update(payload)
      .eq("id", id)
      .eq("buyer_id", user.id)
      .select(
        "id, buyer_id, supplier_id, part_id, quantity, message, status, created_at"
      )
      .maybeSingle();

    if (error) {
      return handleError(error);
    }

    if (!data) {
      return handleError("RFQ not found or you do not own it.");
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
  const quoteRows = rows as Quote[];

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
      .select(
        "id, buyer_id, supplier_id, part_id, quantity, message, status, created_at"
      )
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
        "id, buyer_id, supplier_id, quantity, part_id, message, status, created_at"
      )
      .eq("id", quote.rfq_id)
      .eq("supplier_id", user.id)
      .maybeSingle();

    if (rfqError) return handleError(rfqError);

    if (!rfq) {
      return handleError(
        "This RFQ is not assigned to your supplier account."
      );
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

    await supabase
      .from("rfqs")
      .update({ status: RFQStatus.Quoted })
      .eq("id", rfq.id)
      .eq("supplier_id", user.id);

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

export async function rejectQuote(
  id: string
): Promise<ServiceResponse> {
  return updateQuoteStatus(id, QuoteStatus.Rejected);
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

    const extension = file.name.includes(".")
      ? `.${file.name.split(".").pop()}`
      : "";

    const filePath =
      `${user.id}/${crypto.randomUUID()}${extension}`;

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

    const { data } = supabase.storage
      .from("rfq-attachments")
      .getPublicUrl(filePath);

    return {
      success: true,
      url: data.publicUrl,
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

export async function deleteRFQAttachment(
  publicUrl: string
): Promise<ServiceResponse> {
  try {
    const url = new URL(publicUrl);
    const marker = "/rfq-attachments/";

    const index = url.pathname.indexOf(marker);

    if (index === -1) {
      return handleError("Invalid attachment URL.");
    }

    const filePath = decodeURIComponent(
      url.pathname.substring(index + marker.length)
    );

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
    case RFQStatus.Rejected:
      return "red";
    case RFQStatus.Cancelled:
      return "gray";
    case RFQStatus.Closed:
      return "slate";
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
      return "red";
    case QuoteStatus.Expired:
      return "orange";
    default:
      return "gray";
  }
}
