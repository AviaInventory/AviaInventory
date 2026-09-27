"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FileText,
  MessageSquare,
  PackageCheck,
  Pencil,
  Plus,
  Receipt,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSupplierRFQs, getSupplierQuotes, QuoteStatus, RFQStatus, type Quote, type RFQ } from "@/lib/rfqs";
import { getSupplierOrders, type Order } from "@/lib/orders";
import { documentExpiryState } from "@/lib/supplier-verification";
import StatusBadge from "@/components/dashboard/StatusBadge";
import VerificationStatusBadge from "@/components/supplier/verification/VerificationStatusBadge";
import SubscriptionStatusCard from "@/components/billing/SubscriptionStatusCard";

interface PartRow {
  id: string;
  part_number: string | null;
  description: string | null;
  status: string | null;
  quantity: number | null;
  unit_price: number | null;
  price_type: string | null;
  trace_certificate: string | null;
  category: string | null;
  created_at: string | null;
}

interface DashboardState {
  parts: PartRow[];
  rfqs: RFQ[];
  quotes: Quote[];
  orders: Order[];
  unreadMessages: number;
  verification: { status: string; completion: number; expiring: number; expired: number; missing: string[] } | null;
  expiringDocs: { id: string; document_name: string; expiry_date: string | null; verification_status: string }[];
  shipments: number;
  invoices: number;
  promotions: { id: string; title: string; discount: string | null; status: string; ends_at: string | null }[];
  loading: boolean;
}

const initial: DashboardState = {
  parts: [], rfqs: [], quotes: [], orders: [], unreadMessages: 0,
  verification: null, expiringDocs: [], shipments: 0, invoices: 0, promotions: [], loading: true,
};

