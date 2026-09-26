"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FileText, MapPin, ShieldCheck, Star } from "lucide-react";
import { certificationKind, TrustBadge } from "@/components/trust/TrustBadge";
import VerificationStatusBadge from "@/components/supplier/verification/VerificationStatusBadge";
import type { CertificationDocumentDraft, PartFormData } from "./types";
import type { PartCertificationDocument } from "@/lib/parts";
import type { ListingImageAsset } from "./types";

interface BuyerListingPreviewProps { formData: PartFormData; existingImages?: ListingImageAsset[]; existingCertificationDocuments: PartCertificationDocument[]; supplier: { name: string; verificationStatus: string; rating: number | null; reviewCount: number; city: string | null; country: string | null; }; }
export default function BuyerListingPreview({ formData, existingImages = [], existingCertificationDocuments, supplier }: BuyerListingPreviewProps) {
  const imageUrl = existingImages[0]?.publicUrl ?? formData.existingImageUrls?.[0] ?? null;
  const localImage = formData.images[0];
  const [localObjectUrl, setLocalObjectUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!localImage) { setLocalObjectUrl(null); return; }
    const url = URL.createObjectURL(localImage);
    setLocalObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [localImage]);
  const previewImage = localObjectUrl ?? imageUrl;
  const uploadedDocs = existingCertificationDocuments.filter((doc) => doc.upload_status === "Uploaded");
  const draftDocs = formData.certificationDocuments as CertificationDocumentDraft[];
  const documentCount = uploadedDocs.length + draftDocs.length;
  const verifiedTypes = [...new Set(uploadedDocs.filter((doc) => doc.verification_status === "Verified").map((doc) => doc.document_type))];
  const supplierDeclared = formData.traceCertificate && formData.traceCertificate !== "No certification document" ? formData.traceCertificate : "No certification document";
  const location = [supplier.city, supplier.country].filter(Boolean).join(", ");
  return <div className="overflow-hidden rounded-2xl border border-aviation-border bg-white shadow-sm">
    <div className="border-b border-aviation-border bg-aviation-dark px-5 py-4 text-white sm:px-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/65">Buyer marketplace preview</p><p className="mt-1 text-sm text-white/80">Approximate buyer-facing rendering. Supplier-entered data is not independently verified unless explicitly marked below.</p></div><span className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/80">Preview only</span></div></div>
    <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
      <div className="border-b border-aviation-border bg-aviation-light lg:border-b-0 lg:border-r"><div className="relative aspect-[4/3] min-h-[260px] w-full bg-white">{previewImage ? <Image src={previewImage} alt={`${formData.partNumber || "Aircraft part"} primary image preview`} fill unoptimized className="object-contain p-5" /> : <div className="flex h-full items-center justify-center px-8 text-center text-sm text-aviation-muted">No primary image provided. Buyers will see the listing without a part image.</div>}<span className="absolute left-4 top-4 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-aviation-muted shadow-sm">Supplier-provided image</span></div>
        <div className="border-t border-aviation-border bg-white p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-aviation-muted">Supplier information</p><div className="mt-3 flex items-start justify-between gap-4"><div><p className="font-semibold text-aviation-dark">{supplier.name}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-aviation-muted"><MapPin size={13}/>{location || "Location not provided"}</p></div><VerificationStatusBadge status={supplier.verificationStatus} compact /></div><div className="mt-3 flex items-center gap-2 text-sm text-aviation-muted"><Star size={15} className="fill-aviation-accent text-aviation-accent" />{supplier.rating == null ? "No rating yet" : supplier.rating.toFixed(1)}<span>({supplier.reviewCount} {supplier.reviewCount === 1 ? "review" : "reviews"})</span></div></div></div>
      <div className="p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="break-words font-mono text-2xl font-bold tracking-wide text-aviation-primary">{formData.partNumber || "Part number not provided"}</p><p className="mt-1 text-sm font-medium text-aviation-dark">{formData.manufacturer || "Manufacturer not provided"}</p><p className="mt-2 text-sm leading-6 text-aviation-muted">{formData.description || "Buyer-facing description not provided."}</p></div><span className="rounded-full bg-aviation-success-soft px-3 py-1.5 text-xs font-semibold text-aviation-success">{formData.condition || "Condition not provided"}</span></div>
        <div className="mt-5 flex flex-wrap gap-2">{verifiedTypes.length ? verifiedTypes.map((type) => <TrustBadge key={type} kind={certificationKind(type)} compact />) : <span className="rounded-full border border-aviation-border bg-aviation-light px-3 py-1.5 text-xs font-semibold text-aviation-muted">No AviaInventory-verified document</span>}</div>
        <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-5 border-y border-aviation-border py-5 sm:grid-cols-3"><PreviewField label="Quantity" value={String(formData.quantity || 0)}/><PreviewField label="Price" value={formData.priceType === "request_quote" ? "Request a Quote" : `${formData.currency || "USD"} ${Number(formData.unitPrice || 0).toLocaleString()} ${formData.priceBasis === "lot" ? `per lot (${formData.lotSize || "?"} units)` : "per unit"}`} strong/><PreviewField label="Minimum order" value={String(formData.minimumOrderQuantity || 1)}/><PreviewField label="Availability" value={formData.availability || "Not provided"}/><PreviewField label="Lead time" value={formData.leadTime || "Not provided"}/><PreviewField label="Aircraft compatibility" value={[formData.aircraftManufacturer,formData.aircraftModel].filter(Boolean).join(" ") || "Not provided"}/><PreviewField label="Engine compatibility" value={[formData.engineManufacturer,formData.engineModel].filter(Boolean).join(" ") || "Not provided"}/><PreviewField label="ATA chapter" value={formData.ataChapter || "Not provided"}/></div>
        <div className="mt-5 rounded-xl border border-aviation-border bg-aviation-light p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-aviation-muted">Certification & documents</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><div><p className="text-[11px] font-semibold uppercase tracking-wide text-aviation-muted">Supplier-provided information</p><p className="mt-1 text-sm font-medium text-aviation-dark">{supplierDeclared}</p></div><div><p className="text-[11px] font-semibold uppercase tracking-wide text-aviation-muted">Uploaded documentation</p><p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-aviation-dark"><FileText size={15}/>{documentCount ? `${documentCount} document${documentCount===1?"":"s"} available` : "No document uploaded"}</p></div></div><div className="mt-3 flex gap-2 border-t border-aviation-border pt-3 text-xs leading-5 text-aviation-muted"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-aviation-primary"/>Only documents explicitly marked Verified by AviaInventory appear as certification trust badges. Supplier declarations and uploads do not become verified automatically.</div></div>
      </div>
    </div>
  </div>;
}
function PreviewField({label,value,strong=false}:{label:string;value:string;strong?:boolean}){return <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-aviation-muted">{label}</p><p className={`mt-1 break-words text-sm ${strong?"font-bold text-aviation-primary":"font-medium text-aviation-dark"}`}>{value}</p></div>}
