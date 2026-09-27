import { supabase } from "./supabase";
import type { CertificationDocumentDraft, ListingDocumentAsset, ListingDocumentDraft, ListingImageAsset, PartFormData } from "@/components/supplier/types";


export const LISTING_CERTIFICATION_TYPES = [
  "FAA 8130-3",
  "EASA Form 1",
  "Dual Release",
  "Certificate of Conformity",
  "OEM documentation",
  "Other",
  "No certification document",
] as const;

export type ListingCertificationType = (typeof LISTING_CERTIFICATION_TYPES)[number];
export type ListingDocumentReviewStatus = "Not reviewed" | "Pending review" | "Under review" | "Reviewed";
export type ListingDocumentVerificationStatus = "Not verified" | "Verified" | "Rejected" | "Expired" | "Replaced";

export const LISTING_STATUSES = ["Draft", "Published", "Reserved", "Sold", "Inactive", "Archived"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export interface ListingLifecycleContext {
  rfqCount: number;
  quoteCount: number;
  orderCount: number;
  shipmentCount: number;
  invoiceCount: number;
  hasHistory: boolean;
}


export interface PartCertificationDocument {
  id: string;
  part_id: string;
  supplier_id: string;
  document_type: ListingCertificationType;
  filename: string;
  storage_path: string;
  upload_status: "Uploaded" | "Upload Failed";
  uploaded_at: string;
  review_status: ListingDocumentReviewStatus;
  verification_status: ListingDocumentVerificationStatus;
  expiry_date: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reviewed_by_admin: string | null;
  verified_at: string | null;
  verified_by: string | null;
  verified_by_admin: string | null;
  reviewer_notes: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Part {
  id: string;
  supplier_id: string;
  part_number: string;
  alternate_part_number: string | null;
  description: string | null;
  manufacturer: string | null;
  serial_number: string | null;
  aircraft_manufacturer: string | null;
  aircraft_model: string | null;
  engine_manufacturer: string | null;
  engine_model: string | null;
  ata_chapter: string | null;
  category: string | null;
  condition: string | null;
  quantity: number;
  unit_price: number | null;
  currency: string;
  price_type: "fixed" | "negotiable" | "request_quote" | string;
  price_basis: "unit" | "lot" | string;
  lot_size: number | null;
  minimum_order_quantity: number;
  stock_location: string | null;
  availability: string | null;
  lead_time: string | null;
  incoterms: string | null;
  payment_terms: string | null;
  price_valid_until: string | null;
  trace_certificate: string | null;
  tsn: string | null;
  tso: string | null;
  maintenance_notes: string | null;
  shelf_life_expiry: string | null;
  hazmat: boolean;
  featured: boolean;
  status: ListingStatus | string;
  image_urls: string[] | null;
  document_urls: string[] | null;
  created_at: string;
  updated_at?: string | null;
}

function normalizeOptional(value?: string | null) {
  return value?.trim() || null;
}

function buildPartPayload(formData: PartFormData) {
  return {
    part_number: formData.partNumber.trim(),
    alternate_part_number: normalizeOptional(formData.alternatePartNumber),
    description: normalizeOptional(formData.description),
    manufacturer: normalizeOptional(formData.manufacturer),
    serial_number: normalizeOptional(formData.serialNumber),
    aircraft_manufacturer: normalizeOptional(formData.aircraftManufacturer),
    aircraft_model: normalizeOptional(formData.aircraftModel),
    engine_manufacturer: normalizeOptional(formData.engineManufacturer),
    engine_model: normalizeOptional(formData.engineModel),
    ata_chapter: normalizeOptional(formData.ataChapter),
    category: normalizeOptional(formData.category),
    condition: normalizeOptional(formData.condition),
    quantity: Number(formData.quantity) || 0,
    unit_price: formData.priceType === "request_quote" ? null : Number(formData.unitPrice),
    currency: formData.currency || "USD",
    price_type: formData.priceType,
    price_basis: formData.priceBasis,
    lot_size: formData.priceBasis === "lot" ? Number(formData.lotSize) : null,
    minimum_order_quantity: Number(formData.minimumOrderQuantity) || 1,
    stock_location: normalizeOptional(formData.stockLocation),
    availability: normalizeOptional(formData.availability),
    lead_time: normalizeOptional(formData.leadTime),
    incoterms: normalizeOptional(formData.incoterms),
    payment_terms: normalizeOptional(formData.paymentTerms),
    price_valid_until: normalizeOptional(formData.priceValidUntil),
    trace_certificate: normalizeOptional(formData.traceCertificate),
    tsn: normalizeOptional(formData.tsn),
    tso: normalizeOptional(formData.tso),
    maintenance_notes: normalizeOptional(formData.maintenanceNotes),
    shelf_life_expiry: normalizeOptional(formData.shelfLifeExpiry),
    hazmat: Boolean(formData.hazmat),
    featured: Boolean(formData.featured),
    status: formData.status || "Draft",
  };
}

async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

  return user;
}

async function uploadFiles(
  bucket: string,
  userId: string,
  files: File[],
  onProgress?: (completed: number, total: number) => void
) {
  const uploaded: { path: string; url: string }[] = [];
  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      if (bucket === "part-images") {
        if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name}: maximum image size is 8 MB.`);
        if (!["image/jpeg","image/png","image/webp"].includes(file.type)) throw new Error(`${file.name}: use JPG, PNG or WebP.`);
      }
      if (bucket === "documents") {
        if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name}: maximum document size is 10 MB.`);
        const extension = file.name.split(".").pop()?.toLowerCase();
        if (!extension || !["pdf","jpg","jpeg","png","webp","doc","docx","txt"].includes(extension)) throw new Error(`${file.name}: unsupported document type.`);
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${userId}/${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      uploaded.push({ path: filePath, url: data.publicUrl });
      onProgress?.(index + 1, files.length);
    }
    return uploaded;
  } catch (error) {
    if (uploaded.length) await supabase.storage.from(bucket).remove(uploaded.map((item) => item.path));
    throw error;
  }
}

