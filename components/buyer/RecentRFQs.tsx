"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/rfqs";

interface RecentRFQ {
  id: string;
  part_id: string | null;
  quantity: number;
  message: string | null;
  status: string | null;
  created_at: string | null;

  part_number: string;
  description: string | null;
}

export default function RecentRFQs() {
  const [rfqs, setRfqs] = useState<RecentRFQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadRecentRFQs() {
      try {
        setLoading(true);

        /* =====================================================
           GET CURRENT USER
        ===================================================== */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error(
            "Unable to get current user:",
            userError
          );

          if (mounted) {
            setRfqs([]);
          }

          return;
        }

        /* =====================================================
           GET BUYER'S RECENT RFQs

           IMPORTANT:
           rfqs does NOT contain part_number or description.
           Those come from the parts table through part_id.
        ===================================================== */

        const {
          data: rfqData,
          error: rfqError,
        } = await supabase
          .from("rfqs")
          .select(`
            id,
            part_id,
            quantity,
            message,
            status,
            created_at
          `)
          .eq("buyer_id", user.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(5);

        if (rfqError) {
          console.error(
            "Unable to load recent RFQs:",
            rfqError.message,
            rfqError.details,
            rfqError.hint
          );

          if (mounted) {
            setRfqs([]);
          }

          return;
        }

        if (!rfqData || rfqData.length === 0) {
          if (mounted) {
            setRfqs([]);
          }

          return;
        }

        /* =====================================================
           GET PART IDs
        ===================================================== */

        const partIds = rfqData
          .map((rfq) => rfq.part_id)
          .filter(
            (id): id is string => Boolean(id)
          );

        /* =====================================================
           GET PART DETAILS
        ===================================================== */

        let partsData: {
          id: string;
          part_number: string | null;
          description: string | null;
        }[] = [];

        if (partIds.length > 0) {
          const {
            data,
            error: partsError,
          } = await supabase
            .from("parts")
            .select(`
              id,
              part_number,
              description
            `)
            .in("id", partIds);

          if (partsError) {
            console.error(
              "Unable to load RFQ part details:",
              partsError.message,
              partsError.details,
              partsError.hint
            );
          } else {
            partsData = data ?? [];
          }
        }

        /* =====================================================
           CREATE PART LOOKUP
        ===================================================== */

        const partsMap = new Map(
          partsData.map((part) => [
            part.id,
            part,
          ])
        );

        /* =====================================================
           COMBINE RFQs WITH PART DETAILS
        ===================================================== */

        const results: RecentRFQ[] =
          rfqData.map((rfq) => {
            const part = rfq.part_id
              ? partsMap.get(rfq.part_id)
              : undefined;

            return {
              id: rfq.id,

              part_id: rfq.part_id,

              quantity: rfq.quantity,

              message: rfq.message,

              status:
                rfq.status || "Pending",

              created_at:
                rfq.created_at,

              part_number:
                part?.part_number ||
                "RFQ Request",

              description:
                part?.description ||
                rfq.message ||
                null,
            };
          });

        if (mounted) {
          setRfqs(results);
        }
      } catch (error) {
        console.error(
          "Recent RFQs error:",
          error
        );

        if (mounted) {
          setRfqs([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadRecentRFQs();

    return () => {
      mounted = false;
    };
  }, []);

  /* ==========================================================
     STATUS BADGE
  ========================================================== */

  function getStatusClasses(
    status: string
  ) {
    switch (status) {
      case "Pending":
        return "bg-aviation-warning-soft text-aviation-warning";

      case "Quoted":
        return "bg-aviation-success-soft text-aviation-success";

      case "Accepted":
        return "bg-aviation-success-soft text-aviation-success";

      case "Rejected":
        return "bg-aviation-error-soft text-aviation-error";

      case "Cancelled":
        return "bg-aviation-light text-aviation-dark";

      case "Closed":
        return "bg-aviation-light text-aviation-dark";

      default:
        return "bg-aviation-light text-aviation-dark";
    }
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-xl font-bold text-aviation-primary">
            Recent RFQs
          </h2>

          <p className="mt-1 text-sm text-aviation-muted">
            Your latest requests for quotation.
          </p>
        </div>

        <Link
          href="/buyer/rfqs"
          className="text-sm font-semibold text-aviation-primary hover:underline"
        >
          View All
        </Link>

      </div>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (
        <div className="mt-6 space-y-3">

          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-xl bg-aviation-light p-4"
            >
              <div className="h-4 w-1/3 rounded bg-aviation-light" />

              <div className="mt-3 h-3 w-2/3 rounded bg-aviation-light" />

              <div className="mt-3 h-3 w-1/4 rounded bg-aviation-light" />
            </div>
          ))}

        </div>
      )}

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {!loading && rfqs.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-aviation-border p-10 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-aviation-success-soft">
            <FileText
              size={22}
              className="text-aviation-primary"
            />
          </div>

          <h3 className="mt-4 font-semibold text-aviation-dark">
            No RFQs Yet
          </h3>

          <p className="mt-2 text-sm text-aviation-muted">
            Your recent requests for quotation will appear here.
          </p>

          <Link
            href="/buyer/rfqs/new"
            className="mt-5 inline-flex rounded-lg bg-aviation-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-aviation-primary"
          >
            Create RFQ
          </Link>

        </div>
      )}

      {/* =====================================================
          RFQ LIST
      ===================================================== */}

      {!loading && rfqs.length > 0 && (
        <div className="mt-6 divide-y divide-gray-100">

          {rfqs.map((rfq) => (
            <Link
              key={rfq.id}
              href={`/buyer/rfqs/${rfq.id}`}
              className="block py-4 transition hover:bg-aviation-light"
            >

              <div className="flex items-start justify-between gap-4">

                {/* RFQ INFORMATION */}

                <div className="min-w-0">

                  <div className="flex items-center gap-2">

                    <h3 className="truncate font-semibold text-aviation-dark">
                      {rfq.part_number}
                    </h3>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                        rfq.status || "Pending"
                      )}`}
                    >
                      {rfq.status || "Pending"}
                    </span>

                  </div>

                  {rfq.description && (
                    <p className="mt-1 truncate text-sm text-aviation-muted">
                      {rfq.description}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-aviation-muted">

                    <span>
                      Qty: {rfq.quantity}
                    </span>

                    {rfq.created_at && (
                      <span>
                        {formatDate(
                          rfq.created_at
                        )}
                      </span>
                    )}

                  </div>

                </div>

                {/* ARROW */}

                <span className="shrink-0 text-aviation-muted">
                  →
                </span>

              </div>

            </Link>
          ))}

        </div>
      )}

    </section>
  );
}