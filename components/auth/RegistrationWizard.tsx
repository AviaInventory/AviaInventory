"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type UseFormRegister } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Info, Pencil, Save, Wrench, Building2, ShoppingCart, PlaneTakeoff, Boxes, FileCheck2, Truck, LockKeyhole } from "lucide-react";
import toast from "react-hot-toast";
import { isPossiblePhoneNumber } from "libphonenumber-js";
import StepIndicator from "./StepIndicator";
import CheckEmailNotice from "./CheckEmailNotice";
import { registerUser } from "@/lib/auth";
import { dashboardPathForRoles } from "@/lib/auth-redirect";
import { PASSWORD_REQUIREMENTS_TEXT, isStrongPassword } from "@/lib/password-policy";
import { PasswordChecklist } from "./PasswordInput";
import { COUNTRIES, findCountryByName, phoneWithDialCode } from "@/lib/countries";
import type { RegistrationAccountType, RegistrationData } from "@/types/auth";
import RequiredMark from "@/components/ui/RequiredMark";
import MroCapabilityDialog from "@/components/mro/MroCapabilityDialog";
import { EMPTY_MRO_PROFILE, readMroDraft, writeMroDraft, type MroProfile } from "@/lib/mro-form";

const STORAGE_KEY = "aviainventory_onboarding_draft_v2";

const categories = ["Airframes", "Engines", "Avionics", "Components", "Landing Gear", "Consumables", "Electrical", "Safety Equipment"];
const supplierCategories = [...categories, "Rotables", "Aircraft Interiors", "Ground Support Equipment"];
const certifications = ["FAA 8130-3", "EASA Form 1", "Certificate of Conformity", "Maintenance Release", "ISO / Quality certification", "Other approval"];
const priorities = ["Certification / traceability", "Price", "Lead time", "Supplier reputation", "Location", "Warranty", "AOG availability"];
const capabilities = ["AOG support", "Repair / overhaul", "Component testing", "Aircraft dismantling", "Engine services", "Avionics services", "Kitting", "Stocking / warehousing"];

