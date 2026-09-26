"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type UseFormRegister } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft, ChevronRight, Info, ShieldCheck, Save, Building2, ShoppingCart, PlaneTakeoff, Boxes, FileCheck2, Truck, LockKeyhole } from "lucide-react";
import toast from "react-hot-toast";
import StepIndicator from "./StepIndicator";
import { registerUser } from "@/lib/auth";
import type { RegistrationAccountType, RegistrationData } from "@/types/auth";

const STORAGE_KEY = "aviainventory_onboarding_draft_v2";

const categories = ["Airframes", "Engines", "Avionics", "Components", "Landing Gear", "Consumables", "Electrical", "Safety Equipment"];
const supplierCategories = [...categories, "Rotables", "Aircraft Interiors", "Ground Support Equipment"];
const certifications = ["FAA 8130-3", "EASA Form 1", "Certificate of Conformity", "ISO / Quality certification", "Other approval"];
const priorities = ["Certification / traceability", "Price", "Lead time", "Supplier reputation", "Location", "Warranty", "AOG availability"];
const capabilities = ["AOG support", "Repair / overhaul", "Component testing", "Aircraft dismantling", "Engine services", "Avionics services", "Kitting", "Stocking / warehousing"];

const schema = z.object({
  accountType: z.enum(["buyer", "hybrid"]),
  fullName: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid business email."),
  phone: z.string().trim().min(7, "Enter a valid phone number."),
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
  password: z.string().min(8, "Use at least 8 characters."),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine(Boolean, "You must accept the Terms & Conditions."),
  subscribeNewsletter: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

type FormValues = z.infer<typeof schema>;

const defaults: RegistrationData = {
  accountType: "buyer", fullName: "", email: "", phone: "", country: "", companyName: "", businessType: "", website: "", registrationNumber: "", jobTitle: "", address: "", city: "",
  procurementRole: "", buyerCategories: [], procurementPriorities: [], certificationRequirements: [], preferredSupplierCriteria: [],
  supplierType: "", supplierCategories: [], aircraftSpecialties: [], geographicCoverage: [], aviationCapabilities: [], certifications: [], traceabilityCapabilities: [], qualityInformation: "", shippingCapabilities: [], commercialTerms: "", verificationNotes: "",
  password: "", confirmPassword: "", agreeTerms: false, subscribeNewsletter: false,
};

function Field({ label, name, register, error, required = false, placeholder, type = "text" }: { label: string; name: keyof FormValues; register: UseFormRegister<FormValues>; error?: string; required?: boolean; placeholder?: string; type?: string }) {
  return <div>
    <label htmlFor={name} className="mb-2 block text-sm font-semibold text-aviation-dark">{label}{required && <span aria-hidden="true"> *</span>}</label>
    <input id={name} type={type} placeholder={placeholder} {...register(name)} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className={`min-h-11 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-aviation-primary/20 ${error ? "border-red-500" : "border-aviation-border focus:border-aviation-primary"}`} />
    {error && <p id={`${name}-error`} className="mt-1 text-xs font-medium text-red-600">{error}</p>}
  </div>;
}

function ChoiceGrid({ title, description, options, value, onChange, columns = "sm:grid-cols-2 lg:grid-cols-3" }: { title: string; description?: string; options: string[]; value: string[]; onChange: (next: string[]) => void; columns?: string }) {
  const toggle = (item: string) => onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);
  return <section>
    <div className="mb-5"><h2 className="text-2xl font-bold text-aviation-primary">{title}</h2>{description && <p className="mt-1 text-sm text-aviation-muted">{description}</p>}</div>
    <div className={`grid gap-3 ${columns}`}>
      {options.map((item) => { const selected = value.includes(item); return <button key={item} type="button" aria-pressed={selected} onClick={() => toggle(item)} className={`min-h-11 rounded-xl border p-4 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-aviation-primary/30 ${selected ? "border-aviation-primary bg-aviation-success-soft text-aviation-primary" : "border-aviation-border bg-white hover:border-aviation-primary/50"}`}><span className="flex items-center justify-between gap-3">{item}{selected && <Check size={18} aria-hidden="true" />}</span></button>; })}
    </div>
  </section>;
}

export default function RegistrationWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

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
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<FormValues> & { step?: number };
        const normalizedAccountType = parsed.accountType === "supplier" ? "hybrid" : parsed.accountType;
        form.reset({ ...defaults, ...parsed, accountType: normalizedAccountType, password: "", confirmPassword: "" });
        setStep(Math.min(parsed.step || 1, totalSteps));
      }
    } catch { /* ignore corrupt local drafts */ }
    setDraftLoaded(true);
  }, [form, totalSteps]);

  useEffect(() => {
    if (!draftLoaded) return;
    const { password: _password, confirmPassword: _confirmPassword, ...safeDraft } = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...safeDraft, step, savedAt: new Date().toISOString() }));
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

  const goNext = async () => {
    const fieldsByStep: Record<string, (keyof FormValues)[]> = {
      identity: ["fullName", "email", "phone", "country"],
      company: ["companyName", "businessType"],
      buying: [], selling: [], compliance: [], logistics: [], security: ["password", "confirmPassword", "agreeTerms"],
    };
    const fields = fieldsByStep[steps[step - 1].key] || [];
    const valid = fields.length ? await form.trigger(fields) : true;
    if (!valid) return;
    if (step < totalSteps) setStep((s) => s + 1);
  };

  const submit = form.handleSubmit(async (values) => {
    setLoading(true);
    const result = await registerUser(values as RegistrationData, profileCompletion);
    if (!result.success) {
      toast.error(result.error instanceof Error ? result.error.message : "Unable to create your account.");
      setLoading(false);
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Account created. You can complete optional profile details from Account Settings.");
    setTimeout(() => router.push("/buyer/dashboard"), 500);
  });

  const accountCards: { type: RegistrationAccountType; title: string; text: string }[] = [
    { type: "buyer", title: "Buy aircraft parts", text: "Search verified inventory, issue RFQs, compare supplier offers and manage purchases." },
    { type: "hybrid", title: "Buy & sell aircraft parts", text: "Everything in Buyer, plus the ability to list inventory, respond to RFQs and manage supplier operations." },
  ];

  const setArray = (name: keyof FormValues) => (next: string[]) => form.setValue(name, next as never, { shouldDirty: true, shouldTouch: true });

  const renderStep = () => {
    const key = steps[step - 1].key;
    if (key === "identity") return <>
      <div className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-aviation-primary">Start with the essentials</p><h2 className="mt-2 text-2xl font-bold text-aviation-primary">Your aviation marketplace account</h2><p className="mt-2 text-sm leading-6 text-aviation-muted">Only the information needed to create your account is required now. You can build the rest of your profile later.</p></div>
      <div className="grid gap-5 md:grid-cols-2"><Field label="Full name" name="fullName" register={form.register} required error={form.formState.errors.fullName?.message} placeholder="Jane Smith" /><Field label="Business email" name="email" register={form.register} required error={form.formState.errors.email?.message} placeholder="jane@company.com" type="email" /><Field label="Phone number" name="phone" register={form.register} required error={form.formState.errors.phone?.message} placeholder="+254 700 000 000" type="tel" /><Field label="Country" name="country" register={form.register} required error={form.formState.errors.country?.message} placeholder="Kenya" /></div>
    </>;
    if (key === "company") return <><div className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-aviation-primary">Company identity</p><h2 className="mt-2 text-2xl font-bold text-aviation-primary">Tell us about your organisation</h2><p className="mt-2 text-sm leading-6 text-aviation-muted">Company identity is shared between your Buying and Selling workspaces.</p></div><div className="grid gap-5 md:grid-cols-2"><Field label="Legal / trading company name" name="companyName" register={form.register} required error={form.formState.errors.companyName?.message} placeholder="Example Aviation Ltd" /><div><label htmlFor="businessType" className="mb-2 block text-sm font-semibold">Organisation type *</label><select id="businessType" {...form.register("businessType")} className="min-h-11 w-full rounded-xl border border-aviation-border bg-white px-4 py-3 text-sm focus:border-aviation-primary focus:outline-none"><option value="">Select organisation type</option><option>Airline / Aircraft Operator</option><option>MRO</option><option>Aircraft Parts Distributor</option><option>OEM</option><option>Aircraft Broker</option><option>Aircraft Dismantler</option><option>Engine Shop</option><option>Avionics Shop</option><option>Government / Institutional</option><option>Other</option></select>{form.formState.errors.businessType?.message && <p className="mt-1 text-xs text-red-600">{form.formState.errors.businessType.message}</p>}</div><Field label="Job title / role" name="jobTitle" register={form.register} placeholder="Procurement Manager" /><Field label="Company registration number" name="registrationNumber" register={form.register} placeholder="Optional for now" /><Field label="Website" name="website" register={form.register} placeholder="https://company.com" type="url" /><Field label="City" name="city" register={form.register} placeholder="Nairobi" /></div><div className="mt-5"><label htmlFor="address" className="mb-2 block text-sm font-semibold">Company address <span className="font-normal text-aviation-muted">(optional)</span></label><textarea id="address" rows={3} {...form.register("address")} className="w-full rounded-xl border border-aviation-border bg-white px-4 py-3 text-sm focus:border-aviation-primary focus:outline-none" /></div></>;
    if (key === "buying") return <div className="space-y-9"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-aviation-primary">Buying profile</p><h2 className="mt-2 text-2xl font-bold text-aviation-primary">Help us understand how you source</h2><p className="mt-2 text-sm text-aviation-muted">These preferences are optional and can be changed later.</p></div><div><label htmlFor="procurementRole" className="mb-2 block text-sm font-semibold">Your procurement role</label><select id="procurementRole" {...form.register("procurementRole")} className="min-h-11 w-full rounded-xl border border-aviation-border bg-white px-4 py-3 text-sm focus:border-aviation-primary focus:outline-none"><option value="">Select role</option><option>Procurement / Purchasing</option><option>Maintenance / Engineering</option><option>Materials / Supply Chain</option><option>Quality / Compliance</option><option>Management</option><option>Other</option></select></div><ChoiceGrid title="Parts you purchase" description="Select the categories most relevant to your procurement activity." options={categories} value={form.watch("buyerCategories")} onChange={setArray("buyerCategories")} /><ChoiceGrid title="What matters when sourcing?" options={priorities} value={form.watch("procurementPriorities")} onChange={setArray("procurementPriorities")} /><ChoiceGrid title="Certification / documentation requirements" options={["FAA 8130-3", "EASA Form 1", "Certificate of Conformity", "Trace / maintenance records", "No specific requirement"]} value={form.watch("certificationRequirements")} onChange={setArray("certificationRequirements")} /><ChoiceGrid title="Preferred supplier criteria" options={["Verified supplier", "Strong rating / reviews", "Local or regional stock", "AOG capability", "Fast response", "Competitive pricing", "Warranty offered"]} value={form.watch("preferredSupplierCriteria")} onChange={setArray("preferredSupplierCriteria")} /></div>;
    if (key === "selling") return <div className="space-y-9"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-aviation-primary">Supplier profile</p><h2 className="mt-2 text-2xl font-bold text-aviation-primary">Build your selling profile</h2><p className="mt-2 text-sm text-aviation-muted">Tell buyers what your company can supply. You can refine this after registration.</p></div><div><label htmlFor="supplierType" className="mb-2 block text-sm font-semibold">Supplier type</label><select id="supplierType" {...form.register("supplierType")} className="min-h-11 w-full rounded-xl border border-aviation-border bg-white px-4 py-3 text-sm focus:border-aviation-primary focus:outline-none"><option value="">Select supplier type</option><option>Parts Distributor</option><option>MRO / Repair Station</option><option>OEM</option><option>Broker</option><option>Dismantler</option><option>Engine Specialist</option><option>Avionics Specialist</option><option>Other</option></select></div><ChoiceGrid title="Product categories" options={supplierCategories} value={form.watch("supplierCategories")} onChange={setArray("supplierCategories")} /><ChoiceGrid title="Aviation capabilities" options={capabilities} value={form.watch("aviationCapabilities")} onChange={setArray("aviationCapabilities")} /><ChoiceGrid title="Aircraft / platform specialties" description="Examples can include Boeing, Airbus, ATR, Dash 8, Embraer, helicopters, engines or specific platforms." options={["Airbus", "Boeing", "ATR", "De Havilland / Dash 8", "Embraer", "Regional aircraft", "Helicopters", "Business aviation", "Military / government where applicable"]} value={form.watch("aircraftSpecialties")} onChange={setArray("aircraftSpecialties")} /></div>;
    if (key === "compliance") return <div className="space-y-9"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-aviation-primary">Trust & compliance</p><h2 className="mt-2 text-2xl font-bold text-aviation-primary">Prepare your supplier verification profile</h2><p className="mt-2 text-sm text-aviation-muted">Nothing here is required to create your account. Verification documents can be uploaded and reviewed after registration.</p></div><ChoiceGrid title="Approvals / certifications" options={certifications} value={form.watch("certifications")} onChange={setArray("certifications")} /><ChoiceGrid title="Traceability you can provide" options={["FAA 8130-3", "EASA Form 1", "Certificate of Conformity", "OEM documentation", "Maintenance records", "Serial / batch trace", "No trace available for some stock"]} value={form.watch("traceabilityCapabilities")} onChange={setArray("traceabilityCapabilities")} /><div><label htmlFor="qualityInformation" className="mb-2 block text-sm font-semibold">Quality / compliance notes</label><textarea id="qualityInformation" rows={4} {...form.register("qualityInformation")} placeholder="Quality systems, approvals, inspection capabilities or other relevant information..." className="w-full rounded-xl border border-aviation-border px-4 py-3 text-sm focus:border-aviation-primary focus:outline-none" /></div><div><label htmlFor="verificationNotes" className="mb-2 block text-sm font-semibold">Verification notes <span className="font-normal text-aviation-muted">(optional)</span></label><textarea id="verificationNotes" rows={3} {...form.register("verificationNotes")} placeholder="Anything the AviaInventory verification team should know..." className="w-full rounded-xl border border-aviation-border px-4 py-3 text-sm focus:border-aviation-primary focus:outline-none" /></div></div>;
    if (key === "logistics") return <div className="space-y-9"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-aviation-primary">Commercial profile</p><h2 className="mt-2 text-2xl font-bold text-aviation-primary">Set expectations for buyers</h2><p className="mt-2 text-sm text-aviation-muted">These details help buyers understand how you operate. They can be completed or changed later.</p></div><ChoiceGrid title="Geographic coverage" options={["Kenya / East Africa", "Africa", "Middle East", "Europe", "North America", "Latin America", "Asia-Pacific", "Worldwide"]} value={form.watch("geographicCoverage")} onChange={setArray("geographicCoverage")} /><ChoiceGrid title="Shipping capabilities" options={["Courier / express", "Freight forwarding", "Dangerous goods capable where applicable", "Export documentation", "AOG dispatch", "Buyer-arranged collection"]} value={form.watch("shippingCapabilities")} onChange={setArray("shippingCapabilities")} /><div><label htmlFor="commercialTerms" className="mb-2 block text-sm font-semibold">Commercial terms</label><textarea id="commercialTerms" rows={4} {...form.register("commercialTerms")} placeholder="Payment terms, warranty approach, lead-time notes, minimum order information, etc." className="w-full rounded-xl border border-aviation-border px-4 py-3 text-sm focus:border-aviation-primary focus:outline-none" /></div></div>;
    return <div className="space-y-7"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-aviation-primary">Secure your account</p><h2 className="mt-2 text-2xl font-bold text-aviation-primary">Ready for take-off</h2><p className="mt-2 text-sm text-aviation-muted">Required information is limited to account creation. Optional aviation profile information can be completed later.</p></div><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-xl border border-aviation-border bg-aviation-light p-4"><ShieldCheck className="text-aviation-primary" size={22}/><p className="mt-3 text-sm font-bold">Secure account</p><p className="mt-1 text-xs text-aviation-muted">Use a strong password of at least 8 characters.</p></div><div className="rounded-xl border border-aviation-border bg-aviation-light p-4"><FileCheck2 className="text-aviation-primary" size={22}/><p className="mt-3 text-sm font-bold">Verification later</p><p className="mt-1 text-xs text-aviation-muted">Supplier documents can be reviewed after registration.</p></div><div className="rounded-xl border border-aviation-border bg-aviation-light p-4"><Save className="text-aviation-primary" size={22}/><p className="mt-3 text-sm font-bold">Draft saved</p><p className="mt-1 text-xs text-aviation-muted">Your optional onboarding choices are saved in this browser.</p></div></div><div className="grid gap-5 md:grid-cols-2"><Field label="Password" name="password" register={form.register} required error={form.formState.errors.password?.message} placeholder="At least 8 characters" type="password"/><Field label="Confirm password" name="confirmPassword" register={form.register} required error={form.formState.errors.confirmPassword?.message} placeholder="Repeat your password" type="password"/></div><label className="flex min-h-11 items-start gap-3 rounded-xl border border-aviation-border bg-white p-4 text-sm"><input type="checkbox" {...form.register("agreeTerms")} className="mt-1 h-4 w-4"/><span>I agree to the AviaInventory Terms of Service and Privacy Policy.</span></label>{form.formState.errors.agreeTerms?.message && <p className="text-xs text-red-600">{form.formState.errors.agreeTerms.message}</p>}<label className="flex min-h-11 items-start gap-3 rounded-xl border border-aviation-border bg-white p-4 text-sm"><input type="checkbox" {...form.register("subscribeNewsletter")} className="mt-1 h-4 w-4"/><span>Send me AviaInventory product updates and aviation marketplace news.</span></label></div>;
  };

  return <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
    <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden lg:block lg:sticky lg:top-28 lg:h-fit"><div className="rounded-2xl border border-aviation-border bg-aviation-dark p-6 text-white shadow-lg"><PlaneTakeoff size={28}/><p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-white/60">AviaInventory onboarding</p><h1 className="mt-2 text-2xl font-bold">Build your aviation workspace.</h1><p className="mt-3 text-sm leading-6 text-white/75">Start with the essentials, then progressively add the company, procurement and, when enabled, supplier details that matter to your business.</p><div className="mt-7 space-y-3">{steps.map((item, i) => { const Icon = item.icon; return <div key={item.key} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${i + 1 === step ? "bg-white/10 font-bold" : "text-white/60"}`}><Icon size={16}/><span>{item.label}</span></div>; })}</div></div></aside>
      <section className="min-w-0">
        <div className="mb-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-aviation-primary">Create your account</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-aviation-primary sm:text-4xl">Join AviaInventory</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-aviation-muted">A professional workspace for sourcing and supplying aircraft parts.</p></div><div className="rounded-xl border border-aviation-border bg-white px-4 py-3 text-sm"><span className="font-semibold">{profileCompletion}% profile complete</span><span className="ml-2 text-aviation-muted">· draft saved automatically</span></div></div></div>
        <div className="mb-6 rounded-2xl border border-aviation-border bg-white p-4 shadow-sm sm:p-6"><p className="mb-1 text-sm font-bold text-aviation-dark">Choose your account</p><p className="mb-3 text-xs text-aviation-muted">You can upgrade from Buyer to Buyer & Supplier at any time without creating another company account.</p><div className="grid gap-3 md:grid-cols-2">{accountCards.map((card) => { const selected = accountType === card.type; return <button key={card.type} type="button" onClick={() => { form.setValue("accountType", card.type, { shouldDirty: true }); setStep(1); }} disabled={loading} className={`min-h-11 rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-aviation-primary/30 ${selected ? "border-aviation-primary bg-aviation-success-soft" : "border-aviation-border hover:border-aviation-primary/50"}`}><span className="flex items-start justify-between gap-3"><span><span className="block text-sm font-bold text-aviation-dark">{card.title}</span><span className="mt-1 block text-xs leading-5 text-aviation-muted">{card.text}</span></span>{selected && <Check size={19} className="shrink-0 text-aviation-primary"/>}</span></button>; })}</div></div>
        <div className="mb-6 rounded-2xl border border-aviation-border bg-white p-4 shadow-sm sm:p-6"><StepIndicator currentStep={step} totalSteps={totalSteps} labels={steps.map((s) => s.label)} /></div>
        <form onSubmit={submit} noValidate><div className="rounded-2xl border border-aviation-border bg-white p-5 shadow-sm sm:p-8">{renderStep()}</div><div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><button type="button" disabled={step === 1 || loading} onClick={() => setStep((s) => Math.max(1, s - 1))} className="min-h-11 rounded-xl border border-aviation-border bg-white px-5 py-3 text-sm font-bold text-aviation-dark disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="mr-1 inline" size={18}/>Back</button><div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"><button type="button" onClick={() => { toast.success("Your onboarding draft is saved. You can continue later from this device."); router.push("/"); }} className="min-h-11 rounded-xl px-5 py-3 text-sm font-bold text-aviation-primary hover:bg-aviation-light"><Save className="mr-2 inline" size={17}/>Save & continue later</button>{step < totalSteps ? <button type="button" onClick={goNext} disabled={loading} className="min-h-11 rounded-xl bg-aviation-primary px-6 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">Continue <ChevronRight className="ml-1 inline" size={18}/></button> : <button type="submit" disabled={loading} className="min-h-11 rounded-xl bg-aviation-primary px-6 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">{loading ? "Creating account…" : "Create AviaInventory account"}</button>}</div></div></form>
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-aviation-border bg-aviation-light p-4 text-xs leading-5 text-aviation-muted"><Info size={16} className="mt-0.5 shrink-0 text-aviation-primary"/><p><strong className="text-aviation-dark">Progressive onboarding:</strong> only account-creation essentials are required. Supplier verification, documents and detailed procurement preferences can be completed later from your account workspace.</p></div>
      </section>
    </div>
  </main>;
}