function normalizeDocumentUploadStatus(value: string): "Uploaded" | "Upload Failed" {
  return value === "Upload Failed" ? "Upload Failed" : "Uploaded";
}

export async function getSupplierListingDocuments(partId: string): Promise<ListingDocumentAsset[]> {
  try {
    const user = await getAuthenticatedUser();
    const { data, error } = await supabase.from("part_listing_documents").select("id, storage_path, filename, document_type, upload_status, uploaded_at").eq("part_id", partId).eq("supplier_id", user.id).order("created_at", { ascending: false });
    if (error) throw error;
    if (data?.length) return (data ?? []).map((row) => ({
      id: row.id,
      storagePath: row.storage_path,
      filename: row.filename,
      documentType: row.document_type,
      uploadStatus: normalizeDocumentUploadStatus(row.upload_status),
      uploadedAt: row.uploaded_at,
    }));
    const { data: part } = await supabase.from("parts").select("document_urls").eq("id", partId).eq("supplier_id", user.id).maybeSingle();
    return (part?.document_urls ?? []).map((storagePath: string, index: number) => ({ id: `legacy-doc-${index}-${storagePath}`, storagePath, filename: storagePath.split("/").pop() || "supporting-document", documentType: "Supporting document", uploadStatus: "Uploaded", uploadedAt: "" }));
  } catch (error) {
    console.error("GET SUPPLIER LISTING DOCUMENTS ERROR:", error);
    return [];
  }
}

