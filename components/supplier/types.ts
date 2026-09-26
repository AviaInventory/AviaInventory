export interface CertificationDocumentDraft {
  id: string;
  documentType: string;
  file: File;
  expiryDate: string;
}

export interface ListingImageDraft {
  id: string;
  file: File;
  previewUrl: string;
  filename: string;
  altText: string;
  uploadStatus: "Ready" | "Uploading" | "Uploaded" | "Upload Failed";
  progress: number;
  isPrimary?: boolean;
}

export interface ListingImageAsset {
  id: string;
  storagePath: string | null;
  publicUrl: string;
  filename: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ListingDocumentAsset {
  id: string;
  storagePath: string;
  filename: string;
  documentType: string;
  uploadStatus: "Uploaded" | "Upload Failed";
  uploadedAt: string;
}

export interface ListingDocumentDraft {
  id: string;
  documentType: string;
  file: File;
  uploadStatus: "Ready" | "Uploading" | "Uploaded" | "Upload Failed";
  progress: number;
  isPrimary?: boolean;
}

export interface PartFormData {
  partNumber: string;
  alternatePartNumber: string;
  description: string;
  manufacturer: string;
  serialNumber: string;
  aircraftManufacturer: string;
  aircraftModel: string;
  engineManufacturer: string;
  engineModel: string;
  ataChapter: string;
  category: string;
  condition: string;
  quantity: number;
  unitPrice: number | null;
  currency: string;
  priceType: "fixed" | "negotiable" | "request_quote";
  priceBasis: "unit" | "lot";
  lotSize: number | null;
  minimumOrderQuantity: number;
  stockLocation: string;
  availability: string;
  leadTime: string;
  incoterms: string;
  paymentTerms: string;
  priceValidUntil: string;
  traceCertificate: string;
  tsn: string;
  tso: string;
  maintenanceNotes: string;
  shelfLifeExpiry: string;
  hazmat: boolean;
  featured: boolean;
  status: string;
  images: File[];
  imageDrafts?: ListingImageDraft[];
  existingImageUrls?: string[];
  existingImages?: ListingImageAsset[];
  removedImageIds?: string[];
  documents: File[];
  documentDrafts?: ListingDocumentDraft[];
  existingDocuments?: ListingDocumentAsset[];
  certificationDocuments: CertificationDocumentDraft[];
  existingListingDocuments?: ListingDocumentDraft[];
}
