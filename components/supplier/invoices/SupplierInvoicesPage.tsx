"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { supabase } from "@/lib/supabase";

import {
    Search,
    Eye,
    Printer,
    Download,
    FileText,
} from "lucide-react";

export default function SupplierInvoicesPage(){

const [loading,setLoading]=useState(true);

const [invoices,setInvoices]=useState<any[]>([]);

useEffect(()=>{

loadInvoices();

},[]);

async function loadInvoices(){

const { data: { user } } = await supabase.auth.getUser();
if (!user) { setInvoices([]); setLoading(false); return; }
const { data, error } = await supabase.from("supplier_invoices").select("*").eq("supplier_id", user.id).order("created_at", { ascending: false });
if (error) console.error("GET SUPPLIER INVOICES ERROR:", error);
setInvoices(data ?? []);
setLoading(false);

}

return(

<div className="space-y-8">

<div>

<h1 className="text-3xl font-bold text-aviation-primary">

Invoices

</h1>

<p className="mt-2 text-aviation-muted">

Manage customer invoices and payment records.

</p>

</div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl bg-white p-6 shadow">

          <p className="text-aviation-muted">
            Total Invoices
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {invoices.length}
          </h2>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow">

          <p className="text-aviation-muted">
            Paid
          </p>

          <h2 className="mt-2 text-3xl font-bold text-aviation-success">

            {
              invoices.filter(
                i=>i.status==="Paid"
              ).length
            }

          </h2>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow">

          <p className="text-aviation-muted">
            Outstanding
          </p>

          <h2 className="mt-2 text-3xl font-bold text-aviation-warning">

            {
              invoices.filter(
                i=>i.status==="Pending"
              ).length
            }

          </h2>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow">

          <p className="text-aviation-muted">
            Revenue
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            $0.00
          </h2>

        </div>

      </div>
      {/* =======================================
          Search & Filters
      ======================================== */}

      <section className="rounded-2xl bg-white p-6 shadow">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* Search */}

          <div className="relative w-full lg:max-w-md">

            <Search
              size={18}
              className="absolute left-3 top-3 text-aviation-muted"
            />

            <input
              type="text"
              placeholder="Search Invoice Number, PO Number or Customer..."
              className="w-full rounded-xl border py-3 pl-10 pr-4"
            />

          </div>

          {/* Filters */}

          <div className="flex flex-wrap gap-3">

            <select className="rounded-xl border px-4 py-3">

              <option>All Statuses</option>
              <option>Paid</option>
              <option>Pending</option>
              <option>Partially Paid</option>
              <option>Overdue</option>
              <option>Cancelled</option>

            </select>

            <select className="rounded-xl border px-4 py-3">

              <option>All Dates</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>

            </select>

          </div>

        </div>

      </section>
      {/* =======================================
          Invoice Table
      ======================================== */}

      <section className="overflow-hidden rounded-2xl bg-white shadow">

        <div className="overflow-x-auto">

          <div className="aviation-table-wrap"><table className="min-w-full">

            <thead className="bg-aviation-light">

              <tr className="text-left text-sm font-semibold text-aviation-muted">

                <th className="px-6 py-4">Invoice #</th>

                <th className="px-6 py-4">PO Number</th>

                <th className="px-6 py-4">Customer</th>

                <th className="px-6 py-4">Invoice Date</th>

                <th className="px-6 py-4">Due Date</th>

                <th className="px-6 py-4">Amount</th>

                <th className="px-6 py-4">Status</th>

                <th className="px-6 py-4 text-center">

                  Actions

                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center"
                  >

                    Loading invoices...

                  </td>

                </tr>

              ) : invoices.length === 0 ? (

                <tr>

                  <td
                    colSpan={8}
                    className="px-6 py-16 text-center"
                  >

                    <FileText
                      className="mx-auto mb-4 text-aviation-muted"
                      size={48}
                    />

                    <h3 className="text-lg font-semibold">

                      No invoices available

                    </h3>

                    <p className="mt-2 text-aviation-muted">

                      Invoices generated from Purchase Orders will appear here.

                    </p>

                  </td>

                </tr>

              ) : (

                invoices.map((invoice) => (

                  <tr
                    key={invoice.id}
                    className="border-t hover:bg-aviation-light"
                  >

                    <td className="px-6 py-5 font-semibold">

                      {invoice.invoice_number}

                    </td>

                    <td className="px-6 py-5">

                      {invoice.po_number}

                    </td>

                    <td className="px-6 py-5">

                      {invoice.customer_name}

                    </td>

                    <td className="px-6 py-5">

                      {invoice.invoice_date}

                    </td>

                    <td className="px-6 py-5">

                      {invoice.due_date}

                    </td>

                    <td className="px-6 py-5 font-semibold">

                      ${invoice.amount}

                    </td>
                    <td className="px-6 py-5">

                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold
                        ${
                          invoice.status === "Paid"
                            ? "bg-aviation-success-soft text-aviation-success"
                            : invoice.status === "Pending"
                            ? "bg-aviation-warning-soft text-aviation-warning"
                            : invoice.status === "Partially Paid"
                            ? "bg-aviation-success-soft text-aviation-success"
                            : invoice.status === "Overdue"
                            ? "bg-aviation-error-soft text-aviation-error"
                            : "bg-aviation-light text-aviation-dark"
                        }`}
                      >
                        {invoice.status}
                      </span>

                    </td>

                    <td className="px-6 py-5">

                      <div className="flex justify-center gap-2">

                        <Link
                          href={`/supplier/invoices/${invoice.id}`}
                          className="rounded-lg border p-2 hover:bg-aviation-light"
                          title="View Invoice"
                        >
                          <Eye size={18} />
                        </Link>

                        <button
                          className="rounded-lg border p-2 hover:bg-aviation-light"
                          title="Print Invoice"
                        >
                          <Printer size={18} />
                        </button>

                        <button
                          className="rounded-lg border p-2 hover:bg-aviation-light"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table></div>

        </div>

      </section>

    </div>

  );

}