export async function getSupplierListingImages(partId: string): Promise<ListingImageAsset[]> {
  try {
    const user = await getAuthenticatedUser();
    const { data, error } = await supabase
      .from("part_listing_images")
      .select("id, storage_path, public_url, filename, alt_text, sort_order, is_primary")
      .eq("part_id", partId)
      .eq("supplier_id", user.id)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      storagePath: row.storage_path,
      publicUrl: row.public_url,
      filename: row.filename,
      altText: row.alt_text ?? "",
      sortOrder: row.sort_order,
      isPrimary: row.is_primary,
    })) as ListingImageAsset[];
  } catch (error) {
    console.error("GET SUPPLIER LISTING IMAGES ERROR:", error);
    return [];
  }
}


async function uploadListingCertificationDocuments(
  partId: string,
  supplierId: string,
  documents: CertificationDocumentDraft[]
) {
  if (!documents.length) return;
  const createdPaths: string[] = [];
  try {
    for (const document of documents) {
      if (document.file.size > 10 * 1024 * 1024) throw new Error(`${document.file.name} is larger than 10 MB.`);
      const extension = document.file.name.split(".").pop()?.toLowerCase();
      if (!extension || !["pdf","jpg","jpeg","png"].includes(extension)) throw new Error(`${document.file.name}: certification files must be PDF, JPG or PNG.`);
      const safeName = document.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${supplierId}/${partId}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("part-certification-documents").upload(path, document.file, { upsert: false, contentType: document.file.type || "application/octet-stream" });
      if (uploadError) throw uploadError;
      createdPaths.push(path);
      const { error: rowError } = await supabase.from("part_certification_documents").insert({
        part_id: partId, supplier_id: supplierId, document_type: document.documentType,
        filename: document.file.name, storage_path: path, upload_status: "Uploaded",
        expiry_date: document.expiryDate || null, verification_status: "Not verified", uploaded_by: supplierId,
      });
      if (rowError) throw rowError;
    }
  } catch (error) {
    if (createdPaths.length) await supabase.storage.from("part-certification-documents").remove(createdPaths);
    throw error;
  }
}

async function deleteStorageObjects(bucket: string, paths: (string | null)[]) {
  const clean = paths.filter((value): value is string => Boolean(value));
  if (clean.length) await supabase.storage.from(bucket).remove(clean);
}

async function assertNoDuplicateSerializedListing(partId: string | null, formData: PartFormData, supplierId: string) {
  const serial = formData.serialNumber.trim();
  if (!serial) return;
  let query = supabase
    .from("parts")
    .select("id,part_number,serial_number")
    .eq("supplier_id", supplierId)
    .in("status", ["Draft", "Published", "Reserved", "Inactive"])
    .ilike("part_number", formData.partNumber.trim())
    .ilike("serial_number", serial)
    .limit(1);
  if (partId) query = query.neq("id", partId);
  const { data, error } = await query;
  if (error) throw error;
  if (data?.length) throw new Error(`This serialized item is already listed as ${data[0].part_number} / serial ${data[0].serial_number}. A serialized physical item should only have one active listing.`);
}

function validateCommercialTerms(formData: PartFormData) {
  if (!formData.priceType) throw new Error("Select a pricing method.");
  if (!formData.priceBasis) throw new Error("Select whether the displayed price is per unit or per lot.");
  if (formData.priceType === "request_quote") {
    if (formData.unitPrice !== null && Number(formData.unitPrice) !== 0) throw new Error("Request Quote listings must not contain a numeric displayed price.");
  } else if (formData.unitPrice === null || !Number.isFinite(Number(formData.unitPrice)) || Number(formData.unitPrice) < 0) {
    throw new Error("Enter a valid non-negative price for Fixed or Negotiable pricing.");
  }
  if (!Number.isInteger(Number(formData.quantity)) || Number(formData.quantity) <= 0) throw new Error("Quantity must be a positive whole number.");
  if (!['USD','EUR','GBP','KES','AED','ZAR'].includes(formData.currency)) throw new Error("Select a supported currency.");
  if (!['In stock','Limited stock','On request','Made to order'].includes(formData.availability)) throw new Error("Select a supported availability option.");
  if (formData.priceBasis === "lot" && (!formData.lotSize || !Number.isInteger(Number(formData.lotSize)) || Number(formData.lotSize) <= 0)) throw new Error("Lot pricing requires a positive whole-number lot size.");
  if (formData.priceBasis === "lot" && Number(formData.lotSize) > Number(formData.quantity)) throw new Error("Lot size cannot exceed available quantity.");
  if (!Number.isInteger(Number(formData.minimumOrderQuantity)) || Number(formData.minimumOrderQuantity) <= 0) throw new Error("Minimum order quantity must be a positive whole number.");
  if (Number(formData.minimumOrderQuantity) > Number(formData.quantity)) throw new Error("Minimum order quantity cannot exceed available quantity.");
  if (formData.priceBasis === "lot" && (Number(formData.minimumOrderQuantity) < Number(formData.lotSize) || Number(formData.minimumOrderQuantity) % Number(formData.lotSize) !== 0)) throw new Error("For lot pricing, minimum order quantity must be one or more complete lots.");
  if (formData.priceValidUntil && new Date(formData.priceValidUntil + "T00:00:00") < new Date(new Date().toDateString())) throw new Error("Price validity date cannot be in the past.");
}