export default function SupplierOperationsDashboard() {
  const [state, setState] = useState(initial);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoadError(null);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [partsRes, rfqs, quotes, orders, unreadRes, supplierRes, summaryRes, docsRes, shipmentsRes, invoicesRes, promotionsRes] = await Promise.all([
          supabase.from("parts").select("id,part_number,description,status,quantity,unit_price,price_type,trace_certificate,category,created_at").eq("supplier_id", user.id).order("created_at", { ascending: false }),
          getSupplierRFQs(),
          getSupplierQuotes(),
          getSupplierOrders(),
          supabase.from("messages").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).eq("is_read", false),
          supabase.from("suppliers").select("verification_status,verification_completion,verification_missing_information").eq("id", user.id).maybeSingle(),
          supabase.rpc("get_supplier_verification_summary", { p_supplier_id: user.id }),
          supabase.from("supplier_verification_documents").select("id,document_name,expiry_date,verification_status").eq("supplier_id", user.id).neq("verification_status", "Replaced").not("expiry_date", "is", null).order("expiry_date", { ascending: true }),
          supabase.from("supplier_shipments").select("id", { count: "exact", head: true }).eq("supplier_id", user.id),
          supabase.from("supplier_invoices").select("id", { count: "exact", head: true }).eq("supplier_id", user.id),
          supabase.from("promotions").select("id,title,discount,status,ends_at").eq("supplier_id", user.id).in("status", ["Approved", "Active"]).order("created_at", { ascending: false }).limit(4),
        ]);

        const summary = summaryRes.data?.[0];
        const expiringDocs = (docsRes.data ?? []).filter((doc) => {
          const expiry = documentExpiryState(doc.expiry_date);
          return expiry.key === "expired" || expiry.key === "critical" || expiry.key === "warning";
        });

        if (mounted) setState({
          parts: (partsRes.data ?? []) as PartRow[],
          rfqs, quotes, orders,
          unreadMessages: unreadRes.count ?? 0,
          verification: supplierRes.data ? {
            status: supplierRes.data.verification_status,
            completion: Number(supplierRes.data.verification_completion ?? 0),
            expiring: Number(summary?.expiring_document_count ?? expiringDocs.filter(d => documentExpiryState(d.expiry_date).key !== "expired").length),
            expired: Number(summary?.expired_document_count ?? expiringDocs.filter(d => documentExpiryState(d.expiry_date).key === "expired").length),
            missing: supplierRes.data.verification_missing_information ?? [],
          } : null,
          expiringDocs,
          shipments: shipmentsRes.count ?? 0,
          invoices: invoicesRes.count ?? 0,
          promotions: (promotionsRes.data ?? []) as DashboardState["promotions"],
          loading: false,
        });
      } catch (error) {
        console.error("SUPPLIER OPERATIONS DASHBOARD ERROR", error);
        if (mounted) {
          setLoadError("We could not refresh the supplier workspace. Your previous data may be incomplete.");
          setState((current) => ({ ...current, loading: false }));
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const active = useMemo(() => state.parts.filter(p => p.status === "Published"), [state.parts]);
  const drafts = useMemo(() => state.parts.filter(p => p.status === "Draft"), [state.parts]);
  const attention = useMemo(() => state.parts.filter(p => p.status === "Published" && (!p.description || !p.category || !p.trace_certificate || (p.price_type !== "request_quote" && p.unit_price === null))), [state.parts]);
  const incomingRFQs = state.rfqs.filter(r => r.status === RFQStatus.Pending);
  const awaitingQuotes = state.quotes.filter(q => q.status === QuoteStatus.Sent);
  const acceptedQuotes = state.quotes.filter(q => q.status === QuoteStatus.Accepted);
  const activeOrders = state.orders.filter(o => !["Delivered", "Cancelled", "Completed"].includes(o.status));

  if (state.loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-7">
      <SubscriptionStatusCard />
      {loadError && <div role="alert" className="flex flex-col gap-3 rounded-xl border border-aviation-error/30 bg-aviation-error-soft p-4 text-sm text-aviation-error sm:flex-row sm:items-center sm:justify-between"><div><strong>Workspace refresh failed.</strong> {loadError}</div><button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-current px-3 font-semibold">Retry</button></div>}
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-aviation-accent">SUPPLIER CONTROL / SALES & INVENTORY</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-aviation-dark sm:text-4xl">Supplier operations workspace</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-aviation-muted">A part-level workspace for keeping inventory procurement-ready, responding to buyer demand and moving accepted business through fulfillment.</p>
        </div>
        <Link href="/supplier/inventory/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-aviation-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95"><Plus size={17}/>Add aircraft part</Link>
      </header>

      <Workflow />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Boxes} label="Active listings" value={active.length} href="/supplier/inventory" detail={`${state.parts.length} total inventory records`} />
        <Metric icon={ClipboardList} label="Buyer RFQs" value={incomingRFQs.length} href="/supplier/rfqs" detail="Requests awaiting supplier action" tone={incomingRFQs.length ? "accent" : "default"} />
        <Metric icon={FileText} label="Quotes awaiting response" value={awaitingQuotes.length} href="/supplier/quotes" detail={`${acceptedQuotes.length} accepted quotation${acceptedQuotes.length === 1 ? "" : "s"}`} />
        <Metric icon={PackageCheck} label="Purchase orders" value={activeOrders.length} href="/supplier/purchase-orders" detail={`${state.orders.length} total supplier orders`} />
      </div>

      {state.promotions.length > 0 && <section className="rounded-2xl border border-aviation-border bg-white p-5 sm:p-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-aviation-accent">PREMIUM VISIBILITY</p><h2 className="mt-1 text-lg font-bold text-aviation-dark">Active promotions</h2><p className="mt-1 text-sm text-aviation-muted">Approved supplier promotions currently available for eligible marketplace placement.</p></div><Link href="/supplier/marketing/promotions" className="text-sm font-semibold text-aviation-primary">Manage promotions</Link></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{state.promotions.map(p => <div key={p.id} className="rounded-xl border border-aviation-border bg-aviation-light p-4"><p className="font-semibold text-aviation-dark">{p.title}</p>{p.discount && <p className="mt-1 text-sm font-bold text-aviation-primary">{p.discount}</p>}<p className="mt-2 text-xs text-aviation-muted">{p.status}{p.ends_at ? ` · Ends ${new Date(p.ends_at).toLocaleDateString("en-GB")}` : ""}</p></div>)}</div></section>}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-2xl border border-aviation-border bg-white p-5 sm:p-6">
          <SectionTitle eyebrow="NEXT STEPS" title="Keep the sales pipeline moving" description="Actionable work is prioritized here instead of generic performance statistics." />
          <div className="mt-5 space-y-3">
            <NextStep show={Boolean(state.verification && state.verification.status !== "Verified")} icon={ShieldCheck} title={state.verification?.status === "Under Review" ? "Verification is under review" : "Complete supplier verification"} description={state.verification?.missing.length ? state.verification.missing.slice(0, 2).join(" · ") : "Keep your supplier trust record current for buyers."} href="/supplier/verification" status={state.verification?.status === "Verified" ? "Verified" : "Action required"} />
            <NextStep show={drafts.length > 0} icon={Pencil} title={`Finish ${drafts.length} draft listing${drafts.length === 1 ? "" : "s"}`} description="Complete part number, condition, price, category and documentation before publishing." href={drafts[0] ? `/supplier/inventory/${drafts[0].id}/edit` : "/supplier/inventory"} status="Required" />
            <NextStep show={attention.length > 0} icon={AlertTriangle} title={`${attention.length} listing${attention.length === 1 ? " needs" : "s need"} attention`} description="Review missing procurement data or certification information that can slow buyer evaluation." href="/supplier/inventory" status="Action required" />
            <NextStep show={incomingRFQs.length > 0} icon={ClipboardList} title={`Respond to ${incomingRFQs.length} buyer RFQ${incomingRFQs.length === 1 ? "" : "s"}`} description="Review quantities, required dates, condition and certification requirements before quoting." href="/supplier/rfqs" status="Pending" />
            <NextStep show={acceptedQuotes.length > 0} icon={CheckCircle2} title={`Process ${acceptedQuotes.length} accepted quotation${acceptedQuotes.length === 1 ? "" : "s"}`} description="Check the resulting purchase order and move the part into fulfillment." href="/supplier/purchase-orders" status="Accepted" />
            <NextStep show={state.expiringDocs.length > 0} icon={FileCheck2} title={`Review ${state.expiringDocs.length} compliance document${state.expiringDocs.length === 1 ? "" : "s"}`} description="Expiry alerts can affect supplier trust and buyer confidence." href="/supplier/verification" status="Expiring" />
            {!drafts.length && !attention.length && !incomingRFQs.length && !acceptedQuotes.length && !state.expiringDocs.length && state.verification?.status === "Verified" && <NextStep show icon={Boxes} title="Catalog is procurement-ready" description="Add stock, keep certifications current and monitor new buyer demand." href="/supplier/inventory/new" status="Ready" />}
          </div>
        </section>

        <TrustPanel verification={state.verification} expiringDocs={state.expiringDocs} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <QueueCard icon={ClipboardList} eyebrow="DEMAND" title="Buyer RFQs" count={incomingRFQs.length} href="/supplier/rfqs" empty="No pending buyer RFQs." items={incomingRFQs.slice(0, 4).map(r => ({ title: r.part_number || r.description || `RFQ ${r.id.slice(0, 8).toUpperCase()}`, meta: `${r.quantity} units · ${r.preferred_condition || "Condition open"}`, status: r.status }))} />
        <QueueCard icon={FileText} eyebrow="COMMERCIAL" title="Quotations" count={awaitingQuotes.length + acceptedQuotes.length} href="/supplier/quotes" empty="No quotation actions pending." items={state.quotes.slice(0, 4).map(q => ({ title: q.rfq?.part_number || `RFQ ${q.rfq_id.slice(0, 8).toUpperCase()}`, meta: `${q.currency} ${Number(q.unit_price).toLocaleString()} · ${q.lead_time}`, status: q.status }))} />
        <QueueCard icon={ShoppingCartIcon} eyebrow="FULFILLMENT" title="Purchase orders" count={activeOrders.length} href="/supplier/purchase-orders" empty="No active purchase orders." items={activeOrders.slice(0, 4).map(o => ({ title: o.part?.part_number || `PO ${o.id.slice(0, 8).toUpperCase()}`, meta: `${o.quantity} units · ${o.currency} ${Number(o.total_amount).toLocaleString()}`, status: o.status }))} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <LinkTile icon={Truck} title="Shipments" detail={`${state.shipments} shipment record${state.shipments === 1 ? "" : "s"}`} href="/supplier/shipments" />
        <LinkTile icon={Receipt} title="Invoices & payment" detail={`${state.invoices} invoice record${state.invoices === 1 ? "" : "s"}`} href="/supplier/invoices" />
        <LinkTile icon={MessageSquare} title="Buyer messages" detail={`${state.unreadMessages} unread conversation${state.unreadMessages === 1 ? "" : "s"}`} href="/supplier/messages" alert={state.unreadMessages > 0} />
        <LinkTile icon={Building2} title="Company profile" detail="Trust, company and selling information" href="/supplier/profile" />
      </div>
    </div>
  );
}

function Workflow() {
  const steps = [
    ["Profile", "/supplier/profile", Building2], ["Verification", "/supplier/verification", ShieldCheck], ["Inventory", "/supplier/inventory", Boxes], ["Buyer RFQ", "/supplier/rfqs", ClipboardList], ["Quote", "/supplier/quotes", FileText], ["Purchase Order", "/supplier/purchase-orders", PackageCheck], ["Shipment", "/supplier/shipments", Truck], ["Payment", "/supplier/invoices", Receipt],
  ] as const;
  return <section className="overflow-x-auto rounded-2xl border border-aviation-border bg-aviation-dark p-4 text-white sm:p-5" aria-label="Supplier sales workflow"><div className="flex min-w-[850px] items-center gap-2">{steps.map(([label, href, Icon], index) => <div key={label} className="flex min-w-0 flex-1 items-center gap-2"><Link href={href} className="group flex min-w-0 flex-1 items-center gap-2 rounded-xl p-2 hover:bg-white/10"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-aviation-accent"><Icon size={16}/></span><span className="min-w-0"><span className="block truncate text-xs font-semibold">{label}</span><span className="font-mono text-[9px] uppercase tracking-wider text-white/40">STEP {String(index + 1).padStart(2, "0")}</span></span></Link>{index < steps.length - 1 && <ArrowRight size={14} className="shrink-0 text-white/25" aria-hidden="true"/>}</div>)}</div></section>;
}

function TrustPanel({ verification, expiringDocs }: { verification: DashboardState["verification"]; expiringDocs: DashboardState["expiringDocs"] }) {
  return <section className="rounded-2xl border border-aviation-border bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-aviation-accent">TRUST & COMPLIANCE</p><h2 className="mt-1 text-xl font-semibold text-aviation-dark">Buyer-facing supplier readiness</h2><p className="mt-1 text-sm text-aviation-muted">Verification and document health are kept visible because they directly affect procurement confidence.</p></div><BadgeCheck className="text-aviation-success" size={23}/></div><div className="mt-5 rounded-xl bg-aviation-light p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><ShieldCheck size={18} className="text-aviation-primary"/><span className="font-semibold">Verification status</span></div>{verification ? <VerificationStatusBadge status={verification.status} compact /> : <StatusBadge status="Required" />}</div>{verification && <><div className="mt-4 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-aviation-accent" style={{ width: `${Math.max(0, Math.min(100, verification.completion))}%` }}/></div><div className="mt-2 flex justify-between text-xs text-aviation-muted"><span>{verification.completion}% verification readiness</span><span>{verification.expiring + verification.expired} document alert{verification.expiring + verification.expired === 1 ? "" : "s"}</span></div></>}</div>{expiringDocs.length > 0 && <div className="mt-4 space-y-2">{expiringDocs.slice(0, 3).map(doc => <Link key={doc.id} href="/supplier/verification" className="flex items-center justify-between gap-3 rounded-xl border border-aviation-border px-3 py-3 hover:bg-aviation-light"><span className="flex min-w-0 items-center gap-2"><AlertTriangle size={16} className="shrink-0 text-aviation-warning"/><span className="truncate text-sm font-medium">{doc.document_name}</span></span><span className="shrink-0 text-xs text-aviation-muted">{documentExpiryState(doc.expiry_date).label}</span></Link>)}</div>}<Link href="/supplier/verification" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-aviation-primary">Open verification centre <ArrowRight size={15}/></Link></section>;
}

function NextStep({ show, icon: Icon, title, description, href, status }: { show: boolean; icon: React.ElementType; title: string; description: string; href: string; status: string }) {
  if (!show) return null;
  return <Link href={href} className="group flex min-h-16 items-center gap-3 rounded-xl border border-aviation-border p-3 transition hover:border-aviation-primary/30 hover:bg-aviation-light"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-aviation-light text-aviation-primary group-hover:bg-white"><Icon size={18}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-aviation-dark">{title}</span><span className="mt-0.5 block text-xs leading-5 text-aviation-muted">{description}</span></span><span className="hidden shrink-0 sm:inline-flex"><StatusBadge status={status}/></span><ArrowRight size={16} className="shrink-0 text-aviation-muted"/></Link>;
}

function QueueCard({ icon: Icon, eyebrow, title, count, href, empty, items }: { icon: React.ElementType; eyebrow: string; title: string; count: number; href: string; empty: string; items: { title: string; meta: string; status: string }[] }) {
  return <section className="rounded-2xl border border-aviation-border bg-white p-5"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-aviation-light text-aviation-primary"><Icon size={18}/></span><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-aviation-muted">{eyebrow}</p><h2 className="mt-0.5 text-lg font-semibold">{title}</h2></div></div><span className="font-mono text-xl font-semibold text-aviation-dark">{count}</span></div>{items.length ? <div className="mt-4 space-y-2">{items.map((item, i) => <Link key={`${item.title}-${i}`} href={href} className="block rounded-xl border border-aviation-border p-3 hover:bg-aviation-light"><div className="flex items-start justify-between gap-2"><span className="truncate text-sm font-semibold">{item.title}</span><StatusBadge status={item.status}/></div><p className="mt-1 text-xs text-aviation-muted">{item.meta}</p></Link>)}</div> : <div className="mt-4 rounded-xl bg-aviation-light p-4 text-sm text-aviation-muted">{empty}</div>}<Link href={href} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-aviation-primary">Open {title.toLowerCase()} <ArrowRight size={15}/></Link></section>;
}

function Metric({ icon: Icon, label, value, detail, href, tone = "default" }: { icon: React.ElementType; label: string; value: number; detail: string; href: string; tone?: "default" | "accent" }) {
  return <Link href={href} className="rounded-2xl border border-aviation-border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm"><div className="flex items-start justify-between gap-3"><span className={`grid h-10 w-10 place-items-center rounded-lg ${tone === "accent" ? "bg-aviation-accent/10 text-aviation-accent" : "bg-aviation-light text-aviation-primary"}`}><Icon size={19}/></span><span className="font-mono text-3xl font-semibold tracking-tight text-aviation-dark">{value}</span></div><p className="mt-4 text-sm font-semibold text-aviation-dark">{label}</p><p className="mt-1 text-xs leading-5 text-aviation-muted">{detail}</p></Link>;
}

function LinkTile({ icon: Icon, title, detail, href, alert = false }: { icon: React.ElementType; title: string; detail: string; href: string; alert?: boolean }) {
  return <Link href={href} className="flex min-h-24 items-center gap-3 rounded-2xl border border-aviation-border bg-white p-4 hover:bg-aviation-light"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-aviation-light text-aviation-primary"><Icon size={18}/></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-semibold">{title}{alert && <span className="h-2 w-2 rounded-full bg-aviation-error" aria-label="Unread"/>}</span><span className="mt-1 block text-xs text-aviation-muted">{detail}</span></span><ArrowRight size={15} className="shrink-0 text-aviation-muted"/></Link>;
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-aviation-accent">{eyebrow}</p><h2 className="mt-1 text-xl font-semibold text-aviation-dark">{title}</h2><p className="mt-1 text-sm leading-5 text-aviation-muted">{description}</p></div>; }

function DashboardSkeleton() { return <div className="space-y-6" aria-busy="true" aria-label="Loading supplier operations workspace"><div className="skeleton h-24 w-full rounded-2xl"/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 rounded-2xl border border-aviation-border bg-white p-5"><div className="skeleton h-10 w-10 rounded-lg"/><div className="skeleton mt-4 h-4 w-28"/></div>)}</div><div className="grid gap-5 xl:grid-cols-2"><div className="skeleton h-80 rounded-2xl"/><div className="skeleton h-80 rounded-2xl"/></div></div>; }

function ShoppingCartIcon(props: React.ComponentProps<typeof PackageCheck>) { return <PackageCheck {...props}/>; }
