"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Building2,
  MapPin,
  CalendarDays,
  FileText,
  MessageSquare,
  Clock,
  Hash,
} from "lucide-react";

import {
  getBuyerOrder,
  formatOrderDate,
  formatOrderAmount,
  type Order,
} from "@/lib/orders";

interface OrderDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

/* ==========================================================
   STATUS STYLES
========================================================== */

function getStatusClasses(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-aviation-warning-soft text-aviation-warning border-aviation-border";

    case "processing":
      return "bg-aviation-success-soft text-aviation-success border-aviation-border";

    case "shipped":
      return "bg-aviation-light text-aviation-primary border-aviation-border";

    case "completed":
      return "bg-aviation-success-soft text-aviation-success border-aviation-border";

    case "cancelled":
      return "bg-aviation-error-soft text-aviation-error border-aviation-border";

    default:
      return "bg-aviation-light text-aviation-dark border-aviation-border";
  }
}

/* ==========================================================
   PAGE
========================================================== */

export default function OrderDetailsPage({
  params,
}: OrderDetailsPageProps) {
  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* ========================================================
     LOAD ORDER
  ======================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadOrder() {
      try {
        setLoading(true);
        setError(null);

        const resolvedParams =
          await params;

        const id =
          resolvedParams.id;

        if (!id) {
          if (mounted) {
            setOrder(null);
            setError("Invalid order ID.");
          }

          return;
        }

        const data =
          await getBuyerOrder(id);

        if (!mounted) return;

        if (!data) {
          setOrder(null);
          setError(
            "We could not find this order or you may not have permission to view it."
          );
          return;
        }

        setOrder(data);
      } catch (error) {
        console.error(
          "GET ORDER DETAILS ERROR:",
          error
        );

        if (mounted) {
          setOrder(null);
          setError(
            "Unable to load this order. Please try again."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      mounted = false;
    };
  }, [params]);

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow">

        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-aviation-border border-t-[#6B9B7A]" />

        <p className="mt-4 text-aviation-muted">
          Loading order...
        </p>

      </div>
    );
  }

  /* ========================================================
     NOT FOUND / ERROR
  ======================================================== */

  if (!order) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-aviation-error-soft">
          <Package
            size={30}
            className="text-aviation-error"
          />
        </div>

        <h1 className="mt-5 text-xl font-bold text-aviation-dark">
          Order Not Found
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-aviation-muted">
          {error ??
            "We could not find this order."}
        </p>

        <Link
          href="/buyer/orders"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white transition hover:bg-aviation-primary"
        >
          <ArrowLeft size={17} />
          Back to Orders
        </Link>

      </div>
    );
  }

  /* ========================================================
     DISPLAY VALUES
  ======================================================== */

  const orderNumber =
    order.id
      .slice(0, 8)
      .toUpperCase();

  const quoteNumber =
    order.quote_id
      ?.slice(0, 8)
      .toUpperCase();

  const rfqNumber =
    order.rfq_id
      ?.slice(0, 8)
      .toUpperCase();

  const partNumber =
    order.part?.part_number ??
    "Aviation Part";

  const supplierName =
    order.supplier?.company_name ??
    "Supplier";

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="space-y-6">

      {/* ====================================================
          BACK
      ==================================================== */}

      <Link
        href="/buyer/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-aviation-primary hover:underline"
      >
        <ArrowLeft size={17} />
        Back to Orders
      </Link>

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="rounded-2xl bg-white p-6 shadow">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="flex items-center gap-2 text-sm text-aviation-muted">
              <Package size={16} />
              <span>Order</span>
            </div>

            <h1 className="mt-2 text-2xl font-bold text-aviation-dark">
              #{orderNumber}
            </h1>

            <p className="mt-2 text-sm text-aviation-muted">
              Created{" "}
              {formatOrderDate(
                order.created_at
              )}
            </p>

          </div>

          <span
            className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-semibold ${getStatusClasses(
              order.status
            )}`}
          >
            {order.status}
          </span>

        </div>

      </div>

      {/* ====================================================
          ORDER SUMMARY
      ==================================================== */}

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ==================================================
            PART
        ================================================== */}

        <div className="rounded-2xl bg-white p-6 shadow">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-aviation-success-soft">
              <Package
                size={22}
                className="text-aviation-primary"
              />
            </div>

            <div>

              <p className="text-sm text-aviation-muted">
                Part
              </p>

              <h2 className="font-bold text-aviation-dark">
                {partNumber}
              </h2>

            </div>

          </div>

          {order.part?.description && (
            <p className="mt-5 text-sm leading-6 text-aviation-muted">
              {order.part.description}
            </p>
          )}

          {order.part?.manufacturer && (
            <div className="mt-5">

              <p className="text-xs font-medium uppercase tracking-wide text-aviation-muted">
                Manufacturer
              </p>

              <p className="mt-1 font-medium text-aviation-dark">
                {order.part.manufacturer}
              </p>

            </div>
          )}

          {!order.part && (
            <p className="mt-5 text-sm text-aviation-muted">
              Part information is not available for
              this order.
            </p>
          )}

        </div>

        {/* ==================================================
            SUPPLIER
        ================================================== */}

        <div className="rounded-2xl bg-white p-6 shadow">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-aviation-success-soft">
              <Building2
                size={22}
                className="text-aviation-primary"
              />
            </div>

            <div>

              <p className="text-sm text-aviation-muted">
                Supplier
              </p>

              <h2 className="font-bold text-aviation-dark">
                {supplierName}
              </h2>

            </div>

          </div>

          <p className="mt-5 text-sm leading-6 text-aviation-muted">
            This order was created after you
            accepted the supplier's quotation.
          </p>

        </div>

        {/* ==================================================
            TOTAL
        ================================================== */}

        <div className="rounded-2xl bg-aviation-primary p-6 text-white shadow">

          <p className="text-sm text-aviation-light">
            Order Total
          </p>

          <p className="mt-2 text-3xl font-bold">
            {formatOrderAmount(
              order.total_amount,
              order.currency
            )}
          </p>

          <div className="mt-5 border-t border-white/20 pt-4">

            <div className="flex items-center justify-between">

              <span className="text-sm text-aviation-light">
                Unit Price
              </span>

              <span className="font-semibold">
                {formatOrderAmount(
                  order.unit_price,
                  order.currency
                )}
              </span>

            </div>

            <div className="mt-2 flex items-center justify-between">

              <span className="text-sm text-aviation-light">
                Quantity
              </span>

              <span className="font-semibold">
                {order.quantity.toLocaleString()}
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* ====================================================
          DELIVERY + ORDER INFORMATION
      ==================================================== */}

      <div className="grid gap-6 lg:grid-cols-2">

        {/* ==================================================
            DELIVERY
        ================================================== */}

        <div className="rounded-2xl bg-white p-6 shadow">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aviation-success-soft">
              <MapPin
                size={20}
                className="text-aviation-primary"
              />
            </div>

            <h2 className="text-lg font-bold text-aviation-dark">
              Delivery Information
            </h2>

          </div>

          <div className="mt-6 space-y-5">

            <div>

              <p className="text-xs font-medium uppercase tracking-wide text-aviation-muted">
                Delivery Location
              </p>

              <p className="mt-1 font-medium text-aviation-dark">
                {order.delivery_location ??
                  "Not specified"}
              </p>

            </div>

            <div>

              <div className="flex items-center gap-2">

                <CalendarDays
                  size={16}
                  className="text-aviation-muted"
                />

                <p className="text-xs font-medium uppercase tracking-wide text-aviation-muted">
                  Required Date
                </p>

              </div>

              <p className="mt-1 font-medium text-aviation-dark">
                {formatOrderDate(
                  order.required_date
                )}
              </p>

            </div>

          </div>

        </div>

        {/* ==================================================
            ORDER INFORMATION
        ================================================== */}

        <div className="rounded-2xl bg-white p-6 shadow">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aviation-success-soft">
              <FileText
                size={20}
                className="text-aviation-primary"
              />
            </div>

            <h2 className="text-lg font-bold text-aviation-dark">
              Order Information
            </h2>

          </div>

          <div className="mt-6 space-y-4">

            {/* ORDER ID */}

            <div className="flex items-center justify-between gap-4">

              <div className="flex items-center gap-2">
                <Hash
                  size={15}
                  className="text-aviation-muted"
                />

                <span className="text-sm text-aviation-muted">
                  Order ID
                </span>
              </div>

              <span className="max-w-[220px] truncate text-sm font-medium text-aviation-dark">
                {order.id}
              </span>

            </div>

            {/* QUOTE */}

            <div className="flex items-center justify-between gap-4">

              <div className="flex items-center gap-2">
                <FileText
                  size={15}
                  className="text-aviation-muted"
                />

                <span className="text-sm text-aviation-muted">
                  Quote
                </span>
              </div>

              <span className="text-sm font-medium text-aviation-dark">
                #{quoteNumber}
              </span>

            </div>

            {/* RFQ */}

            <div className="flex items-center justify-between gap-4">

              <div className="flex items-center gap-2">
                <FileText
                  size={15}
                  className="text-aviation-muted"
                />

                <span className="text-sm text-aviation-muted">
                  RFQ
                </span>
              </div>

              <Link
                href={`/buyer/rfqs/${order.rfq_id}`}
                className="text-sm font-semibold text-aviation-primary hover:underline"
              >
                #{rfqNumber}
              </Link>

            </div>

            {/* ORDER DATE */}

            <div className="flex items-center justify-between gap-4">

              <div className="flex items-center gap-2">
                <CalendarDays
                  size={15}
                  className="text-aviation-muted"
                />

                <span className="text-sm text-aviation-muted">
                  Order Date
                </span>
              </div>

              <span className="text-sm font-medium text-aviation-dark">
                {formatOrderDate(
                  order.created_at
                )}
              </span>

            </div>

            {/* LAST UPDATED */}

            <div className="flex items-center justify-between gap-4">

              <div className="flex items-center gap-2">
                <Clock
                  size={15}
                  className="text-aviation-muted"
                />

                <span className="text-sm text-aviation-muted">
                  Last Updated
                </span>
              </div>

              <span className="text-sm font-medium text-aviation-dark">
                {formatOrderDate(
                  order.updated_at
                )}
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* ====================================================
          MESSAGES
      ==================================================== */}

      {(order.supplier_message ||
        order.buyer_message) && (
        <div className="rounded-2xl bg-white p-6 shadow">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aviation-success-soft">
              <MessageSquare
                size={20}
                className="text-aviation-primary"
              />
            </div>

            <h2 className="text-lg font-bold text-aviation-dark">
              Order Messages
            </h2>

          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            {/* SUPPLIER MESSAGE */}

            {order.supplier_message && (
              <div className="rounded-xl border bg-aviation-light p-5">

                <p className="text-sm font-semibold text-aviation-dark">
                  Supplier Message
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-aviation-muted">
                  {order.supplier_message}
                </p>

              </div>
            )}

            {/* BUYER MESSAGE */}

            {order.buyer_message && (
              <div className="rounded-xl border bg-aviation-light p-5">

                <p className="text-sm font-semibold text-aviation-dark">
                  Your Message
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-aviation-muted">
                  {order.buyer_message}
                </p>

              </div>
            )}

          </div>

        </div>
      )}

      {/* ====================================================
          ORDER TIMELINE
      ==================================================== */}

      <div className="rounded-2xl bg-white p-6 shadow">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aviation-success-soft">
            <Clock
              size={20}
              className="text-aviation-primary"
            />
          </div>

          <div>

            <h2 className="text-lg font-bold text-aviation-dark">
              Order Status
            </h2>

            <p className="text-sm text-aviation-muted">
              Current status of your order.
            </p>

          </div>

        </div>

        <div className="mt-6">

          <div className="flex items-center gap-4">

            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full border ${getStatusClasses(
                order.status
              )}`}
            >
              <Package size={20} />
            </div>

            <div>

              <p className="font-semibold text-aviation-dark">
                {order.status}
              </p>

              <p className="mt-1 text-sm text-aviation-muted">
                Last updated{" "}
                {formatOrderDate(
                  order.updated_at
                )}
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}