/* ==========================================================
   CREATE PART
========================================================== */

export async function createPart(formData: PartFormData, onUploadProgress?: (completed: number, total: number) => void) {
  try {
    const user = await getAuthenticatedUser();
    if (!formData.partNumber.trim()) throw new Error("Part number is required.");
    if (!formData.description.trim()) throw new Error("Part description is required.");
    if (!formData.manufacturer.trim()) throw new Error("Manufacturer is required.");
    if (Number(formData.quantity) <= 0) throw new Error("Quantity must be greater than zero.");
    validateCommercialTerms(formData);
    await assertNoDuplicateSerializedListing(null, formData, user.id);

    const createdStoragePaths: { bucket: string; path: string }[] = [];
    const { data: created, error: createError } = await supabase.from("parts").insert({
      supplier_id: user.id, ...buildPartPayload(formData), image_urls: [], document_urls: [],
    }).select("id").single();
    if (createError) throw createError;

    try {
      const imageDrafts = formData.imageDrafts ?? (formData.images ?? []).map((file) => ({ id: crypto.randomUUID(), file, previewUrl: "", filename: file.name, altText: `${formData.manufacturer || "Aircraft part"} ${formData.partNumber}`, uploadStatus: "Ready" as const, progress: 0 }));
      const imageUploads = await uploadFiles("part-images", user.id, imageDrafts.map((item) => item.file), onUploadProgress);
      imageUploads.forEach((item) => createdStoragePaths.push({ bucket: "part-images", path: item.path }));
      const documentDrafts = formData.documentDrafts ?? (formData.documents ?? []).map((file) => ({ id: crypto.randomUUID(), documentType: "Supporting document", file, uploadStatus: "Ready" as const, progress: 0 }));
      const documentUploads = await uploadFiles("documents", user.id, documentDrafts.map((item) => item.file), onUploadProgress);
      documentUploads.forEach((item) => createdStoragePaths.push({ bucket: "documents", path: item.path }));
      const imageRowsRaw = imageUploads.map((item, index) => ({
        part_id: created.id, supplier_id: user.id, storage_path: item.path, public_url: item.url,
        filename: imageDrafts[index].filename, alt_text: imageDrafts[index].altText,
        sort_order: index, is_primary: Boolean(imageDrafts[index].isPrimary),
      }));
      const primaryIndex = imageRowsRaw.findIndex((row) => row.is_primary);
      const imageRows = (primaryIndex > 0 ? [...imageRowsRaw.slice(primaryIndex), ...imageRowsRaw.slice(0, primaryIndex)] : imageRowsRaw).map((row, index) => ({ ...row, sort_order: index, is_primary: index === 0 }));
      if (imageRows.length) {
        const { error } = await supabase.from("part_listing_images").insert(imageRows);
        if (error) throw error;
      }
      const docRows = documentUploads.map((item, index) => ({
        part_id: created.id, supplier_id: user.id, storage_path: item.path,
        filename: documentDrafts[index].file.name, document_type: documentDrafts[index].documentType, upload_status: "Uploaded",
      }));
      if (docRows.length) {
        const { error } = await supabase.from("part_listing_documents").insert(docRows);
        if (error) throw error;
      }
      const { error: updateError } = await supabase.from("parts").update({
        image_urls: imageRows.map((row) => row.public_url), document_urls: documentUploads.map((row) => row.path),
      }).eq("id", created.id).eq("supplier_id", user.id);
      if (updateError) throw updateError;
      await uploadListingCertificationDocuments(created.id, user.id, formData.certificationDocuments ?? []);
      return { success: true as const, id: created.id };
    } catch (error) {
      for (const item of createdStoragePaths) await deleteStorageObjects(item.bucket, [item.path]);
      // Uploaded paths are cleaned inside each upload helper on failure. Delete the draft row as a final guard.
      await supabase.rpc("hard_delete_clean_draft_listing", { p_part_id: created.id });
      throw error;
    }
  } catch (error) {
    console.error("CREATE PART ERROR:", error);
    return { success: false as const, error };
  }
}

