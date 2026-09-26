"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, BadgeCheck, Building2, FileCheck2, MailCheck, ShieldCheck } from "lucide-react";
import type { SupplierVerificationSummary } from "@/lib/supplier-verification";
import VerificationStatusBadge from "./VerificationStatusBadge";

const checks = [
  ["company", "Company information", Building2],
  ["identity", "Identity & contact", MailCheck],
  ["registration", "Business registration", FileCheck2],
  ["certifications", "Aviation certifications", ShieldCheck],
] as const;

export default function VerificationOverview({ summary, companyName }: { summary: SupplierVerificationSummary; companyName: string }) {
  return <section className="space-y-5">
    <div className="rounded-[var(--aviation-radius-xl)] border border-aviation-border bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-aviation-primary text-white"><BadgeCheck size={28}/></div><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-aviation-accent">SUPPLIER TRUST CONTROL</p><h1 className="mt-1 text-2xl font-bold text-aviation-dark sm:text-3xl">{companyName || "Supplier"}</h1><div className="mt-2"><VerificationStatusBadge status={summary.verification_status}/></div></div></div>
        <div className="min-w-0 lg:w-72"><div className="flex items-center justify-between text-sm"><span className="font-semibold text-aviation-dark">Verification readiness</span><span className="font-mono font-bold text-aviation-primary">{summary.verification_completion}%</span></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-aviation-light"><div className="h-full rounded-full bg-aviation-accent transition-all" style={{width:`${summary.verification_completion}%`}}/></div><p className="mt-2 text-xs text-aviation-muted">Completion measures information supplied for review, not approval.</p></div>
      </div>
    </div>
    {(summary.expired_document_count > 0 || summary.expiring_document_count > 0 || summary.verification_missing_information.length > 0 || summary.verification_status === "More Information Required") && <div className="grid gap-3 md:grid-cols-3">
      {summary.expired_document_count > 0 && <Alert title="Expired documents" body={`${summary.expired_document_count} document${summary.expired_document_count === 1 ? "" : "s"} need replacement.`} tone="danger"/>}
      {summary.expiring_document_count > 0 && <Alert title="Expiry watch" body={`${summary.expiring_document_count} document${summary.expiring_document_count === 1 ? "" : "s"} expire within 30 days.`} tone="warning"/>}
      {summary.verification_missing_information.length > 0 && <Alert title="Action required" body={`${summary.verification_missing_information.length} item${summary.verification_missing_information.length === 1 ? "" : "s"} identified by the reviewer.`} tone="warning"/>}
    </div>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{checks.map(([key,label,Icon], index)=><div key={key} className="rounded-xl border border-aviation-border bg-white p-4"><div className="flex items-center justify-between"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-aviation-light text-aviation-primary"><Icon size={17}/></div><span className="text-xs font-mono text-aviation-muted">0{index+1}</span></div><p className="mt-4 text-sm font-semibold text-aviation-dark">{label}</p><p className="mt-1 text-xs text-aviation-muted">{key === "certifications" ? `${summary.verified_document_count} verified document${summary.verified_document_count === 1 ? "" : "s"} on file` : "Profile data submitted"}</p></div>)}</div>
    <div className="flex justify-end"><Link href="/supplier/verification" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-aviation-primary px-4 py-2.5 text-sm font-semibold text-white">Open verification center <ArrowRight size={16}/></Link></div>
  </section>;
}

function Alert({title,body,tone}:{title:string;body:string;tone:"danger"|"warning"}) { return <div className={`rounded-xl border p-4 ${tone === "danger" ? "border-red-200 bg-red-50" : "border-aviation-warning/20 bg-aviation-warning-soft"}`}><div className="flex gap-3"><AlertTriangle className={tone === "danger" ? "text-red-700" : "text-aviation-warning"} size={18}/><div><p className="text-sm font-bold text-aviation-dark">{title}</p><p className="mt-1 text-xs leading-5 text-aviation-muted">{body}</p></div></div></div>; }
