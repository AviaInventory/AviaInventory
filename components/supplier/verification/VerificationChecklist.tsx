"use client";

import { BadgeCheck, CircleAlert, CircleDot, FileCheck2 } from "lucide-react";
import type { SupplierVerificationDocument } from "@/lib/supplier-verification";

type Check = { label: string; detail: string; complete: boolean };

export default function VerificationChecklist({ profile, supplier, documents }: { profile: { full_name: string | null; email: string | null; phone: string | null; registration_number: string | null; onboarding_data: Record<string, unknown> | null } | null; supplier: { company_name: string | null; business_type: string | null; website: string | null; address: string | null; city: string | null }; documents: SupplierVerificationDocument[] }) {
  const data = profile?.onboarding_data || {};
  const aviationDocs = documents.filter(d => /FAA|EASA|Air Operator|Maintenance|AMO|Repair Station|Authorized Release/i.test(`${d.document_type} ${d.document_name}`));
  const qualityDocs = documents.filter(d => /quality|ISO|AS9100|AS9110|AS9120/i.test(`${d.document_type} ${d.document_name}`));
  const checks: Check[] = [
    {label:"Company information",detail:"Company name, business type, website and address",complete:Boolean(supplier.company_name && supplier.business_type && supplier.address && supplier.city)},
    {label:"Identity & contact",detail:"Named contact, email and phone",complete:Boolean(profile?.full_name && profile.email && profile.phone)},
    {label:"Business registration",detail:"Registration number or registration document",complete:Boolean(profile?.registration_number || documents.some(d=>/incorporation|business registration|tax registration/i.test(d.document_type)))},
    {label:"Aviation certifications",detail:`${aviationDocs.length} aviation credential${aviationDocs.length===1?"":"s"} on file`,complete:aviationDocs.some(d=>d.verification_status==="Verified")},
    {label:"Quality certifications",detail:`${qualityDocs.length} quality credential${qualityDocs.length===1?"":"s"} on file`,complete:qualityDocs.some(d=>d.verification_status==="Verified")},
    {label:"Supporting documents",detail:`${documents.length} controlled document${documents.length===1?"":"s"} uploaded`,complete:documents.length>0},
  ];
  return <section className="rounded-[var(--aviation-radius-xl)] border border-aviation-border bg-white p-5 shadow-sm sm:p-7"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-aviation-muted">VERIFICATION CHECKLIST</p><h2 className="mt-1 text-xl font-bold text-aviation-dark">Evidence readiness</h2><p className="mt-1 text-sm text-aviation-muted">Each control is assessed separately so reviewers can identify exactly what remains outstanding.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{checks.map(check=><div key={check.label} className={`rounded-xl border p-4 ${check.complete?"border-aviation-success/20 bg-aviation-success-soft/50":"border-aviation-warning/20 bg-aviation-warning-soft/40"}`}><div className="flex items-start gap-3">{check.complete?<BadgeCheck className="mt-0.5 shrink-0 text-aviation-success" size={20}/>:<CircleAlert className="mt-0.5 shrink-0 text-aviation-warning" size={20}/>}<div><p className="text-sm font-bold text-aviation-dark">{check.label}</p><p className="mt-1 text-xs leading-5 text-aviation-muted">{check.detail}</p><p className={`mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${check.complete?"text-aviation-success":"text-aviation-warning"}`}>{check.complete?<FileCheck2 size={12}/> : <CircleDot size={12}/>} {check.complete?"Ready for review":"Action required"}</p></div></div></div>)}</div></section>;
}