export async function updatePart(partId: string, formData: PartFormData, onUploadProgress?: (completed: number, total: number) => void) {
  try {
    const user = await getAuthenticatedUser();
    validateCommercialTerms(formData);
    await assertNoDuplicateSerializedListing(partId, formData, user.id);
    const { data: existing, error: existingError } = await supabase.from("parts").select("id, image_urls, document_urls, status").eq("id", partId).eq("supplier_id", user.id).maybeSingle();
    if (existingError) throw existingError;
    if (!existing) throw new Error("Part not found or you do not own this part.");
    if (["Reserved", "Sold", "Archived"].includes(existing.status)) throw new Error(`This ${existing.status.toLowerCase()} listing is historical and cannot be edited.`);
    const lifecycleContext = await getListingLifecycleContext(partId);
    if (lifecycleContext.hasHistory) {
      throw new Error("This listing has RFQ, quote, order, shipment or invoice history and is protected from content edits. Preserve the historical record and create a new listing for materially different commercial terms.");
    }

    const existingImages = formData.existingImages ?? (existing.image_urls ?? []).map((url, index) => ({
      id: `legacy-${index}-${url}`, storagePath: null, publicUrl: url, filename: url.split("/").pop() || "part-image", altText: `${formData.manufacturer || "Aircraft part"} ${formData.partNumber}`, sortOrder: index, isPrimary: index === 0,
    }));
    const imageDrafts = formData.imageDrafts ?? (formData.images ?? []).map((file) => ({ id: crypto.randomUUID(), file, previewUrl: "", filename: file.name, altText: `${formData.manufacturer || "Aircraft part"} ${formData.partNumber}`, uploadStatus: "Ready" as const, progress: 0 }));
    const newImageUploads = await uploadFiles("part-images", user.id, imageDrafts.map((item) => item.file), onUploadProgress);
    const documentDrafts = formData.documentDrafts ?? (formData.documents ?? []).map((file) => ({ id: crypto.randomUUID(), documentType: "Supporting document", file, uploadStatus: "Ready" as const, progress: 0 }));
    const newDocumentUploads = await uploadFiles("documents", user.id, documentDrafts.map((item) => item.file), onUploadProgress);

    const newImageRows = newImageUploads.map((item, index) => ({
      part_id: partId, supplier_id: user.id, storage_path: item.path, public_url: item.url,
      filename: imageDrafts[index].filename, alt_text: imageDrafts[index].altText,
      sort_order: index, is_primary: Boolean(imageDrafts[index].isPrimary),
    }));
    const newPrimaryIndex = newImageRows.findIndex((row) => row.is_primary);
    const orderedRows = newPrimaryIndex >= 0
      ? [...newImageRows.slice(newPrimaryIndex), ...newImageRows.slice(0, newPrimaryIndex), ...existingImages.map((item) => ({
          part_id: partId, supplier_id: user.id, storage_path: item.storagePath, public_url: item.publicUrl,
          filename: item.filename, alt_text: item.altText, sort_order: 0, is_primary: false,
        }))]
      : [...existingImages.map((item) => ({
          part_id: partId, supplier_id: user.id, storage_path: item.storagePath, public_url: item.publicUrl,
          filename: item.filename, alt_text: item.altText, sort_order: 0, is_primary: item.isPrimary,
        })), ...newImageRows];
    const imageRows = orderedRows.map((row, index) => ({ ...row, sort_order: index, is_primary: index === 0 }));

    try {
      const { data: currentRows } = await supabase.from("part_listing_images").select("id, storage_path, public_url").eq("part_id", partId).eq("supplier_id", user.id);
      const keepUrls = new Set(imageRows.map((row) => row.public_url));
      const removedRows = (currentRows ?? []).filter((row) => !keepUrls.has(row.public_url));
      const removedStoragePaths = removedRows.map((row) => row.storage_path);
      const currentByUrl = new Map((currentRows ?? []).map((row) => [row.public_url, row.id]));
      const existingRows = imageRows.filter((row) => currentByUrl.has(row.public_url));
      for (const row of existingRows) {
        const id = currentByUrl.get(row.public_url);
        const { error } = await supabase.from("part_listing_images").update({ alt_text: row.alt_text, sort_order: row.sort_order, is_primary: row.is_primary, filename: row.filename }).eq("id", id).eq("supplier_id", user.id);
        if (error) throw error;
      }
      const newRowsOnly = imageRows.filter((row) => !currentByUrl.has(row.public_url));
      if (newRowsOnly.length) {
        const { error } = await supabase.from("part_listing_images").insert(newRowsOnly);
        if (error) throw error;
      }
      if (removedRows.length) {
        const { error } = await supabase.from("part_listing_images").delete().in("id", removedRows.map((row) => row.id)).eq("supplier_id", user.id);
        if (error) throw error;
      }
      if (removedStoragePaths.length) await deleteStorageObjects("part-images", removedStoragePaths);

      const keptDocuments = formData.existingDocuments ?? (existing.document_urls ?? []).map((storagePath: string, index: number) => ({ id: `legacy-doc-${index}-${storagePath}`, storagePath, filename: storagePath.split("/").pop() || "supporting-document", documentType: "Supporting document", uploadStatus: "Uploaded" as const, uploadedAt: "" }));
      const { data: currentDocuments, error: currentDocumentsError } = await supabase.from("part_listing_documents").select("id, storage_path, filename, document_type, upload_status, uploaded_at").eq("part_id", partId).eq("supplier_id", user.id);
      if (currentDocumentsError) throw currentDocumentsError;
      const keptDocumentPaths = new Set(keptDocuments.map((doc) => doc.storagePath));
      const removedDocumentRows = (currentDocuments ?? []).filter((doc) => !keptDocumentPaths.has(doc.storage_path));
      const existingDocumentByPath = new Map((currentDocuments ?? []).map((doc) => [doc.storage_path, doc]));
      if (keptDocuments.some((doc) => !doc.id.startsWith("legacy-doc-") && existingDocumentByPath.has(doc.storagePath))) {
        for (const doc of keptDocuments.filter((item) => !item.id.startsWith("legacy-doc-") && existingDocumentByPath.has(item.storagePath))) {
          const current = existingDocumentByPath.get(doc.storagePath);
          const { error } = await supabase.from("part_listing_documents").update({ filename: doc.filename, document_type: doc.documentType, upload_status: doc.uploadStatus }).eq("id", current!.id).eq("supplier_id", user.id);
          if (error) throw error;
        }
      }
      if (newDocumentUploads.length) {
        const rows = newDocumentUploads.map((item, index) => ({
          part_id: partId, supplier_id: user.id, storage_path: item.path, filename: documentDrafts[index].file.name, document_type: documentDrafts[index].documentType, upload_status: "Uploaded" as const,
        }));
        const { error } = await supabase.from("part_listing_documents").insert(rows);
        if (error) throw error;
      }
      if (removedDocumentRows.length) {
        const { error } = await supabase.from("part_listing_documents").delete().in("id", removedDocumentRows.map((row) => row.id)).eq("supplier_id", user.id);
        if (error) throw error;
      }
      if (removedDocumentRows.length) await deleteStorageObjects("documents", removedDocumentRows.map((row) => row.storage_path));
      const finalDocumentPaths = [...keptDocuments.map((doc) => doc.storagePath), ...newDocumentUploads.map((row) => row.path)];
      const editablePayload = buildPartPayload(formData);
      const { status: _ignoredStatus, ...editableFields } = editablePayload;
      const { error: updateError } = await supabase.from("parts").update({
        ...editableFields, status: existing.status, image_urls: imageRows.map((row) => row.public_url),
        document_urls: finalDocumentPaths,
      }).eq("id", partId).eq("supplier_id", user.id);
      if (updateError) throw updateError;
      await uploadListingCertificationDocuments(partId, user.id, formData.certificationDocuments ?? []);
      return { success: true as const, id: partId };
    } catch (error) {
      if (newImageUploads.length) {
        await supabase.from("part_listing_images").delete().eq("part_id", partId).eq("supplier_id", user.id).in("storage_path", newImageUploads.map((item) => item.path));
        await deleteStorageObjects("part-images", newImageUploads.map((item) => item.path));
      }
      if (newDocumentUploads.length) {
        await supabase.from("part_listing_documents").delete().eq("part_id", partId).eq("supplier_id", user.id).in("storage_path", newDocumentUploads.map((item) => item.path));
        await deleteStorageObjects("documents", newDocumentUploads.map((item) => item.path));
      }
      throw error;
    }
  } catch (error) {
    console.error("UPDATE PART ERROR:", error);
    return { success: false as const, error };
  }
}

