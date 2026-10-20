/* eslint-disable @next/next/no-img-element -- small static logo in a printable document */
import type { Invoice, Order } from "@/lib/orders";
import { formatOrderAmount, formatOrderDate } from "@/lib/orders";

/**
 * Standard printable documents. While `printing` is set the document gets the
 * .print-document class, which is all that "Print / Save as PDF" prints (globals.css).
 */

function DocumentHeader({ kind, number, date }: { kind: string; number: string; date: string | null }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-aviation-primary pb-4">
      <div className="flex items-center gap-3">
        <img src="/icon.svg" alt="" width={40} height={40} className="h-10 w-10" />
        <div>
          <p className="text-lg font-bold text-aviation-dark">AviaInventory</p>
          <p className="text-xs text-aviation-muted">Aircraft Parts Marketplace</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xl font-bold uppercase tracking-wide text-aviation-primary">{kind}</p>
        <p className="font-mono text-sm font-semibold text-aviation-dark">{number}</p>
        <p className="text-xs text-aviation-muted">Date: {formatOrderDate(date)}</p>
      </div>
    </div>
  );
}

function Party({ title, lines }: { title: string; lines: Array<string | null | undefined> }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-aviation-muted">{title}</p>
      <div className="mt-1 space-y-0.5 text-sm text-aviation-dark">
        {lines.filter(Boolean).map((line, index) => <p key={index} className={index === 0 ? "font-semibold" : ""}>{line}</p>)}
      </div>
    </div>
  );
}

