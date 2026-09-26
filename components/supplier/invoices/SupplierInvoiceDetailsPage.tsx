"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
    ArrowLeft,
    Printer,
    Download,
    Mail,
} from "lucide-react";

interface Props{
    invoiceId:string;
}

export default function SupplierInvoiceDetailsPage({
    invoiceId,
}:Props){

const [loading,setLoading]=useState(true);

const [invoice,setInvoice]=useState<any>(null);

useEffect(()=>{

loadInvoice();

},[]);

async function loadInvoice(){

// Load from Supabase later

setInvoice(null);

setLoading(false);

}

if(loading){

return(

<div className="rounded-xl bg-white p-10">

Loading Invoice...

</div>

);

}

return(

<div className="space-y-8">
      {/* =======================================
          Header
      ======================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <Link
            href="/supplier/invoices"
            className="mb-4 inline-flex items-center gap-2 text-aviation-primary hover:underline"
          >

            <ArrowLeft size={18}/>

            Back to Invoices

          </Link>

          <h1 className="text-3xl font-bold text-aviation-primary">

            Invoice

          </h1>

          <p className="mt-2 text-aviation-muted">

            {invoice?.invoice_number ?? "INV-000001"}

          </p>

        </div>

        <div className="flex gap-3">

          <button
            className="flex items-center gap-2 rounded-xl border px-5 py-3 hover:bg-aviation-light"
          >
            <Printer size={18}/>
            Print
          </button>

          <button
            className="flex items-center gap-2 rounded-xl border px-5 py-3 hover:bg-aviation-light"
          >
            <Download size={18}/>
            PDF
          </button>

          <button
            className="flex items-center gap-2 rounded-xl bg-aviation-primary px-5 py-3 text-white hover:bg-aviation-primary"
          >
            <Mail size={18}/>
            Email Invoice
          </button>

        </div>

      </div>
      {/* =======================================
          Supplier & Customer
      ======================================== */}

      <section className="grid gap-6 lg:grid-cols-2">

        <div className="rounded-2xl bg-white p-8 shadow">

          <h2 className="mb-6 text-xl font-bold text-aviation-primary">

            Supplier

          </h2>

          <div className="space-y-2">

            <p className="font-semibold">

              {invoice?.supplier_name ?? "Your Company"}

            </p>

            <p>{invoice?.supplier_address}</p>

            <p>{invoice?.supplier_email}</p>

            <p>{invoice?.supplier_phone}</p>

          </div>

        </div>

        <div className="rounded-2xl bg-white p-8 shadow">

          <h2 className="mb-6 text-xl font-bold text-aviation-primary">

            Bill To

          </h2>

          <div className="space-y-2">

            <p className="font-semibold">

              {invoice?.customer_name}

            </p>

            <p>{invoice?.customer_company}</p>

            <p>{invoice?.customer_address}</p>

            <p>{invoice?.customer_email}</p>

          </div>

        </div>

      </section>
      {/* =======================================
          Invoice Information
      ======================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-8 text-2xl font-bold text-aviation-primary">
          Invoice Information
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

          <div>

            <p className="text-sm text-aviation-muted">
              Invoice Number
            </p>

            <p className="mt-2 font-semibold">
              {invoice?.invoice_number ?? "INV-000001"}
            </p>

          </div>

          <div>

            <p className="text-sm text-aviation-muted">
              Purchase Order
            </p>

            <p className="mt-2 font-semibold">
              {invoice?.po_number ?? "-"}
            </p>

          </div>

          <div>

            <p className="text-sm text-aviation-muted">
              Invoice Date
            </p>

            <p className="mt-2">
              {invoice?.invoice_date ?? "-"}
            </p>

          </div>

          <div>

            <p className="text-sm text-aviation-muted">
              Due Date
            </p>

            <p className="mt-2">
              {invoice?.due_date ?? "-"}
            </p>

          </div>

        </div>

      </section>
      {/* =======================================
          Invoice Items
      ======================================== */}

      <section className="rounded-2xl bg-white shadow">

        <div className="border-b p-8">

          <h2 className="text-2xl font-bold text-aviation-primary">
            Invoice Items
          </h2>

        </div>

        <div className="overflow-x-auto">

          <div className="aviation-table-wrap"><table className="min-w-full">

            <thead className="bg-aviation-light">

              <tr className="text-left text-sm font-semibold text-aviation-muted">

                <th className="px-6 py-4">
                  Part Number
                </th>

                <th className="px-6 py-4">
                  Description
                </th>

                <th className="px-6 py-4">
                  Qty
                </th>

                <th className="px-6 py-4">
                  Unit Price
                </th>

                <th className="px-6 py-4">
                  Total
                </th>

              </tr>

            </thead>

            <tbody>

              {(invoice?.items ?? []).length === 0 ? (

                <tr>

                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-aviation-muted"
                  >

                    No invoice items.

                  </td>

                </tr>

              ) : (

                invoice.items.map((item:any)=>(

                  <tr
                    key={item.id}
                    className="border-t"
                  >

                    <td className="px-6 py-5 font-semibold">

                      {item.part_number}

                    </td>

                    <td className="px-6 py-5">

                      {item.description}

                    </td>

                    <td className="px-6 py-5">

                      {item.quantity}

                    </td>

                    <td className="px-6 py-5">

                      ${Number(item.unit_price).toFixed(2)}

                    </td>

                    <td className="px-6 py-5 font-semibold">

                      $
                      {(
                        Number(item.quantity) *
                        Number(item.unit_price)
                      ).toFixed(2)}

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table></div>

        </div>

      </section>
      {/* =======================================
          Invoice Totals
      ======================================== */}

      <section className="flex justify-end">

        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">

          <h2 className="mb-6 text-xl font-bold text-aviation-primary">
            Invoice Summary
          </h2>

          <div className="space-y-4">

            <div className="flex justify-between">

              <span>Subtotal</span>

              <span>
                ${invoice?.subtotal ?? "0.00"}
              </span>

            </div>

            <div className="flex justify-between">

              <span>Shipping</span>

              <span>
                ${invoice?.shipping ?? "0.00"}
              </span>

            </div>

            <div className="flex justify-between">

              <span>Tax</span>

              <span>
                ${invoice?.tax ?? "0.00"}
              </span>

            </div>

            <hr />

            <div className="flex justify-between text-2xl font-bold text-aviation-primary">

              <span>Total</span>

              <span>
                ${invoice?.total ?? "0.00"}
              </span>

            </div>

          </div>

        </div>

      </section>
      {/* =======================================
          Payment Information
      ======================================== */}

      <section className="grid gap-6 lg:grid-cols-2">

        {/* Payment Details */}

        <div className="rounded-2xl bg-white p-8 shadow">

          <h2 className="mb-6 text-2xl font-bold text-aviation-primary">
            Payment Information
          </h2>

          <div className="space-y-4">

            <div>

              <p className="text-sm text-aviation-muted">
                Payment Status
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-4 py-2 text-sm font-semibold
                  ${
                    invoice?.status === "Paid"
                      ? "bg-aviation-success-soft text-aviation-success"
                      : invoice?.status === "Pending"
                      ? "bg-aviation-warning-soft text-aviation-warning"
                      : invoice?.status === "Partially Paid"
                      ? "bg-aviation-success-soft text-aviation-success"
                      : "bg-aviation-error-soft text-aviation-error"
                  }`}
              >
                {invoice?.status ?? "Pending"}
              </span>

            </div>

            <div>

              <p className="text-sm text-aviation-muted">
                Payment Method
              </p>

              <p className="mt-2">
                {invoice?.payment_method ?? "Bank Transfer"}
              </p>

            </div>

            <div>

              <p className="text-sm text-aviation-muted">
                Transaction Reference
              </p>

              <p className="mt-2">
                {invoice?.transaction_reference ?? "-"}
              </p>

            </div>

            <div>

              <p className="text-sm text-aviation-muted">
                Payment Date
              </p>

              <p className="mt-2">
                {invoice?.payment_date ?? "-"}
              </p>

            </div>

          </div>

        </div>

        {/* Banking Details */}

        <div className="rounded-2xl bg-white p-8 shadow">

          <h2 className="mb-6 text-2xl font-bold text-aviation-primary">
            Bank Details
          </h2>

          <div className="space-y-4">

            <div>

              <p className="text-sm text-aviation-muted">
                Bank
              </p>

              <p className="font-semibold">
                {invoice?.bank_name ?? "Your Bank"}
              </p>

            </div>

            <div>

              <p className="text-sm text-aviation-muted">
                Account Name
              </p>

              <p>
                {invoice?.account_name ?? "Your Company"}
              </p>

            </div>

            <div>

              <p className="text-sm text-aviation-muted">
                Account Number
              </p>

              <p>
                {invoice?.account_number ?? "-"}
              </p>

            </div>

            <div>

              <p className="text-sm text-aviation-muted">
                SWIFT Code
              </p>

              <p>
                {invoice?.swift_code ?? "-"}
              </p>

            </div>

            <div>

              <p className="text-sm text-aviation-muted">
                IBAN
              </p>

              <p>
                {invoice?.iban ?? "-"}
              </p>

            </div>

          </div>

        </div>

      </section>
      {/* =======================================
          Notes & Terms
      ======================================== */}

      <section className="rounded-2xl bg-white p-8 shadow">

        <h2 className="mb-6 text-2xl font-bold text-aviation-primary">
          Notes & Terms
        </h2>

        <div className="space-y-6">

          <div>

            <h3 className="mb-2 font-semibold">
              Notes
            </h3>

            <p className="text-aviation-muted">

              {invoice?.notes ??
                "Thank you for your business. Please reference the invoice number when making payment."}

            </p>

          </div>

          <div>

            <h3 className="mb-2 font-semibold">
              Terms & Conditions
            </h3>

            <ul className="list-disc space-y-2 pl-5 text-aviation-muted">

              <li>
                Payment is due on or before the due date.
              </li>

              <li>
                Goods remain the property of the supplier until paid in full.
              </li>

              <li>
                Aviation parts are supplied subject to the agreed certification.
              </li>

              <li>
                Claims must be reported within the agreed inspection period.
              </li>

              <li>
                Export documentation will be provided where applicable.
              </li>

            </ul>

          </div>

        </div>

      </section>
    </div>

  );

}