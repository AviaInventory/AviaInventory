"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ScrollToHash from "@/components/common/ScrollToHash";
import { ArrowLeft, Building2, CheckCircle2, ExternalLink, Loader2, Package, Printer, Truck, XCircle } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import RequiredMark from "@/components/ui/RequiredMark";
import { trackingUrl } from "@/lib/shipments";
import {
  cancelOrder, confirmOrderReceived, confirmPaymentReceived, formatOrderAmount, formatOrderDate,
  getOrderWithInvoice, markInvoicePaid, markOrderDispatched, type Invoice, type Order,
} from "@/lib/orders";
import NextStepDialog, { type NextStep } from "./NextStepDialog";
import OrderProgress from "./OrderProgress";
import PurchaseOrderForm from "./PurchaseOrderForm";
import InvoiceForm from "./InvoiceForm";
import { InvoiceDocument, PurchaseOrderDocument } from "./OrderDocuments";
import { nextAction, type OrderRole } from "./workflow";

const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-aviation-primary px-6 py-3 text-sm font-bold text-white disabled:opacity-60";
/** How often an open order page checks for the other party's progress. */
const POLL_MS = 15_000;

const field = "min-h-11 w-full rounded-xl border border-aviation-border bg-white px-4 py-2.5 text-sm focus:border-aviation-primary focus:outline-none";

/**
 * One order, for the buyer or the supplier: progress, the current step's action,
 * the purchase order and invoice documents, and the guidance pop-ups.
 */