/* ==========================================================
   DELETE PART
========================================================== */

export async function getListingLifecycleContext(partId: string): Promise<ListingLifecycleContext> {
  const { data, error } = await supabase.rpc("get_listing_transaction_context", { p_part_id: partId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    rfqCount: Number(row?.rfq_count ?? 0),
    quoteCount: Number(row?.quote_count ?? 0),
    orderCount: Number(row?.order_count ?? 0),
    shipmentCount: Number(row?.shipment_count ?? 0),
    invoiceCount: Number(row?.invoice_count ?? 0),
    hasHistory: Boolean(row?.has_history),
  };
}

export async function transitionListingStatus(partId: string, targetStatus: ListingStatus) {
  try {
    const { data, error } = await supabase.rpc("transition_listing_status", { p_part_id: partId, p_target_status: targetStatus });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return { success: true as const, part: (row as Part) };
  } catch (error) {
    console.error("TRANSITION LISTING STATUS ERROR:", error);
    return { success: false as const, error };
  }
}

/**
 * Permanently removes a listing only when it is a clean Draft with no RFQ,
 * quote, order, shipment or invoice history. All other removal paths use
 * Inactive/Archived lifecycle states.
 */
export async function deletePart(partId: string) {
  try {
    const user = await getAuthenticatedUser();
    const { data: part, error: fetchError } = await supabase.from("parts").select("id,status").eq("id", partId).eq("supplier_id", user.id).maybeSingle();
    if (fetchError) throw fetchError;
    if (!part) throw new Error("Listing not found or you do not own this listing.");
    if (part.status !== "Draft") throw new Error("Only a clean Draft listing can be permanently deleted. Use Deactivate or Archive instead.");

    const [images, documents, certifications, context] = await Promise.all([
      supabase.from("part_listing_images").select("storage_path").eq("part_id", partId).eq("supplier_id", user.id),
      supabase.from("part_listing_documents").select("storage_path").eq("part_id", partId).eq("supplier_id", user.id),
      supabase.from("part_certification_documents").select("storage_path").eq("part_id", partId).eq("supplier_id", user.id),
      getListingLifecycleContext(partId),
    ]);
    if (context.hasHistory) throw new Error("This listing has business history and must be archived instead of deleted.");

    const { error } = await supabase.rpc("hard_delete_clean_draft_listing", { p_part_id: partId });
    if (error) throw error;

    await Promise.all([
      deleteStorageObjects("part-images", (images.data ?? []).map((row) => row.storage_path)),
      deleteStorageObjects("documents", (documents.data ?? []).map((row) => row.storage_path)),
      deleteStorageObjects("part-certification-documents", (certifications.data ?? []).map((row) => row.storage_path)),
    ]);

    return { success: true as const };
  } catch (error) {
    console.error("DELETE PART ERROR:", error);
    return { success: false as const, error };
  }
}

/* ==========================================================
   SUPPLIER PARTS
========================================================== */

export async function getSupplierParts(): Promise<Part[]> {
  try {
    const user = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from("parts")
      .select("*")
      .eq("supplier_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []) as Part[];
  } catch (error) {
    console.error("GET SUPPLIER PARTS ERROR:", error);
    return [];
  }
}

export async function getSupplierListingCertificationDocuments(partId: string): Promise<PartCertificationDocument[]> {
  try { const user = await getAuthenticatedUser(); const { data, error } = await supabase.from("part_certification_documents").select("*").eq("part_id", partId).eq("supplier_id", user.id).order("uploaded_at", { ascending: false }); if (error) throw error; return (data ?? []) as PartCertificationDocument[]; } catch (error) { console.error("GET SUPPLIER LISTING CERTIFICATION DOCUMENTS ERROR:", error); return []; }
}

export async function getSupplierPartById(
  partId: string
): Promise<Part | null> {
  try {
    const user = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from("parts")
      .select("*")
      .eq("id", partId)
      .eq("supplier_id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as Part | null) ?? null;
  } catch (error) {
    console.error("GET SUPPLIER PART ERROR:", error);
    return null;
  }
}

/* ==========================================================
   SINGLE PART
========================================================== */

export async function getPartById(
  partId: string
): Promise<Part | null> {
  try {
    const { data, error } = await supabase
      .from("parts")
      .select("*")
      .eq("id", partId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as Part | null) ?? null;
  } catch (error) {
    console.error("GET PART ERROR:", error);
    return null;
  }
}

/* ==========================================================
   MARKETPLACE
========================================================== */

export async function getMarketplaceParts(): Promise<Part[]> {
  try {
    const { data, error } = await supabase
      .from("parts")
      .select("*")
      .eq("status", "Published")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []) as Part[];
  } catch (error) {
    console.error("GET MARKETPLACE PARTS ERROR:", error);
    return [];
  }
}

export async function getMarketplacePartById(
  partId: string
): Promise<Part | null> {
  try {
    const { data, error } = await supabase
      .from("parts")
      .select("*")
      .eq("id", partId)
      .eq("status", "Published")
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as Part | null) ?? null;
  } catch (error) {
    console.error("GET MARKETPLACE PART ERROR:", error);
    return null;
  }
}

/* ==========================================================
   SEARCH
========================================================== */

export async function searchParts(
  search: string
): Promise<Part[]> {
  const query = search.trim();

  if (!query) {
    return getMarketplaceParts();
  }

  try {
    const { data, error } = await supabase
      .from("parts")
      .select("*")
      .eq("status", "Published")
      .or(
        `part_number.ilike.%${query}%,description.ilike.%${query}%,manufacturer.ilike.%${query}%`
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []) as Part[];
  } catch (error) {
    console.error("SEARCH PARTS ERROR:", error);
    return [];
  }
}
