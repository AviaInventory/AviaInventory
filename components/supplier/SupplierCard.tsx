"use client";

import Link from "next/link";
import Image from "next/image";

import type { Supplier } from "@/lib/suppliers";
import { TrustBadge } from "@/components/trust/TrustBadge";
import VerificationStatusBadge from "@/components/supplier/verification/VerificationStatusBadge";

interface Props {
  supplier: Supplier;
}

export default function SupplierCard({
  supplier,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

      <div className="flex items-center gap-5 p-6">

        <div className="relative h-20 w-20 overflow-hidden rounded-xl border bg-aviation-light">

          {supplier.logo_url ? (

            <Image
              src={supplier.logo_url}
              alt={supplier.company_name}
              fill
              className="object-contain p-2"
            />

          ) : (

            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-aviation-primary">
              {supplier.company_name.charAt(0)}
            </div>

          )}

        </div>

        <div className="flex-1">

          <h2 className="text-xl font-bold text-aviation-primary">
            {supplier.company_name}
          </h2>

          <p className="mt-1 text-sm text-aviation-muted">
            {supplier.city}
            {supplier.city && supplier.country ? ", " : ""}
            {supplier.country}
          </p>

        </div>

      </div>

      {supplier.description && (

        <div className="px-6">

          <p className="line-clamp-3 text-sm leading-6 text-aviation-muted">
            {supplier.description}
          </p>

        </div>

      )}

      <div className="mt-6 flex flex-wrap gap-2 px-6">

        {supplier.categories.map((category) => (

          <span
            key={category}
            className="rounded-full bg-aviation-light px-3 py-1 text-xs"
          >
            {category}
          </span>

        ))}

      </div>

      <div className="mt-6 flex items-center justify-between border-t p-6">

        <VerificationStatusBadge status={supplier.verification_status || "Draft"} compact />

        <Link
          href={`/suppliers/${supplier.id}`}
          className="rounded-xl bg-aviation-primary px-5 py-2 font-medium text-white transition hover:bg-aviation-primary"
        >
          View Profile
        </Link>

      </div>

    </div>
  );
}