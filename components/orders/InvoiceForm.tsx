"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { formatOrderAmount, getSavedPaymentDetails, issueInvoice, type Order } from "@/lib/orders";

const field = "min-h-11 w-full rounded-xl border border-aviation-border bg-white px-4 py-2.5 text-sm focus:border-aviation-primary focus:outline-none";
const label = "mb-1.5 block text-sm font-semibold text-aviation-dark";

// Today's date as the database sees it (UTC): the invoice is payable on receipt.
function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The supplier's invoice. Everything billed comes from the buyer's purchase order;
 * the supplier only adds how to be paid (bank details or other payment instructions).
 */
export default function InvoiceForm({ order, onIssued }: { order: Order; onIssued: (invoiceNumber: string) => void }) {
  const [payment, setPayment] = useState({
    bank_name: "",
    bank_account_name: "",
    bank_account_number: "",
    bank_branch: "",
    bank_swift: "",
    payment_instructions: "",
  });
  const [saveDefaults, setSaveDefaults] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reuse the payment details from the supplier's last invoice.
  useEffect(() => {
    let active = true;
    getSavedPaymentDetails().then((saved) => {
      if (!active || !saved) return;
      setPayment((current) => ({
        bank_name: saved.bank_name || current.bank_name,
        bank_account_name: saved.bank_account_name || current.bank_account_name,
        bank_account_number: saved.bank_account_number || current.bank_account_number,
        bank_branch: saved.bank_branch || current.bank_branch,
        bank_swift: saved.bank_swift || current.bank_swift,
        payment_instructions: saved.payment_instructions || current.payment_instructions,
      }));
    });
    return () => { active = false; };
  }, []);

  const set = (key: keyof typeof payment) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setPayment((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!payment.bank_account_number.trim() && !payment.payment_instructions.trim()) {
      return setError("Add your bank account details or payment instructions so the buyer can pay.");
    }
    setSaving(true);
    // Billing matches the purchase order exactly: no tax or terms added here.
    const result = await issueInvoice(order.id, { ...payment, payment_terms: null, taxRate: 0, dueDate: today(), notes: "", saveDefaults });
    setSaving(false);
    if (!result.success || !result.data) return setError(result.error ?? "The invoice could not be created.");
    onIssued(result.data);
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="rounded-xl bg-aviation-light p-4 text-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-aviation-muted">Invoice details from {order.po_number ?? "the purchase order"}</p>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-aviation-dark">
            {order.quantity.toLocaleString()} × <span className="font-mono font-semibold">{order.part?.part_number ?? "Aviation part"}</span> at {formatOrderAmount(Number(order.unit_price), order.currency)}
          </p>
          <p className="text-base font-bold text-aviation-primary">Total {formatOrderAmount(Number(order.total_amount), order.currency)}</p>
        </div>
        <p className="mt-2 text-xs text-aviation-muted">Billed to {order.buyer_company_name ?? "the buyer"} · ship to {[order.ship_to_city, order.ship_to_country].filter(Boolean).join(", ") || "as on the purchase order"} · {order.shipping_method ?? "shipping as agreed"}. These details come from the purchase order and can&apos;t be changed here.</p>
      </div>

      <fieldset className="space-y-4">
        <legend className="text-sm font-bold uppercase tracking-wider text-aviation-muted">Your payment details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="inv-bank" className={label}>Bank name</label><input id="inv-bank" value={payment.bank_name} onChange={set("bank_name")} placeholder="e.g. NCBA Bank Kenya" className={field} /></div>
          <div><label htmlFor="inv-branch" className={label}>Branch</label><input id="inv-branch" value={payment.bank_branch} onChange={set("bank_branch")} className={field} /></div>
          <div><label htmlFor="inv-acname" className={label}>Account name</label><input id="inv-acname" value={payment.bank_account_name} onChange={set("bank_account_name")} className={field} /></div>
          <div><label htmlFor="inv-acno" className={label}>Account number</label><input id="inv-acno" value={payment.bank_account_number} onChange={set("bank_account_number")} className={field} /></div>
          <div><label htmlFor="inv-swift" className={label}>SWIFT / BIC</label><input id="inv-swift" value={payment.bank_swift} onChange={set("bank_swift")} placeholder="For international transfers" className={field} /></div>
        </div>
        <div><label htmlFor="inv-instr" className={label}>Other payment instructions</label><textarea id="inv-instr" rows={2} value={payment.payment_instructions} onChange={set("payment_instructions")} placeholder="e.g. M-Pesa Paybill 123456, account = invoice number" className={field} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={saveDefaults} onChange={(event) => setSaveDefaults(event.target.checked)} className="h-4 w-4 accent-[var(--aviation-primary)]" /> Save these payment details for my next invoice</label>
      </fieldset>

      {error && <p role="alert" className="rounded-xl bg-aviation-error-soft p-3 text-sm text-aviation-error">{error}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-aviation-primary px-6 py-3 text-sm font-bold text-white disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          {saving ? "Creating…" : "Send invoice to buyer"}
        </button>
      </div>
    </form>
  );
}
