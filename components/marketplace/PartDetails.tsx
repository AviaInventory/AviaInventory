"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { supabase } from "@/lib/supabase";
import RFQForm from "@/components/rfq/RFQForm";
import { certificationKind, TrustBadge } from "@/components/trust/TrustBadge";
import VerificationStatusBadge from "@/components/supplier/verification/VerificationStatusBadge";

interface Part {
  id: string;
  supplier_id: string;

  supplier_name?: string;
  supplier_country?: string;
  supplier_verification_status?: string;
  verified_certification_types?: string[];

  part_number: string;
  alternate_part_number: string;

  description: string;

  manufacturer: string;

  serial_number: string;

  aircraft_manufacturer: string;
  aircraft_model: string;

  engine_manufacturer: string;
  engine_model: string;

  ata_chapter: string;
  category: string;

  condition: string;

  quantity: number;

  unit_price: number | null;
  currency: string;
  price_type: "fixed" | "negotiable" | "request_quote" | string;
  price_basis: "unit" | "lot" | string;
  lot_size: number | null;
  minimum_order_quantity: number;

  stock_location: string;
  availability: string;
  lead_time: string;
  incoterms: string;
  payment_terms: string;
  price_valid_until: string | null;

  trace_certificate: string;

  tsn: string;
  tso: string;

  maintenance_notes: string;

  shelf_life_expiry: string;

  hazmat?: boolean;

  featured?: boolean;

  status: string;

  image_urls: string[];

  document_urls: string[];
}

interface Props {
  partId: string;
}

