"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { formatOrderAmount, getSavedPaymentDetails, issueInvoice, type Order } from "@/lib/orders";
import { FormFooter, FormNotice, FormRow, FormSection, btnPrimary, fieldCheckbox, fieldInput, fieldTextarea } from "@/components/ui/form";

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
    <form onSubmit={submit} noValidate className="compact-form space-y-4">
      <div className="rounded-md bg-aviation-light px-3 py-2.5 text-[13px]">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--aviation-muted)]">Invoice details from {order.po_number ?? "the purchase order"}</p>
        <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-aviation-dark">
            {order.quantity.toLocaleString()} × <span className="font-mono font-semibold">{order.part?.part_number ?? "Aviation part"}</span> at {formatOrderAmount(Number(order.unit_price), order.currency)}
          </p>
          <p className="text-sm font-bold text-aviation-primary">Total {formatOrderAmount(Number(order.total_amount), order.currency)}</p>
        </div>
        <p className="mt-1.5 text-xs text-[var(--aviation-muted)]">Billed to {order.buyer_company_name ?? "the buyer"} · ship to {[order.ship_to_city, order.ship_to_country].filter(Boolean).join(", ") || "as on the purchase order"} · {order.shipping_method ?? "shipping as agreed"}. These details come from the purchase order and can&apos;t be changed here.</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-3 w-full"><FormSection title="Your payment details" /></legend>
        <FormRow label="Bank name" htmlFor="inv-bank"><input id="inv-bank" value={payment.bank_name} onChange={set("bank_name")} placeholder="e.g. NCBA Bank Kenya" className={fieldInput} /></FormRow>
        <FormRow label="Branch" htmlFor="inv-branch"><input id="inv-branch" value={payment.bank_branch} onChange={set("bank_branch")} className={fieldInput} /></FormRow>
        <FormRow label="Account name" htmlFor="inv-acname"><input id="inv-acname" value={payment.bank_account_name} onChange={set("bank_account_name")} className={fieldInput} /></FormRow>
        <FormRow label="Account number" htmlFor="inv-acno"><input id="inv-acno" value={payment.bank_account_number} onChange={set("bank_account_number")} className={fieldInput} /></FormRow>
        <FormRow label="SWIFT / BIC" htmlFor="inv-swift"><input id="inv-swift" value={payment.bank_swift} onChange={set("bank_swift")} placeholder="For international transfers" className={fieldInput} /></FormRow>
        <FormRow label="Other payment instructions" htmlFor="inv-instr"><textarea id="inv-instr" rows={2} value={payment.payment_instructions} onChange={set("payment_instructions")} placeholder="e.g. M-Pesa Paybill 123456, account = invoice number" className={fieldTextarea} /></FormRow>
        <div className="sm:pl-[180px]">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-aviation-dark"><input type="checkbox" checked={saveDefaults} onChange={(event) => setSaveDefaults(event.target.checked)} className={fieldCheckbox} /> Save these payment details for my next invoice</label>
        </div>
      </fieldset>

      {error && <FormNotice tone="error">{error}</FormNotice>}
      <FormFooter>
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          {saving ? "Creating…" : "Send invoice to buyer"}
        </button>
      </FormFooter>
    </form>
  );
}
