export type AccountType = "buyer" | "supplier" | "admin";
export type RegistrationAccountType = "buyer" | "hybrid";

export interface RegistrationData {
  accountType: RegistrationAccountType;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  companyName: string;
  businessType: string;
  website: string;
  registrationNumber: string;
  jobTitle: string;
  address: string;
  city: string;

  // Buyer onboarding
  procurementRole: string;
  buyerCategories: string[];
  procurementPriorities: string[];
  certificationRequirements: string[];
  preferredSupplierCriteria: string[];

  // Supplier onboarding
  supplierType: string;
  supplierCategories: string[];
  aircraftSpecialties: string[];
  geographicCoverage: string[];
  aviationCapabilities: string[];
  certifications: string[];
  traceabilityCapabilities: string[];
  qualityInformation: string;
  shippingCapabilities: string[];
  commercialTerms: string;
  verificationNotes: string;

  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  subscribeNewsletter: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  account_type: AccountType;
  account_roles?: AccountType[];
  full_name: string;
  email: string;
  onboarding_status?: "in_progress" | "complete";
  onboarding_completion?: number;
  onboarding_data?: Record<string, unknown>;
  created_at?: string;
}