export default function PartDetails({ partId }: Props) {
  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    loadPart();
  }, [partId]);

  async function loadPart() {
    setLoading(true);
    setAuthChecked(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setIsAuthenticated(Boolean(user));

    if (!user) {
      const { data, error } = await supabase
        .from("parts")
        .select("id, supplier_id, part_number, manufacturer, image_urls, status")
        .eq("id", partId)
        .eq("status", "Published")
        .maybeSingle();

      if (error) {
        console.error("GET PUBLIC PART ERROR:", error);
      }

      if (data) {
        const { data: supplier } = await supabase.from("suppliers").select("verification_status").eq("id", data.supplier_id).maybeSingle();
        setPart({
          ...data,
          supplier_verification_status: supplier?.verification_status || "Draft",
          supplier_id: "",
          alternate_part_number: "",
          description: "",
          serial_number: "",
          aircraft_manufacturer: "",
          aircraft_model: "",
          engine_manufacturer: "",
          engine_model: "",
          ata_chapter: "",
          category: "",
          condition: "",
          quantity: 0,
          unit_price: null,
          currency: "USD",
          price_type: "request_quote",
          price_basis: "unit",
          lot_size: null,
          minimum_order_quantity: 1,
          stock_location: "",
          availability: "",
          lead_time: "",
          incoterms: "",
          payment_terms: "",
          price_valid_until: null,
          trace_certificate: "",
          tsn: "",
          tso: "",
          maintenance_notes: "",
          shelf_life_expiry: "",
          hazmat: false,
          featured: false,
          document_urls: [],
        } as Part);
      }
    } else {
      const { data, error } = await supabase
        .from("parts")
        .select("*")
        .eq("id", partId)
        .eq("status", "Published")
        .maybeSingle();

      if (error) {
        console.error("GET PART ERROR:", error);
      } else if (data) {
        const { data: supplier } = await supabase.from("suppliers").select("verification_status").eq("id", data.supplier_id).maybeSingle();
        setPart({ ...data, supplier_verification_status: supplier?.verification_status || "Draft" });
      }
    }

    setAuthChecked(true);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-aviation-muted">
          Loading part...
        </p>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-3xl font-bold">
          Part Not Found
        </h2>

        <Link
          href="/marketplace"
          className="mt-6 inline-flex rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white hover:bg-aviation-primary"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  if (authChecked && !isAuthenticated) {
    const image = part.image_urls?.[0];

    return (
      <div className="mx-auto max-w-3xl py-10 sm:py-16">
        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          <div className="relative h-72 bg-aviation-light">
            {image ? (
              <Image
                src={image}
                alt={part.part_number}
                fill
                unoptimized
                className="object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-aviation-muted">
                No Image Available
              </div>
            )}
          </div>

          <div className="p-8 text-center">
            <p className="text-sm font-medium text-aviation-primary">
              {part.manufacturer || "Aircraft Part"}
            </p>

            <h1 className="mt-2 text-3xl font-bold text-aviation-primary">
              {part.part_number}
            </h1>

            <h2 className="mt-6 text-2xl font-bold text-aviation-dark">
              Login to view full part details
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-aviation-muted">
              Register or sign in to view supplier information,
              pricing, technical specifications and submit an RFQ.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="rounded-xl bg-aviation-primary px-7 py-3 font-semibold text-white hover:bg-aviation-primary"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-xl border border-aviation-border px-7 py-3 font-semibold text-aviation-primary hover:bg-aviation-light"
              >
                Register
              </Link>

              <Link
                href="/marketplace"
                className="rounded-xl border px-7 py-3 font-semibold text-aviation-dark hover:bg-aviation-light"
              >
                Back to Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const images = Array.isArray(part.image_urls)
    ? part.image_urls
    : [];

  const documents = Array.isArray(part.document_urls)
    ? part.document_urls
    : [];

  return (
    <div className="space-y-16">

      {/* ====================================================== */}
      {/* BREADCRUMB */}
      {/* ====================================================== */}

      <div className="text-sm text-aviation-muted">

        <Link
          href="/marketplace"
          className="hover:text-aviation-primary"
        >
          Marketplace
        </Link>

        <span className="mx-2">
          /
        </span>

        <span>
          {part.manufacturer}
        </span>

        <span className="mx-2">
          /
        </span>

        <span className="font-semibold text-aviation-primary">
          {part.part_number}
        </span>

      </div>


      {/* ====================================================== */}
      {/* MAIN PRODUCT SECTION */}
      {/* ====================================================== */}

      <div className="grid gap-12 lg:grid-cols-2">

        {/* ================================================== */}
        {/* IMAGE GALLERY */}
        {/* ================================================== */}

        <div>

          {/* MAIN IMAGE */}

          <div className="relative h-[320px] overflow-hidden rounded-2xl border bg-white shadow sm:h-[420px] lg:h-[560px]">

            {images.length > 0 ? (

              <Image
                src={images[selectedImage]}
                alt={part.part_number}
                fill
                unoptimized
                className="object-contain"
              />

            ) : (

              <div className="flex h-full items-center justify-center bg-aviation-light text-aviation-muted">
                No Image Available
              </div>

            )}

          </div>


          {/* THUMBNAILS */}

          {images.length > 1 && (

            <div className="mt-5 flex gap-3 overflow-x-auto pb-1">

              {images.map((image, index) => (

                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    setSelectedImage(index)
                  }
                  className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    selectedImage === index
                      ? "border-aviation-border"
                      : "border-aviation-border"
                  }`}
                >

                  <Image
                    src={image}
                    alt={`${part.part_number} image ${index + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />

                </button>

              ))}

            </div>

          )}

        </div>


        {/* ================================================== */}
        {/* RIGHT PANEL */}
        {/* ================================================== */}

        <div className="h-fit lg:sticky lg:top-24">

          {/* BADGES */}

          <div className="flex flex-wrap gap-3">

            <Badge color="green">
              {part.condition}
            </Badge>

            <Badge color="blue">
              {part.status}
            </Badge>

            {part.featured && (
              <Badge color="yellow">
                Featured
              </Badge>
            )}

            {part.hazmat && (
              <Badge color="red">Hazmat</Badge>
            )}

            {part.verified_certification_types?.length ? part.verified_certification_types.map((type) => <TrustBadge key={type} kind={certificationKind(type)} />) : <span className="rounded-full border border-aviation-border bg-aviation-light px-3 py-1.5 text-xs font-semibold text-aviation-muted">No AviaInventory-verified document</span>}
            <VerificationStatusBadge status={part.supplier_verification_status || "Draft"} />
            <TrustBadge kind="buyer-protection" />

          </div>


          {/* PART NUMBER */}

          <h1 className="mt-6 text-4xl font-bold text-aviation-primary">
            {part.part_number}
          </h1>


          {/* ALTERNATE PART NUMBER */}

          {part.alternate_part_number && (

            <p className="mt-2 text-aviation-muted">
              Alternate P/N:{" "}
              {part.alternate_part_number}
            </p>

          )}


          {/* DESCRIPTION */}

          <p className="mt-6 leading-8 text-aviation-muted">
            {part.description}
          </p>


          {/* PRICE */}

          <div className="mt-6 rounded-2xl border bg-aviation-light p-4 sm:p-6">

            <p className="text-sm text-aviation-muted">
              {part.price_type === "request_quote" ? "Pricing" : part.price_type === "negotiable" ? "Negotiable price" : "Published price"}
            </p>

            <h2 className="mt-2 text-3xl font-bold text-aviation-primary">
              {part.price_type === "request_quote" ? "Request a Quote" : `${part.currency} ${Number(part.unit_price || 0).toLocaleString()} ${part.price_basis === "lot" ? `per lot (${part.lot_size || "?"} units)` : "per unit"}`}
            </h2>
            <p className="mt-2 text-xs leading-5 text-aviation-muted">
              {part.price_type === "negotiable" ? "Indicative price only; final commercial price is negotiated with the supplier." : part.price_type === "request_quote" ? "No numeric price is published for this listing. Request a supplier quote for current pricing." : "The displayed amount is the supplier's published price for the stated pricing basis."}
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div><p className="text-aviation-muted">Available Qty</p><p className="font-semibold">{part.quantity}</p></div>
              <div><p className="text-aviation-muted">Minimum order</p><p className="font-semibold">{part.minimum_order_quantity}</p></div>
              <div><p className="text-aviation-muted">Availability</p><p className="font-semibold">{part.availability || "-"}</p></div>
              <div><p className="text-aviation-muted">Lead Time</p><p className="font-semibold">{part.lead_time || "-"}</p></div>
              {part.incoterms && <div><p className="text-aviation-muted">Incoterms</p><p className="font-semibold">{part.incoterms}</p></div>}
              {part.payment_terms && <div><p className="text-aviation-muted">Payment Terms</p><p className="font-semibold">{part.payment_terms}</p></div>}
              {part.price_valid_until && <div><p className="text-aviation-muted">Price valid until</p><p className="font-semibold">{part.price_valid_until}</p></div>}
            </div>

          </div>


          {/* RFQ */}

          <div className="mt-8">

            <RFQForm
              partId={part.id}
              supplierId={part.supplier_id}
              partNumber={part.part_number}
            />

          </div>

        </div>

      </div>


      {/* ====================================================== */}
      {/* TECHNICAL SPECIFICATIONS */}
      {/* ====================================================== */}

      <section>

        <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">

          <h2 className="text-2xl font-bold">
            Technical Specifications
          </h2>

          <span className="rounded-full bg-aviation-light px-4 py-2 text-sm text-aviation-muted">
            ATA {part.ata_chapter || "-"}
          </span>

        </div>


        <div className="overflow-hidden rounded-2xl border bg-white">

          <table className="w-full">

            <tbody>

              <TableRow
                label="Manufacturer"
                value={part.manufacturer}
              />

              <TableRow
                label="Aircraft Manufacturer"
                value={part.aircraft_manufacturer}
              />

              <TableRow
                label="Aircraft Model"
                value={part.aircraft_model}
              />

              <TableRow
                label="Engine Manufacturer"
                value={part.engine_manufacturer}
              />

              <TableRow
                label="Engine Model"
                value={part.engine_model}
              />

              <TableRow
                label="Category"
                value={part.category}
              />

              <TableRow
                label="Condition"
                value={part.condition}
              />

              <TableRow
                label="Serial Number"
                value={part.serial_number}
              />

              <TableRow
                label="Stock Location"
                value={part.stock_location}
              />

              <TableRow
                label="Available Quantity"
                value={String(part.quantity)}
              />

              <TableRow
                label="Lead Time"
                value={part.lead_time}
              />

            </tbody>

          </table>

        </div>

      </section>


      {/* ====================================================== */}
      {/* CERTIFICATION */}
      {/* ====================================================== */}

      <section>

        <h2 className="mb-6 text-2xl font-bold">
          Certification & Maintenance
        </h2>


        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

          <Detail
            title="Supplier-declared documentation"
            value={part.trace_certificate}
          />

          <Detail
            title="AviaInventory-verified documents"
            value={part.verified_certification_types?.length ? part.verified_certification_types.join(", ") : "None verified"}
          />

          <Detail
            title="TSN"
            value={part.tsn}
          />

          <Detail
            title="TSO"
            value={part.tso}
          />

          <Detail
            title="Shelf Life"
            value={part.shelf_life_expiry}
          />

          <Detail
            title="Maintenance Notes"
            value={part.maintenance_notes}
          />

          <Detail
            title="Status"
            value={part.status}
          />

        </div>

      </section>


      {/* ====================================================== */}
      {/* SUPPLIER */}
      {/* ====================================================== */}

      <section>

        <h2 className="mb-6 text-2xl font-bold">
          Supplier Information
        </h2>


        <div className="rounded-2xl border bg-white p-8 shadow-sm">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>

              <h3 className="text-2xl font-bold">
                {part.supplier_name || "Verified Supplier"}
              </h3>

              <p className="mt-2 text-aviation-muted">
                {part.supplier_country || "Location unavailable"}
              </p>

            </div>


            <div className="flex gap-3">

              <TrustBadge kind="verified" />

              <Badge color="blue">
                Responds within 24 hrs
              </Badge>

            </div>

          </div>


          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <SupplierStat
              title="Rating"
              value="★★★★★"
            />

            <SupplierStat
              title="Response Rate"
              value="98%"
            />

            <SupplierStat
              title="Completed Orders"
              value="250+"
            />

          </div>

        </div>

      </section>


      {/* ====================================================== */}
      {/* DOCUMENTS */}
      {/* ====================================================== */}

      {documents.length > 0 && (

        <section>

          <h2 className="mb-6 text-2xl font-bold">
            Supporting Documents
          </h2>


          <div className="space-y-4">

            {documents.map((document, index) => (

              <a
                key={index}
                href={document}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border bg-white p-5 transition hover:border-aviation-border"
              >

                <div>

                  <p className="font-semibold">
                    Document {index + 1}
                  </p>

                  <p className="text-sm text-aviation-muted">
                    Click to download
                  </p>

                </div>


                <span className="font-semibold text-aviation-primary">
                  Download →
                </span>

              </a>

            ))}

          </div>

        </section>

      )}


      {/* ====================================================== */}
      {/* RELATED PARTS */}
      {/* ====================================================== */}

      <section>

        <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">

          <h2 className="text-2xl font-bold">
            Related Parts
          </h2>


          <Link
            href={`/marketplace?manufacturer=${encodeURIComponent(
              part.manufacturer
            )}`}
            className="font-medium text-aviation-primary hover:underline"
          >
            View More →
          </Link>

        </div>


        <RelatedParts
          manufacturer={part.manufacturer}
          currentPartId={part.id}
        />

      </section>

    </div>
  );
}


/* ====================================================== */
/* BADGE */
/* ====================================================== */

function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "green" | "blue" | "yellow" | "red";
}) {
  const styles = {
    green: "bg-aviation-success-soft text-aviation-success",
    blue: "bg-aviation-success-soft text-aviation-success",
    yellow: "bg-aviation-warning-soft text-aviation-warning",
    red: "bg-aviation-error-soft text-aviation-error",
  };

  return (
    <span
      className={`rounded-full px-4 py-2 text-sm font-semibold ${styles[color]}`}
    >
      {children}
    </span>
  );
}


