"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Receipt } from "lucide-react";
import EmptyState from "@/components/dashboard/EmptyState";
import { formatOrderAmount, formatOrderDate, getBuyerInvoices, type InvoiceWithOrder } from "@/lib/orders";

function invoiceState(invoice: InvoiceWithOrder) {
  if (invoice.status === "Cancelled") return { label: "Cancelled", className: "bg-aviation-light text-aviation-muted", action: false };
  if (invoice.status === "Paid") return { label: "Paid", className: "bg-aviation-success-soft text-aviation-success", action: false };
  if (invoice.buyer_marked_paid_at) return { label: "Awaiting supplier confirmation", className: "bg-aviation-warning-soft text-aviation-warning", action: false };
  return { label: "Unpaid", className: "bg-aviation-warning-soft text-aviation-warning", action: true };
}

export default function BuyerInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithOrder[] | null>(null);

  useEffect(() => {
    let active = true;
    getBuyerInvoices().then((rows) => { if (active) setInvoices(rows); });
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-aviation-primary">Invoices</h1>
        <p className="mt-2 text-sm text-aviation-muted">Invoices from suppliers for your purchase orders. Pay the supplier using the details on the invoice, then mark it as paid.</p>
      </div>

      {invoices === null ? (
        <div className="space-y-3" aria-busy="true">{[0, 1].map((key) => <div key={key} className="skeleton h-28 rounded-2xl" />)}</div>
      ) : invoices.length === 0 ? (
        <EmptyState icon={Receipt} eyebrow="NO INVOICES YET" title="No invoices yet" description="When a supplier invoices one of your purchase orders, it appears here and in the order." actionLabel="View orders" actionHref="/buyer/orders" />
      ) : (
        <ul className="space-y-3">
          {invoices.map((invoice) => {
            const state = invoiceState(invoice);
            return (
              <li key={invoice.id}>
                <Link href={`/buyer/orders/${invoice.order_id}#invoice`} className="group block rounded-2xl border border-aviation-border bg-white p-4 shadow-sm transition hover:border-aviation-primary/40 hover:shadow-md sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-aviation-primary">{invoice.invoice_number}</p>
                      <p className="mt-1 text-sm text-aviation-muted">
                        {invoice.order?.supplier_company_name ?? "Supplier"} · {invoice.order?.po_number ?? "Purchase order"} · issued {formatOrderDate(invoice.issued_at)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${state.className}`}>{state.label}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xl font-bold text-aviation-dark">{formatOrderAmount(Number(invoice.total_amount), invoice.currency)}</p>
                      <p className="text-xs text-aviation-muted">Due {formatOrderDate(invoice.due_date)}</p>
                    </div>
                    {state.action ? (
                      <span className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-aviation-primary px-4 py-2 text-sm font-bold text-white">View and mark as paid <ChevronRight size={16} /></span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-aviation-primary group-hover:underline">View invoice <ChevronRight size={16} /></span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