function ItemsTable({ part, description, quantity, unitPrice, total, currency }: { part: string; description: string | null; quantity: number; unitPrice: number; total: number; currency: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-aviation-border text-xs uppercase tracking-wide text-aviation-muted">
            <th className="py-2 pr-3">Part number</th>
            <th className="py-2 pr-3">Description</th>
            <th className="py-2 pr-3 text-right">Qty</th>
            <th className="py-2 pr-3 text-right">Unit price</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-aviation-border align-top">
            <td className="py-3 pr-3 font-mono font-semibold">{part}</td>
            <td className="py-3 pr-3 text-aviation-muted">{description || "—"}</td>
            <td className="py-3 pr-3 text-right">{quantity.toLocaleString()}</td>
            <td className="py-3 pr-3 text-right whitespace-nowrap">{formatOrderAmount(unitPrice, currency)}</td>
            <td className="py-3 text-right font-semibold whitespace-nowrap">{formatOrderAmount(total, currency)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function TotalsRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-6 py-1 ${strong ? "border-t border-aviation-border pt-2 text-base font-bold text-aviation-dark" : "text-sm text-aviation-muted"}`}>
      <span>{label}</span><span className="whitespace-nowrap">{value}</span>
    </div>
  );
}

const footer = "Generated on AviaInventory (www.aviainventory.com), operated by Upgear Aviation Limited.";

export function PurchaseOrderDocument({ order, printing = false }: { order: Order; printing?: boolean }) {
  const part = order.part?.part_number ?? "Aviation part";
  return (
    <article className={`${printing ? "print-document " : ""}space-y-5 rounded-2xl border border-aviation-border bg-white p-5 sm:p-8`}>
      <DocumentHeader kind="Purchase order" number={order.po_number ?? "Draft"} date={order.po_issued_at} />
      <div className="grid gap-5 sm:grid-cols-3">
        <Party title="Buyer" lines={[order.buyer_company_name]} />
        <Party title="Supplier" lines={[order.supplier_company_name ?? order.supplier?.company_name]} />
        <Party title="Ship to" lines={[order.ship_to_name, order.ship_to_company, order.ship_to_address, [order.ship_to_city, order.ship_to_country].filter(Boolean).join(", "), order.ship_to_phone]} />
      </div>
      <ItemsTable part={part} description={order.part?.description ?? null} quantity={order.quantity} unitPrice={Number(order.unit_price)} total={Number(order.total_amount)} currency={order.currency} />
      <div className="grid gap-5 sm:grid-cols-2">
        <dl className="space-y-1 text-sm">
          <div className="flex gap-2"><dt className="text-aviation-muted">Shipping method:</dt><dd className="font-semibold">{order.shipping_method ?? "—"}</dd></div>
          {order.shipping_account_number && <div className="flex gap-2"><dt className="text-aviation-muted">Shipping account no.:</dt><dd className="font-mono font-semibold">{order.shipping_account_number}</dd></div>}
          {order.required_date && <div className="flex gap-2"><dt className="text-aviation-muted">Required by:</dt><dd className="font-semibold">{formatOrderDate(order.required_date)}</dd></div>}
          <div className="flex gap-2"><dt className="text-aviation-muted">Order reference:</dt><dd className="font-mono">{order.id.slice(0, 8).toUpperCase()}</dd></div>
        </dl>
        <div className="sm:ml-auto sm:w-64"><TotalsRow label="Order total" value={formatOrderAmount(Number(order.total_amount), order.currency)} strong /></div>
      </div>
      {order.buyer_message && <div className="rounded-xl bg-aviation-light p-3 text-sm"><p className="text-xs font-bold uppercase tracking-wider text-aviation-muted">Notes</p><p className="mt-1 whitespace-pre-line">{order.buyer_message}</p></div>}
      <p className="border-t border-aviation-border pt-3 text-[11px] text-aviation-muted">{footer}</p>
    </article>
  );
}

export function InvoiceDocument({ order, invoice, printing = false }: { order: Order; invoice: Invoice; printing?: boolean }) {
  const paid = invoice.status === "Paid";
  return (
    <article className={`${printing ? "print-document " : ""}space-y-5 rounded-2xl border border-aviation-border bg-white p-5 sm:p-8`}>
      <DocumentHeader kind="Invoice" number={invoice.invoice_number} date={invoice.issued_at} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${paid ? "bg-aviation-success-soft text-aviation-success" : "bg-aviation-warning-soft text-aviation-warning"}`}>
          {paid ? "Paid" : invoice.buyer_marked_paid_at ? "Marked paid by buyer, awaiting confirmation" : "Unpaid"}
        </span>
        <p className="text-sm text-aviation-muted">
          {invoice.due_date && invoice.due_date !== invoice.issued_at
            ? <>Due: <span className="font-semibold text-aviation-dark">{formatOrderDate(invoice.due_date)}</span></>
            : <span className="font-semibold text-aviation-dark">Payable on receipt</span>}
          {invoice.payment_terms ? ` · ${invoice.payment_terms}` : ""}
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <Party title="From (supplier)" lines={[order.supplier_company_name ?? order.supplier?.company_name]} />
        <Party title="Bill to (buyer)" lines={[order.buyer_company_name, order.ship_to_name]} />
        <Party title="Purchase order" lines={[order.po_number, `Order ${order.id.slice(0, 8).toUpperCase()}`]} />
      </div>
      <ItemsTable part={invoice.description ?? order.part?.part_number ?? "Aviation part"} description={order.part?.description ?? null} quantity={invoice.quantity ?? order.quantity} unitPrice={Number(invoice.unit_price ?? order.unit_price)} total={Number(invoice.subtotal)} currency={invoice.currency} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-xl bg-aviation-light p-4 text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-aviation-muted">Payment details</p>
          <dl className="mt-2 space-y-1">
            {invoice.bank_name && <div className="flex gap-2"><dt className="text-aviation-muted">Bank:</dt><dd className="font-semibold">{invoice.bank_name}{invoice.bank_branch ? `, ${invoice.bank_branch}` : ""}</dd></div>}
            {invoice.bank_account_name && <div className="flex gap-2"><dt className="text-aviation-muted">Account name:</dt><dd className="font-semibold">{invoice.bank_account_name}</dd></div>}
            {invoice.bank_account_number && <div className="flex gap-2"><dt className="text-aviation-muted">Account no.:</dt><dd className="font-mono font-semibold">{invoice.bank_account_number}</dd></div>}
            {invoice.bank_swift && <div className="flex gap-2"><dt className="text-aviation-muted">SWIFT:</dt><dd className="font-mono font-semibold">{invoice.bank_swift}</dd></div>}
            {invoice.payment_instructions && <p className="whitespace-pre-line pt-1">{invoice.payment_instructions}</p>}
          </dl>
        </div>
        <div className="sm:ml-auto sm:w-64">
          <TotalsRow label="Subtotal" value={formatOrderAmount(Number(invoice.subtotal), invoice.currency)} />
          {Number(invoice.tax_rate) > 0 && <TotalsRow label={`Tax (${Number(invoice.tax_rate)}%)`} value={formatOrderAmount(Number(invoice.tax_amount), invoice.currency)} />}
          <TotalsRow label="Total due" value={formatOrderAmount(Number(invoice.total_amount), invoice.currency)} strong />
        </div>
      </div>
      {invoice.buyer_payment_reference && <p className="text-sm text-aviation-muted">Buyer&apos;s payment reference: <span className="font-mono font-semibold text-aviation-dark">{invoice.buyer_payment_reference}</span></p>}
      {invoice.notes && <div className="rounded-xl border border-aviation-border p-3 text-sm"><p className="text-xs font-bold uppercase tracking-wider text-aviation-muted">Notes</p><p className="mt-1 whitespace-pre-line">{invoice.notes}</p></div>}
      <p className="border-t border-aviation-border pt-3 text-[11px] text-aviation-muted">Payments are made directly between buyer and supplier. {footer}</p>
    </article>
  );
}
