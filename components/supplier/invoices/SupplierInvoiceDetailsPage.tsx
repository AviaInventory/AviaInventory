"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Printer } from "lucide-react";
import { getInvoice, getOrderWithInvoice, type Invoice, type Order } from "@/lib/orders";
import { InvoiceDocument } from "@/components/orders/OrderDocuments";

/** A supplier's invoice, with a link to the order where payment is confirmed. */
export default function SupplierInvoiceDetailsPage({ invoiceId }: { invoiceId: string }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const found = await getInvoice(invoiceId);
      const result = found ? await getOrderWithInvoice(found.order_id) : { order: null };
      if (!active) return;
      setInvoice(found);
      setOrder(result.order);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [invoiceId]);

  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    const timer = window.setTimeout(() => window.print(), 50);
    return () => { window.removeEventListener("afterprint", done); window.clearTimeout(timer); };
  }, [printing]);

  if (loading) return <div className="skeleton h-96 rounded-2xl" aria-busy="true" />;
  if (!invoice || !order) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <h1 className="text-xl font-bold text-aviation-dark">Invoice not found</h1>
        <Link href="/supplier/invoices" className="mt-4 inline-flex font-semibold text-aviation-primary hover:underline">Back to invoices</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/supplier/invoices" className="inline-flex items-center gap-2 text-sm font-semibold text-aviation-primary hover:underline"><ArrowLeft size={16} /> Back to invoices</Link>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setPrinting(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-aviation-border bg-white px-4 text-sm font-semibold"><Printer size={15} /> Print / Save as PDF</button>
          <Link href={`/supplier/purchase-orders/${order.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-aviation-primary px-4 text-sm font-bold text-white">Open order <ArrowRight size={15} /></Link>
        </div>
      </div>
      <InvoiceDocument order={order} invoice={invoice} printing={printing} />
    </div>
  );
}