const schema = z.object({
  accountType: z.enum(["buyer", "hybrid"]),
  fullName: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid business email."),
  phone: z.string().trim().refine((value) => isPossiblePhoneNumber(value), "Enter a valid phone number, including the country code (e.g. +254 712 345 678)."),
  country: z.string().trim().min(2, "Select your country."),
  companyName: z.string().trim().min(2, "Enter your company name."),
  businessType: z.string().min(1, "Select your business type."),
  website: z.string().trim().optional(),
  registrationNumber: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  procurementRole: z.string().optional(),
  buyerCategories: z.array(z.string()),
  procurementPriorities: z.array(z.string()),
  certificationRequirements: z.array(z.string()),
  preferredSupplierCriteria: z.array(z.string()),
  supplierType: z.string().optional(),
  mroCapable: z.boolean(),
  supplierCategories: z.array(z.string()),
  aircraftSpecialties: z.array(z.string()),
  geographicCoverage: z.array(z.string()),
  aviationCapabilities: z.array(z.string()),
  certifications: z.array(z.string()),
  traceabilityCapabilities: z.array(z.string()),
  qualityInformation: z.string().optional(),
  shippingCapabilities: z.array(z.string()),
  commercialTerms: z.string().optional(),
  verificationNotes: z.string().optional(),
  password: z.string().refine(isStrongPassword, PASSWORD_REQUIREMENTS_TEXT),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine(Boolean, "You must accept the Terms & Conditions."),
  subscribeNewsletter: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

type FormValues = z.infer<typeof schema>;

const defaults: RegistrationData = {
  accountType: "buyer", fullName: "", email: "", phone: "", country: "", companyName: "", businessType: "", website: "", registrationNumber: "", jobTitle: "", address: "", city: "",
  procurementRole: "", buyerCategories: [], procurementPriorities: [], certificationRequirements: [], preferredSupplierCriteria: [],
  supplierType: "", mroCapable: false, supplierCategories: [], aircraftSpecialties: [], geographicCoverage: [], aviationCapabilities: [], certifications: [], traceabilityCapabilities: [], qualityInformation: "", shippingCapabilities: [], commercialTerms: "", verificationNotes: "",
  password: "", confirmPassword: "", agreeTerms: false, subscribeNewsletter: false,
};

// Compact form styling: label beside the input on desktop, small controls, inline checkboxes.
const inputBase = "h-10 w-full rounded-md border bg-white px-2.5 text-[15px] text-aviation-dark outline-none transition focus:ring-2 focus:ring-aviation-primary/20 sm:h-8 sm:text-[13px]";
const inputBorder = (error?: string) => (error ? "border-red-500" : "border-aviation-border focus:border-aviation-primary");
const textareaClass = "w-full rounded-md border border-aviation-border bg-white px-2.5 py-1.5 text-[15px] text-aviation-dark outline-none sm:text-[13px] focus:border-aviation-primary focus:ring-2 focus:ring-aviation-primary/20";

function Row({ label, htmlFor, required = false, optional = false, hint, error, errorId, children }: { label: string; htmlFor?: string; required?: boolean; optional?: boolean; hint?: string; error?: string; errorId?: string; children: React.ReactNode }) {
  const LabelTag = htmlFor ? "label" : "p";
  return <div className="grid gap-x-5 gap-y-1 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-start">
    <LabelTag {...(htmlFor ? { htmlFor } : {})} className="text-[13px] font-semibold text-aviation-dark sm:pt-1.5">{label}{required && <RequiredMark />}{optional && <span className="ml-1 font-normal text-aviation-muted">(optional)</span>}</LabelTag>
    <div className="min-w-0">
      {children}
      {hint && !error && <p className="mt-1 text-xs italic text-aviation-muted">{hint}</p>}
      {error && <p id={errorId} className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  </div>;
}

function Field({ label, name, register, error, required = false, placeholder, type = "text", hint }: { label: string; name: keyof FormValues; register: UseFormRegister<FormValues>; error?: string; required?: boolean; placeholder?: string; type?: string; hint?: string }) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  return <Row label={label} htmlFor={name} required={required} hint={hint} error={error} errorId={`${name}-error`}>
    <div className="relative">
      <input id={name} type={isPassword && revealed ? "text" : type} placeholder={placeholder} autoComplete={isPassword ? "new-password" : undefined} {...register(name)} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className={`${inputBase} ${isPassword ? "pr-10" : ""} ${inputBorder(error)}`} />
      {isPassword && <button type="button" onClick={() => setRevealed((shown) => !shown)} aria-label={revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={revealed} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-aviation-muted hover:text-aviation-primary">{revealed ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
    </div>
  </Row>;
}

function ChoiceGrid({ title, description, options, value, onChange, columns = "grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3" }: { title: string; description?: string; options: string[]; value: string[]; onChange: (next: string[]) => void; columns?: string }) {
  const toggle = (item: string) => onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);
  return <Row label={title} hint={description}>
    <div role="group" aria-label={title} className={`grid gap-x-4 gap-y-1 sm:pt-1.5 ${columns}`}>
      {options.map((item) => <label key={item} className="flex cursor-pointer items-center gap-2 py-0.5 text-[13px] text-aviation-dark">
        <input type="checkbox" checked={value.includes(item)} onChange={() => toggle(item)} className="h-3.5 w-3.5 shrink-0 rounded border-aviation-border accent-[var(--aviation-primary)]" />
        <span>{item}</span>
      </label>)}
    </div>
  </Row>;
}

function StepHeading({ title, text }: { title: string; text: string }) {
  return <div className="mb-5 border-b border-aviation-border pb-3"><h2 className="text-lg font-bold text-aviation-primary">{title}</h2><p className="mt-0.5 text-xs leading-5 text-aviation-muted">{text}</p></div>;
}

export default function RegistrationWizard({ initialAccountType }: { initialAccountType?: RegistrationAccountType }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  // True once we know whether to save: there was no draft, or the user chose continue/start new.
  const [draftLoaded, setDraftLoaded] = useState(false);
  // An unfinished registration saved in this browser, offered (not applied) on arrival.
  const [savedDraft, setSavedDraft] = useState<(Partial<FormValues> & { step?: number; savedAt?: string }) | null>(null);
  // Set after a successful registration so the auto-save can't write the finished account back.
  const completedRef = useRef(false);
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);
  const formTopRef = useRef<HTMLDivElement>(null);
  // Country chosen before the current one, so its dial code can be swapped out of the phone number.
  const previousCountryRef = useRef("");
  // MRO Capabilities & Approvals form, filled from the MRO Services page or the selling step.
  const [mroProfile, setMroProfile] = useState<MroProfile | null>(null);
  const [mroFormOpen, setMroFormOpen] = useState(false);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults as FormValues, mode: "onTouched" });
  const accountType = useWatch({ control: form.control, name: "accountType" });
  const data = form.watch();

  const isBuyer = true;
  const isSupplier = accountType === "hybrid";

  const steps = useMemo(() => {
    const base = [
      { key: "identity", label: "Account & contact", icon: Building2 },
      { key: "company", label: "Company", icon: Building2 },
    ];
    if (isBuyer) base.push({ key: "buying", label: "Buying profile", icon: ShoppingCart });
    if (isSupplier) base.push({ key: "selling", label: "Selling profile", icon: Boxes });
    if (isSupplier) base.push({ key: "compliance", label: "Trust & compliance", icon: FileCheck2 });
    if (isSupplier) base.push({ key: "logistics", label: "Logistics & terms", icon: Truck });
    base.push({ key: "security", label: "Security & finish", icon: LockKeyhole });
    return base;
  }, [isBuyer, isSupplier]);

  const totalSteps = steps.length;

  useEffect(() => {
    let draft: typeof savedDraft = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) draft = JSON.parse(saved);
    } catch { /* ignore corrupt local drafts */ }
    // An explicit link such as "Become a Supplier" (/register?type=supplier) sets the account type.
    if (initialAccountType) form.setValue("accountType", initialAccountType);
    const mroDraft = readMroDraft();
    if (mroDraft) {
      setMroProfile(mroDraft);
      applyMroAccount();
    }
    // Only offer drafts that contain something worth resuming.
    if (draft && (draft.email || draft.companyName || draft.fullName)) {
      setSavedDraft(draft);
    } else {
      setDraftLoaded(true);
    }
    // Runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** An MRO form was filled in: sign up as Buyer & Supplier, listed as an MRO. */
  function applyMroAccount() {
    form.setValue("accountType", "hybrid");
    form.setValue("supplierType", "MRO / Repair Station");
    form.setValue("mroCapable", true);
  }

  function saveMroForm(profile: MroProfile) {
    setMroProfile(profile);
    writeMroDraft(profile);
    form.setValue("mroCapable", true, { shouldDirty: true });
    setMroFormOpen(false);
    toast.success("MRO capabilities added. Carry on to finish creating your account.");
  }

  function resumeDraft() {
    if (!savedDraft) return;
    const savedAccountType = savedDraft.accountType as string | undefined;
    const normalizedAccountType = savedAccountType === "supplier" ? "hybrid" : savedDraft.accountType;
    const restored = Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => {
      const value = (savedDraft as Record<string, unknown>)[key];
      const sameShape = Array.isArray(fallback) ? Array.isArray(value) : typeof value === typeof fallback;
      return [key, sameShape ? value : fallback];
    }));
    form.reset({ ...restored, accountType: normalizedAccountType ?? defaults.accountType, password: "", confirmPassword: "" } as FormValues);
    previousCountryRef.current = savedDraft.country ?? "";
    setStep(Math.max(1, savedDraft.step || 1));
    if (mroProfile) applyMroAccount();
    setSavedDraft(null);
    setDraftLoaded(true);
  }

  function startNewRegistration() {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
    form.reset({ ...defaults, accountType: initialAccountType ?? defaults.accountType } as FormValues);
    if (mroProfile) applyMroAccount();
    previousCountryRef.current = "";
    setStep(1);
    setSavedDraft(null);
    setDraftLoaded(true);
  }

  useEffect(() => {
    if (!draftLoaded || completedRef.current) return;
    const { password: _password, confirmPassword: _confirmPassword, ...safeDraft } = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...safeDraft, step, savedAt: new Date().toISOString() }));
    } catch { /* storage unavailable (private mode): drafts just aren't saved */ }
  }, [data, step, draftLoaded]);

  const profileCompletion = useMemo(() => {
    const required = [data.fullName, data.email, data.phone, data.country, data.companyName, data.businessType, data.password, data.confirmPassword, data.agreeTerms];
    const optional = [
      data.jobTitle, data.website, data.registrationNumber, data.address, data.city,
      ...(isBuyer ? [data.procurementRole, data.buyerCategories.length ? "yes" : "", data.procurementPriorities.length ? "yes" : ""] : []),
      ...(isSupplier ? [data.supplierType, data.supplierCategories.length ? "yes" : "", data.aviationCapabilities.length ? "yes" : "", data.certifications.length ? "yes" : "", data.traceabilityCapabilities.length ? "yes" : "", data.geographicCoverage.length ? "yes" : "", data.shippingCapabilities.length ? "yes" : "", data.qualityInformation, data.commercialTerms] : []),
    ];
    const requiredScore = required.filter(Boolean).length / required.length;
    const optionalScore = optional.length ? optional.filter(Boolean).length / optional.length : 0;
    return Math.round((requiredScore * 60) + (optionalScore * 40));
  }, [data, isBuyer, isSupplier]);

  const completion = Math.round((step / totalSteps) * 100);

  const fieldsByStep: Record<string, (keyof FormValues)[]> = {
    identity: ["fullName", "email", "phone", "country"],
    company: ["companyName", "businessType"],
    buying: [], selling: [], compliance: [], logistics: [], security: ["password", "confirmPassword", "agreeTerms"],
  };

  const changeStep = (next: number) => {
    setStep(next);
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goNext = async () => {
    const fields = fieldsByStep[steps[Math.min(step, totalSteps) - 1].key] || [];
    const valid = fields.length ? await form.trigger(fields) : true;
    if (!valid) return;
    if (step < totalSteps) changeStep(step + 1);
  };

  const showInvalidStep = (errors: Partial<Record<keyof FormValues, { message?: string }>>) => {
    const failing = Object.keys(errors) as (keyof FormValues)[];
    const stepIndex = steps.findIndex((item) => failing.some((field) => (fieldsByStep[item.key] ?? []).includes(field)));
    const field = stepIndex >= 0 ? failing.find((name) => (fieldsByStep[steps[stepIndex].key] ?? []).includes(name)) : failing[0];
    const message = (field && errors[field]?.message) || "Some details need attention before we can create your account.";
    if (stepIndex >= 0 && stepIndex + 1 !== step) changeStep(stepIndex + 1);
    toast.error(message);
    if (stepIndex < 0) console.error("REGISTRATION VALIDATION:", errors);
  };

  const submit = form.handleSubmit(async (values) => {
    setLoading(true);
    const result = await registerUser(values as RegistrationData, profileCompletion, values.accountType === "hybrid" ? mroProfile : null);
    if (!result.success) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    completedRef.current = true;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
    writeMroDraft(null);
    if (result.needsEmailConfirmation) {
      setConfirmationSentTo(values.email.trim());
      setLoading(false);
      return;
    }
    toast.success("Account created. You can complete optional profile details from Account Settings.");
    router.replace(dashboardPathForRoles(result.roles));
    router.refresh();
  }, showInvalidStep);

  if (confirmationSentTo) return <CheckEmailNotice email={confirmationSentTo} />;

  const accountCards: { type: RegistrationAccountType; title: string; text: string }[] = [
    { type: "buyer", title: "Buy aircraft parts", text: "Search parts, send RFQs, compare quotes." },
    { type: "hybrid", title: "Buy & sell aircraft parts", text: "Everything in Buyer, plus listings and quoting." },
  ];

  const setArray = (name: keyof FormValues) => (next: string[]) => form.setValue(name, next as never, { shouldDirty: true, shouldTouch: true });

  const errors = form.formState.errors;
  const selectClass = (error?: string) => `${inputBase} ${inputBorder(error)}`;

  const renderStep = () => {
    const key = steps[Math.min(step, totalSteps) - 1].key;
    if (key === "identity") return <>
      <StepHeading title="Your account" text="Only what is needed to create your account is required now. You can complete your profile later." />
      <div className="space-y-4">
        <Field label="Full name" name="fullName" register={form.register} required error={errors.fullName?.message} placeholder="Jane Smith" />
        <Field label="Business email" name="email" register={form.register} required error={errors.email?.message} placeholder="jane@company.com" type="email" />
        <Row label="Country" htmlFor="country" required error={errors.country?.message}>
          <select id="country" {...form.register("country", { onChange: (event) => { const next = findCountryByName(event.target.value); if (next) form.setValue("phone", phoneWithDialCode(form.getValues("phone"), findCountryByName(previousCountryRef.current), next)); previousCountryRef.current = event.target.value; } })} aria-invalid={Boolean(errors.country)} className={selectClass(errors.country?.message)}><option value="">Select your country</option>{COUNTRIES.map((country) => <option key={country.code} value={country.name}>{country.name} ({country.dialCode})</option>)}</select>
        </Row>
        <Field label="Phone number" name="phone" register={form.register} required error={errors.phone?.message} placeholder="Select your country first" type="tel" hint="Include the country code, e.g. +254 712 345 678" />
      </div>
    </>;
    if (key === "company") return <>
      <StepHeading title="Company" text="Company details are shared between your Buying and Selling workspaces." />
      <div className="space-y-4">
        <Field label="Company name" name="companyName" register={form.register} required error={errors.companyName?.message} placeholder="Example Aviation Ltd" />
        <Row label="Organisation type" htmlFor="businessType" required error={errors.businessType?.message}>
          <select id="businessType" {...form.register("businessType")} className={selectClass(errors.businessType?.message)}><option value="">Select organisation type</option><option>Airline / Aircraft Operator</option><option>MRO</option><option>Aircraft Parts Distributor</option><option>OEM</option><option>Aircraft Broker</option><option>Aircraft Dismantler</option><option>Engine Shop</option><option>Avionics Shop</option><option>Government / Institutional</option><option>Other</option></select>
        </Row>
        <Field label="Job title" name="jobTitle" register={form.register} placeholder="Procurement Manager" />
        <Field label="Registration no." name="registrationNumber" register={form.register} placeholder="Optional for now" />
        <Field label="Website" name="website" register={form.register} placeholder="https://company.com" type="url" />
        <Field label="City" name="city" register={form.register} placeholder="Nairobi" />
        <Row label="Company address" htmlFor="address" optional>
          <textarea id="address" rows={2} {...form.register("address")} className={textareaClass} />
        </Row>
      </div>
    </>;
    if (key === "buying") return <>
      <StepHeading title="Buying profile" text="Optional — helps us show you relevant parts and suppliers. You can change it later." />
      <div className="space-y-5">
        <Row label="Procurement role" htmlFor="procurementRole">
          <select id="procurementRole" {...form.register("procurementRole")} className={selectClass()}><option value="">Select role</option><option>Procurement / Purchasing</option><option>Maintenance / Engineering</option><option>Materials / Supply Chain</option><option>Quality / Compliance</option><option>Management</option><option>Other</option></select>
        </Row>
        <ChoiceGrid title="Parts you purchase" options={categories} value={form.watch("buyerCategories")} onChange={setArray("buyerCategories")} />
        <ChoiceGrid title="What matters when sourcing" options={priorities} value={form.watch("procurementPriorities")} onChange={setArray("procurementPriorities")} />
        <ChoiceGrid title="Certification needs" options={["FAA 8130-3", "EASA Form 1", "Certificate of Conformity", "Maintenance Release", "Trace / maintenance records", "No specific requirement"]} value={form.watch("certificationRequirements")} onChange={setArray("certificationRequirements")} />
        <ChoiceGrid title="Preferred suppliers" options={["Verified supplier", "Strong rating / reviews", "Local or regional stock", "AOG capability", "Fast response", "Competitive pricing", "Warranty offered"]} value={form.watch("preferredSupplierCriteria")} onChange={setArray("preferredSupplierCriteria")} />
      </div>
    </>;
    if (key === "selling") return <>
      <StepHeading title="Selling profile" text="Tell buyers what your company can supply. You can refine this after registration." />
      <div className="space-y-5">
        <Row label="Supplier type" htmlFor="supplierType">
          <select id="supplierType" {...form.register("supplierType", { onChange: (event) => { if (/mro/i.test(event.target.value)) { form.setValue("mroCapable", true); if (!mroProfile) setMroFormOpen(true); } } })} className={selectClass()}><option value="">Select supplier type</option><option>Parts Distributor</option><option>MRO / Repair Station</option><option>OEM</option><option>Broker</option><option>Dismantler</option><option>Engine Specialist</option><option>Avionics Specialist</option><option>Other</option></select>
        </Row>
        <Row label="MRO services" hint="You will be listed on MRO Services and receive repair and overhaul RFQs.">
          <label htmlFor="mroCapable" className="flex cursor-pointer items-center gap-2 text-sm text-aviation-dark sm:pt-2"><input id="mroCapable" type="checkbox" {...form.register("mroCapable")} className="h-4 w-4 accent-[var(--aviation-primary)]" />We repair / overhaul components</label>
        </Row>
        {(data.mroCapable || /mro/i.test(data.supplierType ?? "")) && <Row label="MRO capabilities" hint="Capabilities and approvals shown on your MRO Services listing.">
          <div className="flex flex-wrap items-center gap-3 sm:pt-1">
            {mroProfile
              ? <span className="text-sm text-aviation-dark">{mroProfile.capabilities.length} capabilities · {mroProfile.approvals.length} approvals</span>
              : <span className="text-sm text-aviation-muted">Not filled in yet</span>}
            <button type="button" onClick={() => setMroFormOpen(true)} className={`${smallButton} border border-aviation-primary/40 bg-white text-aviation-primary hover:bg-aviation-light`}>
              {mroProfile ? <><Pencil size={14} /> Edit</> : <><Wrench size={14} /> Fill in MRO form</>}
            </button>
          </div>
        </Row>}
        <ChoiceGrid title="Product categories" options={supplierCategories} value={form.watch("supplierCategories")} onChange={setArray("supplierCategories")} />
        <ChoiceGrid title="Capabilities" options={capabilities} value={form.watch("aviationCapabilities")} onChange={setArray("aviationCapabilities")} />
        <ChoiceGrid title="Aircraft specialties" options={["Airbus", "Boeing", "ATR", "De Havilland / Dash 8", "Embraer", "Regional aircraft", "Helicopters", "Business aviation", "Military / government where applicable"]} value={form.watch("aircraftSpecialties")} onChange={setArray("aircraftSpecialties")} />
      </div>
    </>;
    if (key === "compliance") return <>
      <StepHeading title="Trust & compliance" text="Nothing here is required. Verification documents can be uploaded and reviewed after registration." />
      <div className="space-y-5">
        <ChoiceGrid title="Approvals" options={certifications} value={form.watch("certifications")} onChange={setArray("certifications")} />
        <ChoiceGrid title="Traceability" options={["FAA 8130-3", "EASA Form 1", "Certificate of Conformity", "Maintenance Release", "OEM documentation", "Maintenance records", "Serial / batch trace", "No trace available for some stock"]} value={form.watch("traceabilityCapabilities")} onChange={setArray("traceabilityCapabilities")} />
        <Row label="Quality notes" htmlFor="qualityInformation" optional>
          <textarea id="qualityInformation" rows={3} {...form.register("qualityInformation")} placeholder="Quality systems, approvals, inspection capabilities…" className={textareaClass} />
        </Row>
        <Row label="Verification notes" htmlFor="verificationNotes" optional>
          <textarea id="verificationNotes" rows={2} {...form.register("verificationNotes")} placeholder="Anything our verification team should know…" className={textareaClass} />
        </Row>
      </div>
    </>;
    if (key === "logistics") return <>
      <StepHeading title="Logistics & terms" text="Helps buyers understand how you operate. Can be completed or changed later." />
      <div className="space-y-5">
        <ChoiceGrid title="Coverage" options={["Kenya / East Africa", "Africa", "Middle East", "Europe", "North America", "Latin America", "Asia-Pacific", "Worldwide"]} value={form.watch("geographicCoverage")} onChange={setArray("geographicCoverage")} />
        <ChoiceGrid title="Shipping" options={["Courier / express", "Freight forwarding", "Dangerous goods capable where applicable", "Export documentation", "AOG dispatch", "Buyer-arranged collection"]} value={form.watch("shippingCapabilities")} onChange={setArray("shippingCapabilities")} />
        <Row label="Commercial terms" htmlFor="commercialTerms" optional>
          <textarea id="commercialTerms" rows={3} {...form.register("commercialTerms")} placeholder="Payment terms, warranty, lead times, minimum orders…" className={textareaClass} />
        </Row>
      </div>
    </>;
    return <>
      <StepHeading title="Secure your account" text="Choose a password to finish. Supplier documents can be added after registration." />
      <div className="space-y-4">
        <Field label="Password" name="password" register={form.register} required error={errors.password?.message} placeholder="8–16 characters" type="password" />
        <Field label="Confirm password" name="confirmPassword" register={form.register} required error={errors.confirmPassword?.message} placeholder="Repeat your password" type="password" />
        <Row label="Password rules">
          <div className="rounded-md bg-aviation-light px-3 py-2 text-xs [&_ul]:text-xs"><PasswordChecklist password={data.password ?? ""} /></div>
        </Row>
        <Row label="Agreements" required error={errors.agreeTerms?.message}>
          <div className="space-y-2 text-sm sm:pt-2">
            <label className="flex cursor-pointer items-start gap-2"><input type="checkbox" {...form.register("agreeTerms")} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--aviation-primary)]" /><span>I agree to the <a href="/terms" target="_blank" className="font-semibold text-aviation-primary underline">Terms &amp; Conditions</a> and <a href="/privacy" target="_blank" className="font-semibold text-aviation-primary underline">Privacy Policy</a>.</span></label>
            <label className="flex cursor-pointer items-start gap-2"><input type="checkbox" {...form.register("subscribeNewsletter")} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--aviation-primary)]" /><span>Send me product updates and aviation marketplace news.</span></label>
          </div>
        </Row>
      </div>
    </>;
  };

  const smallButton = "inline-flex h-10 items-center justify-center gap-1 rounded-md px-3.5 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 sm:h-8";

  return <main className="compact-form mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:py-10">
    <div className="overflow-hidden rounded-xl border border-aviation-border bg-white shadow-sm">
      <div className="flex flex-col gap-1 bg-aviation-dark px-5 py-4 text-white sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div className="flex items-center gap-3"><PlaneTakeoff size={22} aria-hidden="true" /><div><h1 className="text-xl font-bold text-white sm:text-2xl">Join AviaInventory</h1><p className="text-xs text-white/70">Fill in the form to create your account.</p></div></div>
        <p className="text-xs text-white/70">{profileCompletion}% profile complete · draft saved automatically</p>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-8 sm:py-6">
        <Row label="Account type" required>
          <div role="radiogroup" aria-label="Account type" className="grid gap-2 sm:grid-cols-2">
            {accountCards.map((card) => { const selected = accountType === card.type; return <button key={card.type} type="button" role="radio" aria-checked={selected} onClick={() => { form.setValue("accountType", card.type, { shouldDirty: true }); setStep(1); }} disabled={loading} className={`flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-aviation-primary/30 ${selected ? "border-aviation-primary bg-aviation-success-soft" : "border-aviation-border hover:border-aviation-primary/50"}`}><span aria-hidden="true" className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${selected ? "border-aviation-primary" : "border-aviation-border"}`}>{selected && <span className="h-2 w-2 rounded-full bg-aviation-primary" />}</span><span><span className="block text-[13px] font-semibold text-aviation-dark">{card.title}</span><span className="block text-[11px] leading-4 text-[var(--aviation-muted)]">{card.text}</span></span></button>; })}
          </div>
        </Row>

        {savedDraft && (
          <div role="status" className="flex flex-col gap-3 rounded-md border border-aviation-primary/30 bg-aviation-success-soft p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-aviation-dark">
              <span className="font-semibold">You have an unfinished registration{savedDraft.companyName ? ` for ${savedDraft.companyName}` : savedDraft.email ? ` for ${savedDraft.email}` : ""}.</span>{" "}
              <span className="text-[var(--aviation-muted)]">{savedDraft.savedAt ? `Saved ${new Date(savedDraft.savedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} on this device.` : ""}</span>
            </p>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={resumeDraft} className={`${smallButton} bg-aviation-primary text-white`}>Continue</button>
              <button type="button" onClick={startNewRegistration} className={`${smallButton} border border-aviation-border bg-white text-aviation-dark`}>Start new</button>
            </div>
          </div>
        )}

        {mroProfile && (
          <div className="mb-4 flex flex-col gap-2 rounded-md border border-[#0f5b6b]/25 bg-[#e8f3f4] px-3 py-2.5 text-sm text-[#0f5b6b] sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2"><Wrench size={16} className="mt-0.5 shrink-0" aria-hidden="true" /><span><span className="font-semibold">Your MRO capabilities are saved</span> ({mroProfile.capabilities.length} capabilities, {mroProfile.approvals.length} approvals). Finish creating your account to publish them on MRO Services.</span></p>
            <button type="button" onClick={() => setMroFormOpen(true)} className={`${smallButton} shrink-0 border border-[#0f5b6b]/30 bg-white text-[#0f5b6b]`}><Pencil size={14} /> Edit</button>
          </div>
        )}

        <div ref={formTopRef} className="scroll-mt-28"><StepIndicator currentStep={step} totalSteps={totalSteps} labels={steps.map((s) => s.label)} /></div>

        <form onSubmit={submit} noValidate>
          {renderStep()}
          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-aviation-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" disabled={step === 1 || loading} onClick={() => changeStep(Math.max(1, step - 1))} className={`${smallButton} border border-aviation-border bg-white text-aviation-dark`}><ChevronLeft size={16} aria-hidden="true" />Back</button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <button type="button" onClick={() => { toast.success("Your onboarding draft is saved. You can continue later from this device."); router.push("/"); }} className={`${smallButton} text-aviation-primary hover:bg-aviation-light`}><Save size={15} aria-hidden="true" />Save &amp; finish later</button>
              {step < totalSteps
                ? <button key="continue" type="button" onClick={goNext} disabled={loading} className={`${smallButton} bg-aviation-primary text-white hover:opacity-90`}>Continue <ChevronRight size={16} aria-hidden="true" /></button>
                : <button key="submit" type="submit" disabled={loading} className={`${smallButton} bg-aviation-primary text-white hover:opacity-90`}>{loading ? "Creating account…" : "Create account"}</button>}
            </div>
          </div>
        </form>
      </div>
    </div>
    <p className="mt-3 flex items-start gap-2 px-1 text-xs leading-5 text-aviation-muted"><Info size={14} className="mt-0.5 shrink-0 text-aviation-primary" aria-hidden="true" />Only account essentials are required. Supplier verification, documents and detailed preferences can be completed later from your account.</p>
    <MroCapabilityDialog
      open={mroFormOpen}
      initial={mroProfile ?? EMPTY_MRO_PROFILE}
      onClose={() => setMroFormOpen(false)}
      onSubmit={saveMroForm}
      submitLabel="Save & continue sign-up"
    />
  </main>;
}
