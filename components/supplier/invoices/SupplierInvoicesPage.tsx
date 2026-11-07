"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Eye, FileText, Printer, Search } from "lucide-react";
import { fieldInput, fieldSelect } from "@/components/ui/form";
import { useDisplayCurrency } from "@/components/ui/useDisplayCurrency";
import { formatMoney } from "@/lib/currency";
import { supabase } from "@/lib/supabase";

type InvoiceRow = {
  id: string;
  invoice_number: string;
  order_id: string | null;
  currency: string | null;
  total_amount: number | string | null;
  status: string;
  issued_at: string | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  order: { po_number: string | null; buyer_company_name: string | null } | null;
};

const STATUSES = ["Pending", "Partially Paid", "Paid", "Overdue", "Cancelled", "Draft"];
const DATE_RANGES = [
  { value: "all", label: "All dates" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "year", label: "This year" },
] as const;

const muted = "text-[var(--aviation-muted)]";
const statusStyle: Record<string, string> = {
  Paid: "bg-aviation-success-soft text-aviation-success",
  Pending: "bg-amber-50 text-amber-700",
  "Partially Paid": "bg-blue-50 text-blue-700",
  Overdue: "bg-red-50 text-red-700",
  Cancelled: "bg-aviation-light text-[var(--aviation-muted)]",
  Draft: "bg-aviation-light text-[var(--aviation-muted)]",
};

