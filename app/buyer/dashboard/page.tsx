import Link from "next/link";
import { Plus, Search, ArrowRight } from "lucide-react";
import StatsCards from "@/components/buyer/StatsCards";
import RecentRFQs from "@/components/buyer/RecentRFQs";
import RecentOrders from "@/components/buyer/RecentOrders";
import SavedParts from "@/components/buyer/SavedParts";
import Notifications from "@/components/buyer/Notifications";
import RfqComparisonDashboard from "@/components/buyer/RfqComparisonDashboard";
import SectionHeader from "@/components/dashboard/SectionHeader";
import SubscriptionStatusCard from "@/components/billing/SubscriptionStatusCard";

export default function BuyerDashboard(){
 return <div className="space-y-7">
  <SubscriptionStatusCard/>
  <SectionHeader eyebrow="BUYER CONTROL" title="Procurement workspace" description="Source parts, compare supplier responses and track every order from one workspace." action={<div className="flex gap-2"><Link href="/marketplace" className="inline-flex items-center gap-2 rounded-[var(--aviation-radius-md)] border border-aviation-border bg-white px-4 py-2.5 text-sm font-semibold text-aviation-dark"><Search size={16}/>Find parts</Link><Link href="/buyer/rfqs/new" className="inline-flex items-center gap-2 rounded-[var(--aviation-radius-md)] bg-aviation-accent px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16}/>New RFQ</Link></div>}/>
  <StatsCards/>
  <RfqComparisonDashboard/>
  <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><RecentRFQs/><SavedParts/></div>
  <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><RecentOrders/><Notifications/></div>
  <div className="rounded-[var(--aviation-radius-xl)] border border-aviation-border bg-aviation-dark p-6 text-white"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">PROCUREMENT PATH</p><h2 className="mt-1 text-xl font-semibold">Find → Verify → Compare → Order</h2><p className="mt-1 text-sm text-white/60">Use listings, RFQs, messages and orders as one continuous buying workflow.</p></div><Link href="/buyer/rfqs" className="inline-flex items-center gap-2 text-sm font-semibold">Open RFQs <ArrowRight size={16}/></Link></div></div>
 </div>;
}
