"use client";

import { useEffect, useState } from "react";

import {
  getSupplierRFQs,
  getSupplierQuotes,
  type RFQ,
  type Quote,
  QuoteStatus,
} from "@/lib/rfqs";

import DashboardStats from "./DashboardStats";
import RecentRFQs from "./RecentRFQs";
import RecentQuotes from "./RecentQuotes";
import PerformanceChart from "./PerformanceChart";
import QuickActions from "./QuickActions";
import { TableSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import VerificationStatusBadge from "@/components/supplier/verification/VerificationStatusBadge";

interface PerformanceData {
  month: string;
  quotations: number;
  accepted: number;
  revenue: number;
}

export default function SupplierDashboard() {
  const [loading, setLoading] = useState(true);

  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      const [rfqData, quoteData] = await Promise.all([
        getSupplierRFQs(),
        getSupplierQuotes(),
      ]);

      setRFQs(rfqData);
      setQuotes(quoteData);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div aria-busy="true" aria-label="Loading supplier dashboard" className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((item) => <div key={item} className="rounded-[var(--aviation-radius-xl)] border border-aviation-border bg-white p-5"><div className="skeleton h-3 w-24" /><div className="skeleton mt-4 h-8 w-20" /><div className="skeleton mt-3 h-3 w-32" /></div>)}</div><TableSkeleton rows={6} columns={4} /></div>;

  const pendingQuotes = quotes.filter(
    (quote) =>
      quote.status === QuoteStatus.Sent
  ).length;

  const acceptedQuotes = quotes.filter(
    (quote) =>
      quote.status === QuoteStatus.Accepted
  ).length;

  const revenue = quotes
    .filter(
      (quote) =>
        quote.status === QuoteStatus.Accepted
    )
    .reduce(
      (total, quote) =>
        total + quote.unit_price,
      0
    );

  /*
    Placeholder chart data.
    Replace with aggregated monthly data
    from Supabase once analytics are added.
  */

  const performanceData: PerformanceData[] = [
    {
      month: "Jan",
      quotations: 14,
      accepted: 8,
      revenue: 18000,
    },
    {
      month: "Feb",
      quotations: 18,
      accepted: 11,
      revenue: 23600,
    },
    {
      month: "Mar",
      quotations: 22,
      accepted: 13,
      revenue: 29800,
    },
    {
      month: "Apr",
      quotations: 28,
      accepted: 16,
      revenue: 35500,
    },
    {
      month: "May",
      quotations: 24,
      accepted: 15,
      revenue: 32200,
    },
    {
      month: "Jun",
      quotations: 30,
      accepted: 19,
      revenue: 44100,
    },
  ];

  return (
    <div className="space-y-8">
      <SupplierVerificationWidget />

      <DashboardStats
        openRFQs={rfqs.length}
        pendingQuotes={pendingQuotes}
        acceptedQuotes={acceptedQuotes}
        revenue={revenue}
      />

      <QuickActions />

      <PerformanceChart
        data={performanceData}
      />

      <div className="grid gap-8 xl:grid-cols-2">

        <RecentRFQs
          rfqs={rfqs}
        />

        <RecentQuotes
          quotes={quotes}
        />

      </div>

    </div>
  );
}}


function SupplierVerificationWidget() {
  const [state, setState] = useState<{status:string;completion:number;expiring:number;expired:number}|null>(null);
  useEffect(() => { let mounted = true; (async () => { const {data:{user}} = await supabase.auth.getUser(); if (!user) return; const {data} = await supabase.rpc("get_supplier_verification_summary", {p_supplier_id:user.id}); if (mounted && data?.[0]) setState({status:data[0].verification_status,completion:Number(data[0].verification_completion||0),expiring:Number(data[0].expiring_document_count||0),expired:Number(data[0].expired_document_count||0)}); })(); return () => {mounted=false}; }, []);
  if (!state) return null;
  return <section className="rounded-[var(--aviation-radius-xl)] border border-aviation-border bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-aviation-light text-aviation-primary"><ShieldCheck size={21}/></div><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-aviation-muted">TRUST & COMPLIANCE</p><div className="mt-1 flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-aviation-dark">Supplier verification</h2><VerificationStatusBadge status={state.status} compact /></div><p className="mt-1 text-sm text-aviation-muted">{state.completion}% verification readiness · {state.expiring} expiry watch · {state.expired} expired</p></div></div><Link href="/supplier/verification" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-aviation-border px-4 py-2.5 text-sm font-semibold text-aviation-primary hover:bg-aviation-light">{(state.expiring||state.expired)>0 && <AlertTriangle size={16}/>} Manage verification</Link></div><div className="mt-4 h-2 rounded-full bg-aviation-light"><div className="h-full rounded-full bg-aviation-accent" style={{width:`${state.completion}%`}}/></div></section>;
}