export default function OrderWorkspace({ orderId, role: routeRole }: { orderId: string; role: OrderRole }) {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<NextStep | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editingPo, setEditingPo] = useState(false);
  const [printing, setPrinting] = useState<"po" | "invoice" | null>(null);
  const [reference, setReference] = useState("");
  const [dispatch, setDispatch] = useState({ tracking: "", note: "" });
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  // Accounts that buy and sell can open either workspace; act as whichever party they are on this order.
  const [viewerRole, setViewerRole] = useState<OrderRole | null>(null);
  const role: OrderRole = viewerRole ?? routeRole;
  const stepRef = useRef<HTMLElement | null>(null);
  const invoiceRef = useRef<HTMLElement | null>(null);
  const prompted = useRef(false);
  const lastStatus = useRef<string | null>(null);
  const busyRef = useRef(false);

  const load = useCallback(async () => {
    const [result, { data: { user } }] = await Promise.all([getOrderWithInvoice(orderId), supabase.auth.getUser()]);
    if (result.order && user) {
      setViewerRole(user.id === result.order.buyer_id ? "buyer" : user.id === result.order.supplier_id ? "supplier" : null);
    }
    setOrder(result.order);
    setInvoice(result.invoice);
    setLoading(false);
    return result;
  }, [orderId]);

  const goToStep = () => stepRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const goToInvoice = () => invoiceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  /** The pop-up for a step where this party has to act (null when they are waiting). */
  const promptFor = (loaded: Order, as: OrderRole): NextStep | null => {
    if (as === "supplier" && loaded.status === "PO Issued") return { tone: "info", title: "Purchase order received", message: `${loaded.buyer_company_name ?? "The buyer"} sent purchase order ${loaded.po_number}. Review it and create your invoice to proceed.`, action: { label: "Create invoice", onClick: goToStep } };
    if (as === "buyer" && loaded.status === "Awaiting PO") return { tone: "info", title: "Create your purchase order", message: "Confirm the delivery address and shipping method so the supplier can invoice you.", action: { label: "Create purchase order", onClick: goToStep } };
    if (as === "buyer" && loaded.status === "Invoiced") return { tone: "info", title: "Invoice received", message: "Pay the supplier using the details on the invoice, then mark it as paid here.", action: { label: "View invoice", onClick: goToInvoice } };
    if (as === "supplier" && loaded.status === "Payment Sent") return { tone: "info", title: "Buyer marked the invoice as paid", message: "Check that the payment has reached your account, then confirm it to proceed to dispatch.", action: { label: "Confirm payment", onClick: goToStep } };
    if (as === "buyer" && loaded.status === "Paid") return { tone: "info", title: "Payment confirmed", message: "The supplier confirmed your payment. You'll be notified when the order is dispatched." };
    if (as === "buyer" && loaded.status === "Dispatched") return { tone: "info", title: "Your order is on its way", message: "Confirm once you receive the order to close it.", action: { label: "Confirm received", onClick: goToStep } };
    if (as === "supplier" && loaded.status === "Closed") return { title: "Order received and closed", message: "The buyer confirmed delivery. Thank you for using AviaInventory." };
    return null;
  };

  const partyOf = async (loaded: Order): Promise<OrderRole> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id === loaded.buyer_id ? "buyer" : user?.id === loaded.supplier_id ? "supplier" : routeRole;
  };

  // First visit in a step where this user must act: explain the step and offer to start it.
  useEffect(() => {
    let active = true;
    // Deferred so loading state is not set synchronously inside the effect.
    const timer = window.setTimeout(() => load().then(async ({ order: loaded }) => {
      if (!active || !loaded || prompted.current) return;
      lastStatus.current = loaded.status;
      prompted.current = true;
      if (window.location.hash) return; // ScrollToHash takes the user to e.g. #invoice
      if (searchParams.get("step")) { setTimeout(goToStep, 300); return; }
      const key = `order-prompt:${loaded.id}:${loaded.status}`;
      try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch { /* storage unavailable */ }
      const prompt = promptFor(loaded, await partyOf(loaded));
      if (prompt) setDialog(prompt);
    }), 0);
    return () => { active = false; window.clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, routeRole]);

  // Keep the page current while it is open: when the other party completes their step,
  // the status changes here without a refresh and the next step pops up.
  useEffect(() => {
    const check = async () => {
      if (document.visibilityState !== "visible" || busyRef.current) return;
      const { order: latest } = await load();
      if (!latest || latest.status === lastStatus.current) return;
      lastStatus.current = latest.status;
      const prompt = promptFor(latest, await partyOf(latest));
      if (prompt) setDialog(prompt);
    };
    const timer = window.setInterval(check, POLL_MS);
    document.addEventListener("visibilitychange", check);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", check); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(null);
    window.addEventListener("afterprint", done);
    const timer = window.setTimeout(() => window.print(), 50);
    return () => { window.removeEventListener("afterprint", done); window.clearTimeout(timer); };
  }, [printing]);

  async function run(action: () => Promise<{ success: boolean; error?: string }>, after: NextStep) {
    setBusy(true);
    busyRef.current = true;
    setError("");
    const result = await action();
    if (!result.success) {
      setBusy(false);
      busyRef.current = false;
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    const { order: updated } = await load();
    lastStatus.current = updated?.status ?? null;
    setBusy(false);
    busyRef.current = false;
    setDialog(after);
  }

  if (loading) {
    return <div className="space-y-4" aria-busy="true"><div className="skeleton h-28 rounded-2xl" /><div className="skeleton h-64 rounded-2xl" /></div>;
  }
  if (!order) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <h1 className="text-xl font-bold text-aviation-dark">Order not found</h1>
        <p className="mt-2 text-sm text-aviation-muted">It may have been removed, or it belongs to another account.</p>
        <Link href={role === "buyer" ? "/buyer/orders" : "/supplier/purchase-orders"} className="mt-5 inline-flex font-semibold text-aviation-primary hover:underline">Back to orders</Link>
      </div>
    );
  }

  const buyer = role === "buyer";
  const next = nextAction(order.status, role);
  const part = order.part?.part_number ?? "Aviation part";
  const counterpart = buyer ? (order.supplier_company_name ?? order.supplier?.company_name ?? "Supplier") : (order.buyer_company_name ?? "Buyer");
  const canCancel = ["Awaiting PO", "PO Issued", "Invoiced"].includes(order.status);
  const total = invoice ? Number(invoice.total_amount) : Number(order.total_amount);
  // Courier shipments need a tracking number; pick-up and supplier freight may not have one.
  const needsTracking = ["DHL", "FedEx", "UPS", "Aramex"].includes(order.shipping_method ?? "");

  let stepBody: React.ReactNode = <p className="text-sm text-aviation-muted">{next.hint}</p>;
  if (buyer && (order.status === "Awaiting PO" || (order.status === "PO Issued" && editingPo))) {
    stepBody = (
      <PurchaseOrderForm order={order} onIssued={async (po) => {
        setEditingPo(false);
        await load();
        setDialog({ title: order.po_number ? "Purchase order updated" : "Purchase order sent", message: `${po} has been sent to ${counterpart}. We'll notify you when the invoice is ready.` });
      }} />
    );
  } else if (buyer && order.status === "PO Issued") {
    stepBody = (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-aviation-muted">{next.hint}</p>
        <button type="button" onClick={() => setEditingPo(true)} className="inline-flex min-h-11 items-center rounded-xl border border-aviation-border px-5 text-sm font-semibold">Edit purchase order</button>
      </div>
    );
  } else if (!buyer && order.status === "PO Issued") {
    stepBody = <InvoiceForm order={order} onIssued={async (number) => { await load(); setDialog({ title: "Invoice sent", message: `${number} has been sent to ${counterpart}. Confirm the payment here once you receive it.` }); }} />;
  } else if (buyer && order.status === "Invoiced") {
    stepBody = (
      <div className="space-y-3">
        <p className="text-sm text-aviation-muted">Pay <strong className="text-aviation-dark">{formatOrderAmount(total, order.currency)}</strong> to {counterpart}{invoice?.due_date && invoice.due_date !== invoice.issued_at ? <> by <strong className="text-aviation-dark">{formatOrderDate(invoice.due_date)}</strong></> : null}, then mark the invoice as paid.</p>
        {invoice && (
          <div className="rounded-xl bg-aviation-light p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-aviation-dark">Invoice {invoice.invoice_number}</p>
              <button type="button" onClick={goToInvoice} className="text-sm font-semibold text-aviation-primary hover:underline">View full invoice</button>
            </div>
            <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {invoice.bank_name && <div><dt className="inline text-aviation-muted">Bank: </dt><dd className="inline font-semibold">{invoice.bank_name}{invoice.bank_branch ? `, ${invoice.bank_branch}` : ""}</dd></div>}
              {invoice.bank_account_name && <div><dt className="inline text-aviation-muted">Account name: </dt><dd className="inline font-semibold">{invoice.bank_account_name}</dd></div>}
              {invoice.bank_account_number && <div><dt className="inline text-aviation-muted">Account no.: </dt><dd className="inline font-mono font-semibold">{invoice.bank_account_number}</dd></div>}
              {invoice.bank_swift && <div><dt className="inline text-aviation-muted">SWIFT: </dt><dd className="inline font-mono font-semibold">{invoice.bank_swift}</dd></div>}
            </dl>
            {invoice.payment_instructions && <p className="mt-2 whitespace-pre-line">{invoice.payment_instructions}</p>}
          </div>
        )}
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1"><label htmlFor="pay-ref" className="mb-1.5 block text-sm font-semibold">Payment reference (optional)</label><input id="pay-ref" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="e.g. bank transfer or M-Pesa code" className={field} /></div>
          <button type="button" disabled={busy} className={button} onClick={() => run(() => markInvoicePaid(order.id, reference), { title: "Payment marked as sent", message: `Thank you. ${counterpart} will confirm once the payment arrives, then dispatch your order.` })}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Mark invoice as paid
          </button>
        </div>
      </div>
    );
  } else if (!buyer && (order.status === "Invoiced" || order.status === "Payment Sent")) {
    stepBody = (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-aviation-muted">
          {order.status === "Payment Sent"
            ? <>The buyer marked {invoice?.invoice_number ?? "the invoice"} as paid{invoice?.buyer_payment_reference ? <> (reference <strong className="font-mono text-aviation-dark">{invoice.buyer_payment_reference}</strong>)</> : null}. Confirm once the money is in your account.</>
            : <>Waiting for the buyer to pay {formatOrderAmount(total, order.currency)}. If you have already received it, you can confirm now.</>}
        </p>
        <button type="button" disabled={busy} className={button} onClick={() => run(() => confirmPaymentReceived(order.id), { title: "Payment confirmed", message: "The invoice is now marked as paid. Please dispatch the order next.", action: { label: "Mark as dispatched", onClick: goToStep } })}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Confirm payment received
        </button>
      </div>
    );
  } else if (!buyer && order.status === "Paid") {
    stepBody = (
      <div className="space-y-3">
        {/* The courier and account come from the buyer's purchase order; the supplier adds tracking only. */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="mb-1.5 block text-sm font-semibold">Courier</p>
            <p className="flex min-h-11 items-center rounded-xl bg-aviation-light px-4 text-sm font-semibold">{order.shipping_method ?? "As agreed"}{order.shipping_account_number ? <span className="ml-2 font-mono font-normal text-aviation-muted">acct {order.shipping_account_number}</span> : null}</p>
          </div>
          <div><label htmlFor="d-track" className="mb-1.5 block text-sm font-semibold">Tracking / waybill number {needsTracking && <RequiredMark />}</label><input id="d-track" value={dispatch.tracking} onChange={(event) => setDispatch({ ...dispatch, tracking: event.target.value })} className={field} /></div>
          <div><label htmlFor="d-note" className="mb-1.5 block text-sm font-semibold">Note for the buyer</label><input id="d-note" value={dispatch.note} onChange={(event) => setDispatch({ ...dispatch, note: event.target.value })} placeholder={order.shipping_method === "Own pick-up" ? "e.g. ready for collection at our Nairobi office" : ""} className={field} /></div>
        </div>
        <div className="flex justify-end">
          <button type="button" disabled={busy || (needsTracking && !dispatch.tracking.trim())} className={button} onClick={() => run(() => markOrderDispatched(order.id, "", dispatch.tracking, dispatch.note), { title: "Order dispatched", message: "The buyer has been notified and will confirm when the order arrives." })}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />} Mark as dispatched
          </button>
        </div>
      </div>
    );
  } else if (buyer && order.status === "Dispatched") {
    const track = trackingUrl(order.dispatch_carrier ?? order.shipping_method, order.tracking_number);
    stepBody = (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-aviation-muted">
          Dispatched {formatOrderDate(order.dispatched_at)}{order.dispatch_carrier ? ` via ${order.dispatch_carrier}` : ""}{order.tracking_number ? <>, tracking <strong className="font-mono text-aviation-dark">{order.tracking_number}</strong></> : null}.{order.dispatch_note ? ` ${order.dispatch_note}` : ""}
        </p>
        <button type="button" disabled={busy} className={button} onClick={() => run(() => confirmOrderReceived(order.id), { title: "Order complete", message: "Thank you for using AviaInventory. The order is now closed." })}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />} Confirm order received
        </button>
        {track && (
          <a href={track} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-aviation-border px-5 text-sm font-semibold text-aviation-primary">
            Track shipment <ExternalLink size={15} />
          </a>
        )}
      </div>
    );
  } else if (order.status === "Cancelled") {
    stepBody = <p className="text-sm text-aviation-muted">Cancelled {formatOrderDate(order.cancelled_at)}{order.cancel_reason ? `: ${order.cancel_reason}` : "."}</p>;
  }

  return (
    <div className="space-y-6">
      <NextStepDialog step={dialog} onClose={() => setDialog(null)} />
      <ScrollToHash />
      {viewerRole && viewerRole !== routeRole && (
        <p className="rounded-xl border border-aviation-border bg-aviation-light p-3 text-sm text-aviation-muted print:hidden">
          You are the <strong className="text-aviation-dark">{viewerRole}</strong> on this order, so you&apos;re seeing the {viewerRole}&apos;s steps.
        </p>
      )}

      <Link href={buyer ? "/buyer/orders" : "/supplier/purchase-orders"} className="inline-flex items-center gap-2 text-sm font-semibold text-aviation-primary hover:underline print:hidden">
        <ArrowLeft size={16} /> Back to orders
      </Link>

      <section className="rounded-2xl border border-aviation-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-aviation-primary">{order.po_number ?? `Order ${order.id.slice(0, 8).toUpperCase()}`} · {formatOrderDate(order.created_at)}</p>
            <h1 className="aviation-break-anywhere mt-1 text-2xl font-bold text-aviation-dark">{order.quantity.toLocaleString()} × {part}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-aviation-muted"><Building2 size={15} /> {buyer ? "Supplier" : "Buyer"}: <span className="font-semibold text-aviation-dark">{counterpart}</span> · {formatOrderAmount(total, order.currency)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="mt-6"><OrderProgress status={order.status} /></div>
      </section>

      <section ref={stepRef} id="next-step" className={`scroll-mt-28 rounded-2xl border p-5 shadow-sm sm:p-6 ${next.yourTurn ? "border-aviation-primary bg-white" : "border-aviation-border bg-white"}`}>
        <p className="text-xs font-bold uppercase tracking-wider text-aviation-accent">{next.yourTurn ? "Your next step" : "Status"}</p>
        <h2 className="mt-1 text-lg font-bold text-aviation-dark">{next.label}</h2>
        <div className="mt-4">{stepBody}</div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-aviation-error-soft p-3 text-sm text-aviation-error">{error}</p>}
      </section>

      {invoice && (
        <section ref={invoiceRef} id="invoice" className="scroll-mt-28 space-y-3">
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-aviation-dark">Invoice</h2><button type="button" onClick={() => setPrinting("invoice")} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-aviation-border bg-white px-4 text-sm font-semibold"><Printer size={15} /> Print / Save as PDF</button></div>
          <InvoiceDocument order={order} invoice={invoice} printing={printing === "invoice"} />
        </section>
      )}

      {order.po_number && !editingPo && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-aviation-dark">Purchase order</h2><button type="button" onClick={() => setPrinting("po")} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-aviation-border bg-white px-4 text-sm font-semibold"><Printer size={15} /> Print / Save as PDF</button></div>
          <PurchaseOrderDocument order={order} printing={printing === "po"} />
        </section>
      )}

      {canCancel && (
        <section className="rounded-2xl border border-aviation-border bg-white p-5 print:hidden">
          {!cancelling ? (
            <button type="button" onClick={() => setCancelling(true)} className="inline-flex items-center gap-2 text-sm font-semibold text-aviation-error hover:underline"><XCircle size={16} /> Cancel this order</button>
          ) : (
            <div className="space-y-3">
              <label htmlFor="cancel-reason" className="block text-sm font-semibold">Why are you cancelling? The {buyer ? "supplier" : "buyer"} will see this.</label>
              <textarea id="cancel-reason" rows={2} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} className={field} />
              <div className="flex flex-wrap gap-3">
                <button type="button" disabled={busy || !cancelReason.trim()} onClick={() => run(() => cancelOrder(order.id, cancelReason), { title: "Order cancelled", message: `The ${buyer ? "supplier" : "buyer"} has been notified.` }).then(() => setCancelling(false))} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-aviation-error px-5 text-sm font-bold text-white disabled:opacity-60">Cancel order</button>
                <button type="button" onClick={() => setCancelling(false)} className="inline-flex min-h-11 items-center rounded-xl border border-aviation-border px-5 text-sm font-semibold">Keep order</button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
