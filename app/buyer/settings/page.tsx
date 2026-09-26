import { Settings, UserCircle, ShieldCheck } from "lucide-react";
import SectionHeader from "@/components/dashboard/SectionHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import HybridAccountCard from "@/components/account/HybridAccountCard";

export default function BuyerSettingsPage(){
 return <div className="space-y-7">
  <SectionHeader eyebrow="ACCOUNT" title="Account settings" description="Manage your buyer profile and procurement preferences."/>
  <div className="grid gap-5 lg:grid-cols-2">
   <section className="rounded-[var(--aviation-radius-xl)] border border-aviation-border bg-white p-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[var(--aviation-radius-md)] bg-aviation-primary/10 text-aviation-primary"><UserCircle size={20}/></span><div><h2 className="font-semibold">Buyer profile</h2><p className="text-sm text-aviation-muted">Your company and contact details.</p></div></div><div className="mt-5"><EmptyState icon={Settings} eyebrow="PROFILE" title="Profile editing is ready to configure" description="Connect your buyer profile fields here when account editing is enabled." actionLabel="Back to dashboard" actionHref="/buyer/dashboard"/></div></section>
   <section className="rounded-[var(--aviation-radius-xl)] border border-aviation-border bg-white p-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[var(--aviation-radius-md)] bg-aviation-success-soft text-aviation-success"><ShieldCheck size={20}/></span><div><h2 className="font-semibold">Trust & security</h2><p className="text-sm text-aviation-muted">Account controls and verification.</p></div></div><div className="mt-5"><EmptyState icon={ShieldCheck} eyebrow="SECURITY" title="No security actions required" description="Your buyer workspace is ready. Security and verification controls will appear here as they become available." actionLabel="Return to dashboard" actionHref="/buyer/dashboard"/></div></section>
  </div>
  <HybridAccountCard activeRole="buyer" />
 </div>;
}