/* ====================================================== */
/* DETAIL CARD */
/* ====================================================== */

function Detail({
  title,
  value,
}: {
  title: string;
  value?: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-sm text-aviation-muted">
        {title}
      </p>

      <p className="mt-2 font-semibold">
        {value || "-"}
      </p>
    </div>
  );
}


/* ====================================================== */
/* SUPPLIER STATS */
/* ====================================================== */

function SupplierStat({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-aviation-light p-5">
      <p className="text-sm text-aviation-muted">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-aviation-primary">
        {value}
      </p>
    </div>
  );
}


/* ====================================================== */
/* TABLE ROW */
/* ====================================================== */

function TableRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <tr className="border-b last:border-b-0">

      <td className="w-1/3 bg-aviation-light px-6 py-4 font-medium">
        {label}
      </td>

      <td className="px-6 py-4">
        {value || "-"}
      </td>

    </tr>
  );
}


/* ====================================================== */
/* RELATED PARTS */
/* ====================================================== */

function RelatedParts({
  manufacturer,
  currentPartId,
}: {
  manufacturer: string;
  currentPartId: string;
}) {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRelated();
  }, [manufacturer, currentPartId]);

  async function loadRelated() {
    setLoading(true);

    const { data, error } = await supabase
      .from("parts")
      .select("*")
      .eq("manufacturer", manufacturer)
      .eq("status", "Published")
      .neq("id", currentPartId)
      .order("created_at", {
        ascending: false,
      })
      .limit(4);

    if (error) {
      console.error(
        "RELATED PARTS ERROR:",
        error
      );
    }

    setParts(data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <p className="text-aviation-muted">
        Loading related parts...
      </p>
    );
  }

  if (!parts.length) {
    return (
      <div className="rounded-xl border bg-aviation-light p-6 text-aviation-muted">
        No related parts available.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

      {parts.map((part) => (

        <Link
          key={part.id}
          href={`/marketplace/${part.id}`}
          className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >

          {/* RELATED PART IMAGE */}

          <div className="relative h-52 bg-aviation-light">

            {part.image_urls?.length ? (

              <Image
                src={part.image_urls[0]}
                alt={part.part_number}
                fill
                unoptimized
                className="object-contain"
              />

            ) : (

              <div className="flex h-full items-center justify-center text-aviation-muted">
                No Image
              </div>

            )}

          </div>


          {/* RELATED PART CONTENT */}

          <div className="p-5">

            <h3 className="font-bold text-aviation-primary">
              {part.part_number}
            </h3>

            <p className="mt-1 text-sm text-aviation-muted">
              {part.manufacturer}
            </p>

            <p className="mt-4 text-xl font-bold">
              {part.currency}{" "}
              {Number(part.unit_price).toLocaleString()}
            </p>

            <p className="mt-2 text-sm text-aviation-muted">
              Qty: {part.quantity}
            </p>

          </div>

        </Link>

      ))}

    </div>
  );
}