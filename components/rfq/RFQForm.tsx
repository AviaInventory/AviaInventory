"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

interface RFQFormProps {
  partId: string;
  supplierId: string;
  partNumber: string;
}

export default function RFQForm({
  partId,
  supplierId,
  partNumber,
}: RFQFormProps) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [quantity, setQuantity] =
    useState(1);

  const [message, setMessage] =
    useState("");

  /* ==========================================================
     SUBMIT RFQ
  ========================================================== */

  async function submitRFQ() {
    if (loading) return;

    /* ========================================================
       BASIC VALIDATION
    ======================================================== */

    if (!quantity || quantity < 1) {
      alert(
        "Please enter a valid quantity."
      );
      return;
    }

    if (!partId) {
      alert(
        "Unable to identify the selected part."
      );
      return;
    }

    if (!supplierId) {
      alert(
        "Unable to identify the supplier for this part."
      );
      return;
    }

    try {
      setLoading(true);

      /* ======================================================
         GET AUTHENTICATED USER
      ====================================================== */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(
          "GET CURRENT USER ERROR:",
          userError
        );

        alert(
          `Unable to verify your account.\n\n${userError.message}`
        );

        return;
      }

      if (!user) {
        alert(
          "Please login before submitting an RFQ."
        );

        router.push("/login");

        return;
      }

      console.log(
        "AUTHENTICATED USER:",
        {
          id: user.id,
          email: user.email,
        }
      );

      /* ======================================================
         GET PROFILE
      ====================================================== */

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "id, account_type, full_name, company_name"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "PROFILE CHECK ERROR:",
          profileError
        );

        alert(
          `Unable to verify your account profile.\n\n${profileError.message}`
        );

        return;
      }

      /* ======================================================
         VERIFY ACCOUNT TYPE
      ====================================================== */

      const accountType =
        profile?.account_type ??
        user.user_metadata?.account_type ??
        null;

      const normalizedAccountType =
        typeof accountType === "string"
          ? accountType
              .trim()
              .toLowerCase()
          : null;

      console.log(
        "RFQ ACCOUNT TYPE:",
        normalizedAccountType
      );

      if (
        normalizedAccountType !==
        "buyer"
      ) {
        console.error(
          "RFQ SUBMISSION BLOCKED:",
          {
            userId: user.id,
            accountType:
              normalizedAccountType,
          }
        );

        if (
          normalizedAccountType ===
          "supplier"
        ) {
          alert(
            "Supplier accounts cannot submit RFQs. Please login with a buyer account."
          );
        } else if (
          normalizedAccountType ===
          "admin"
        ) {
          alert(
            "Admin accounts cannot submit RFQs."
          );
        } else {
          alert(
            "Your account is not registered as a buyer. Please contact support."
          );
        }

        return;
      }

      /* ======================================================
         VERIFY BUYER PROFILE
      ====================================================== */

      const {
        data: buyer,
        error: buyerError,
      } = await supabase
        .from("buyers")
        .select(
          "id, company_name, business_type"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (buyerError) {
        console.error(
          "BUYER CHECK ERROR:",
          {
            message:
              buyerError.message,
            details:
              buyerError.details,
            hint: buyerError.hint,
            code: buyerError.code,
          }
        );

        alert(
          `Unable to verify your buyer profile.\n\n${buyerError.message}`
        );

        return;
      }

      if (!buyer) {
        console.error(
          "BUYER PROFILE NOT FOUND:",
          {
            userId: user.id,
            email: user.email,
          }
        );

        alert(
          "Your buyer profile could not be found. Please contact support."
        );

        return;
      }

      console.log(
        "BUYER CONFIRMED:",
        buyer
      );

      /* ======================================================
         PREVENT BUYER FROM QUOTING THEIR OWN PART
      ====================================================== */

      if (
        supplierId === user.id
      ) {
        alert(
          "You cannot submit an RFQ to your own supplier account."
        );

        return;
      }

      /* ======================================================
         VERIFY SUPPLIER
      ====================================================== */

      const {
        data: supplier,
        error: supplierError,
      } = await supabase
        .from("suppliers")
        .select(
          "id, company_name"
        )
        .eq("id", supplierId)
        .maybeSingle();

      if (supplierError) {
        console.error(
          "SUPPLIER CHECK ERROR:",
          {
            message:
              supplierError.message,
            details:
              supplierError.details,
            hint: supplierError.hint,
            code: supplierError.code,
          }
        );

        alert(
          `Unable to verify the supplier.\n\n${supplierError.message}`
        );

        return;
      }

      if (!supplier) {
        console.error(
          "SUPPLIER NOT FOUND:",
          supplierId
        );

        alert(
          "The supplier for this part could not be found."
        );

        return;
      }

      console.log(
        "SUPPLIER CONFIRMED:",
        supplier
      );

      /* ======================================================
         VERIFY PART
         
         IMPORTANT:
         We also verify that the part belongs to
         the supplier shown on the page.
      ====================================================== */

      const {
        data: part,
        error: partError,
      } = await supabase
        .from("parts")
        .select(
          "id, supplier_id, part_number, status"
        )
        .eq("id", partId)
        .maybeSingle();

      if (partError) {
        console.error(
          "PART CHECK ERROR:",
          {
            message:
              partError.message,
            details:
              partError.details,
            hint: partError.hint,
            code: partError.code,
          }
        );

        alert(
          `Unable to verify the selected part.\n\n${partError.message}`
        );

        return;
      }

      if (!part) {
        console.error(
          "PART NOT FOUND:",
          partId
        );

        alert(
          "The selected aircraft part could not be found."
        );

        return;
      }

      console.log(
        "PART FOUND:",
        part
      );

      /* ======================================================
         VERIFY PART SUPPLIER
      ====================================================== */

      if (
        part.supplier_id !==
        supplierId
      ) {
        console.error(
          "PART SUPPLIER MISMATCH:",
          {
            partId,
            partSupplierId:
              part.supplier_id,
            selectedSupplierId:
              supplierId,
          }
        );

        alert(
          "The selected part does not belong to this supplier."
        );

        return;
      }

      /* ======================================================
         OPTIONAL STATUS CHECK
         
         Only prevent RFQs for obviously unavailable parts.
         
         If your marketplace uses different status values,
         this does not block normal active listings.
      ====================================================== */

      if (
        typeof part.status ===
          "string" &&
        [
          "inactive",
          "sold",
          "deleted",
          "archived",
        ].includes(
          part.status.toLowerCase()
        )
      ) {
        alert(
          "This part is no longer available for quotation."
        );

        return;
      }

      /* ======================================================
         CREATE RFQ
      ====================================================== */

      console.log(
        "CREATING RFQ:",
        {
          buyer_id: user.id,
          supplier_id: supplierId,
          part_id: partId,
          quantity,
          message:
            message.trim() || null,
        }
      );

      const {
        data,
        error: rfqError,
      } = await supabase
        .from("rfqs")
        .insert({
          buyer_id: user.id,
          supplier_id: supplierId,
          part_id: partId,
          quantity,
          message:
            message.trim() || null,
          status: "Pending",
        })
        .select()
        .single();

      /* ======================================================
         HANDLE RFQ ERROR
      ====================================================== */

      if (rfqError) {
        console.error(
          "CREATE RFQ ERROR:",
          {
            message:
              rfqError.message,
            details:
              rfqError.details,
            hint:
              rfqError.hint,
            code:
              rfqError.code,
          }
        );

        alert(
          `Unable to submit RFQ.\n\n${rfqError.message}`
        );

        return;
      }

      /* ======================================================
         SUCCESS
      ====================================================== */

      console.log(
        "RFQ CREATED SUCCESSFULLY:",
        data
      );

      alert(
        "RFQ submitted successfully."
      );

      router.push(
        "/buyer/rfqs"
      );

      router.refresh();

    } catch (error) {
      console.error(
        "SUBMIT RFQ ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting the RFQ."
      );

    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <h2 className="text-2xl font-bold text-aviation-primary">
        Request a Quote
      </h2>

      <p className="mt-2 text-aviation-muted">
        Part Number:{" "}
        <strong>
          {partNumber}
        </strong>
      </p>

      {/* =====================================================
          FORM
      ===================================================== */}

      <div className="mt-8 space-y-6">

        {/* ===================================================
            QUANTITY
        =================================================== */}

        <div>

          <label className="mb-2 block font-medium text-aviation-dark">
            Quantity Required
          </label>

          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => {
              const value =
                Number(
                  e.target.value
                );

              setQuantity(
                Number.isFinite(
                  value
                ) && value >= 1
                  ? value
                  : 1
              );
            }}
            disabled={loading}
            className="w-full rounded-xl border border-aviation-border p-3 outline-none transition focus:border-aviation-border focus:ring-2 focus:ring-aviation-primary/10 disabled:bg-aviation-light"
          />

        </div>

        {/* ===================================================
            ADDITIONAL REQUIREMENTS
        =================================================== */}

        <div>

          <label className="mb-2 block font-medium text-aviation-dark">
            Additional Requirements
          </label>

          <textarea
            rows={6}
            value={message}
            onChange={(e) =>
              setMessage(
                e.target.value
              )
            }
            disabled={loading}
            placeholder="8130, EASA Form 1, Trace, Fresh OH, delivery requirements, etc."
            className="w-full rounded-xl border border-aviation-border p-3 outline-none transition focus:border-aviation-border focus:ring-2 focus:ring-aviation-primary/10 disabled:bg-aviation-light"
          />

        </div>

        {/* ===================================================
            INFORMATION
        =================================================== */}

        <div className="rounded-xl bg-aviation-success-soft p-4 text-sm text-aviation-primary">

          <p className="font-medium">
            RFQ Information
          </p>

          <p className="mt-1">
            Your request will be sent directly
            to the supplier for quotation.
          </p>

        </div>

        {/* ===================================================
            SUBMIT
        =================================================== */}

        <button
          type="button"
          onClick={submitRFQ}
          disabled={loading}
          className="w-full rounded-xl bg-aviation-primary py-4 font-semibold text-white transition hover:bg-aviation-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Submitting..."
            : "Submit RFQ"}
        </button>

      </div>

    </div>
  );
}