const amountOf = (invoice: InvoiceRow) => Number(invoice.total_amount ?? 0);
const dateOf = (invoice: InvoiceRow) => invoice.issued_at ?? invoice.created_at;
const formatDate = (value: string | null) =>
  value ? new Date(value.length === 10 ? `${value}T00:00:00` : value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

/** Supplier invoices: amounts, buyer and PO from the order, revenue in the supplier's currency. */
export default function SupplierInvoicesPage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [range, setRange] = useState<(typeof DATE_RANGES)[number]["value"]>("all");
  // Earliest invoice date shown (0 = all), worked out when the date filter changes.
  const [rangeFrom, setRangeFrom] = useState(0);

  function chooseRange(value: (typeof DATE_RANGES)[number]["value"]) {
    const now = Date.now();
    setRange(value);
    setRangeFrom(value === "30" ? now - 30 * 86_400_000 : value === "90" ? now - 90 * 86_400_000 : value === "year" ? new Date(new Date().getFullYear(), 0, 1).getTime() : 0);
  }
  const money = useDisplayCurrency();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) { setInvoices([]); setLoading(false); }
        return;
      }
      const { data, error } = await supabase
        .from("supplier_invoices")
        .select("id, invoice_number, order_id, currency, total_amount, status, issued_at, due_date, paid_at, created_at, order:orders(po_number, buyer_company_name)")
        .eq("supplier_id", user.id)
        .order("created_at", { ascending: false });
      if (error) console.error("GET SUPPLIER INVOICES ERROR:", error);
      if (active) {
        setInvoices((data ?? []) as unknown as InvoiceRow[]);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      if (status !== "All" && invoice.status !== status) return false;
      if (rangeFrom && new Date(dateOf(invoice)).getTime() < rangeFrom) return false;
      if (!query) return true;
      return [invoice.invoice_number, invoice.order?.po_number, invoice.order?.buyer_company_name].some((value) => value?.toLowerCase().includes(query));
    });
  }, [invoices, search, status, rangeFrom]);

  // Totals in the supplier's currency (KES in Kenya, USD elsewhere), converting each invoice.
  const total = (rows: InvoiceRow[]) => (money.ready ? rows.reduce((sum, invoice) => sum + (money.convert(amountOf(invoice), invoice.currency) ?? 0), 0) : null);
  const paid = invoices.filter((invoice) => invoice.status === "Paid");
  const outstanding = invoices.filter((invoice) => !["Paid", "Cancelled", "Draft"].includes(invoice.status));
  const revenue = total(paid);
  const outstandingValue = total(outstanding);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-aviation-primary">Invoices</h1>
        <p className={`mt-2 ${muted}`}>Invoices you have sent to buyers and their payment status.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total invoices" value={invoices.length.toLocaleString()} />
        <Stat label="Paid" value={paid.length.toLocaleString()} tone="text-aviation-success" />
        <Stat
          label="Outstanding"
          value={outstanding.length.toLocaleString()}
          tone="text-amber-600"
          note={outstanding.length ? (outstandingValue == null ? "…" : `${formatMoney(outstandingValue, money.currency)} to collect`) : "Nothing to collect"}
        />
        <Stat label="Revenue" value={revenue == null ? "…" : formatMoney(revenue, money.currency)} note={`Paid invoices, in ${money.currency}`} />
      </div>

      <div className="compact-form flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="relative w-full sm:max-w-md">
          <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${muted}`} size={14} aria-hidden="true" />
          <label htmlFor="invoice-search" className="sr-only">Search invoices</label>
          <input id="invoice-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoice number, PO number or customer…" className={`${fieldInput} pl-8`} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <label htmlFor="invoice-status" className="sr-only">Status</label>
          <select id="invoice-status" value={status} onChange={(event) => setStatus(event.target.value)} className={`${fieldSelect} sm:w-40`}>
            <option value="All">All statuses</option>
            {STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <label htmlFor="invoice-range" className="sr-only">Date</label>
          <select id="invoice-range" value={range} onChange={(event) => chooseRange(event.target.value as typeof range)} className={`${fieldSelect} sm:w-40`}>
            {DATE_RANGES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {loading ? (
          <div className="skeleton h-40" aria-busy="true" />
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className={`mx-auto ${muted}`} size={36} aria-hidden="true" />
            <h2 className="mt-3 text-lg font-bold text-aviation-dark">{invoices.length ? "No invoices match your filters" : "No invoices yet"}</h2>
            <p className={`mt-1 text-sm ${muted}`}>{invoices.length ? "Change the search or filters above." : "Invoices you create from an order will appear here."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className={`border-b border-aviation-border bg-aviation-light/60 text-xs uppercase tracking-wide ${muted}`}>
                <tr>
                  <th className="px-5 py-3 font-semibold">Invoice #</th>
                  <th className="px-4 py-3 font-semibold">PO number</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Invoice date</th>
                  <th className="px-4 py-3 font-semibold">Due date</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aviation-border">
                {filtered.map((invoice) => {
                  const currency = (invoice.currency || "USD").toUpperCase();
                  const converted = currency !== money.currency ? money.format(amountOf(invoice), currency) : null;
                  return (
                    <tr key={invoice.id} className="hover:bg-aviation-light/40">
                      <td className="px-5 py-3.5 font-mono font-semibold text-aviation-dark">{invoice.invoice_number}</td>
                      <td className="px-4 py-3.5 font-mono">{invoice.order?.po_number || "—"}</td>
                      <td className="px-4 py-3.5">{invoice.order?.buyer_company_name || "—"}</td>
                      <td className="px-4 py-3.5">{formatDate(dateOf(invoice))}</td>
                      <td className="px-4 py-3.5">{formatDate(invoice.due_date)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-mono font-semibold text-aviation-dark">{formatMoney(amountOf(invoice), currency)}</span>
                        {converted && <span className={`block text-xs ${muted}`}>≈ {converted}</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[invoice.status] ?? statusStyle.Draft}`}>{invoice.status}</span>
                        {invoice.status === "Paid" && invoice.paid_at && <span className={`block text-xs ${muted}`}>{formatDate(invoice.paid_at)}</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <IconLink href={`/supplier/invoices/${invoice.id}`} label={`View ${invoice.invoice_number}`}><Eye size={15} /></IconLink>
                          <IconLink href={`/supplier/invoices/${invoice.id}?print=1`} label={`Print ${invoice.invoice_number}`}><Printer size={15} /></IconLink>
                          <IconLink href={`/supplier/invoices/${invoice.id}?print=1`} label={`Download ${invoice.invoice_number} as PDF`}><Download size={15} /></IconLink>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, note, tone = "text-aviation-dark" }: { label: string; value: string; note?: string; tone?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className={`text-sm ${muted}`}>{label}</p>
      <p className={`mt-1.5 font-mono text-2xl font-bold sm:text-3xl ${tone}`}>{value}</p>
      {note && <p className={`mt-1 text-xs ${muted}`}>{note}</p>}
    </div>
  );
}

function IconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} title={label} className="grid h-9 w-9 place-items-center rounded-lg border border-aviation-border text-aviation-dark hover:border-aviation-primary hover:text-aviation-primary">
      {children}
    </Link>
  );
}
