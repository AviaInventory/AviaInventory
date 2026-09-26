import Image from "next/image";
import Link from "next/link";
import { certificationKind, TrustBadge } from "@/components/trust/TrustBadge";
import type { MarketplacePart } from "@/lib/marketplace-server";
import VerificationStatusBadge from "@/components/supplier/verification/VerificationStatusBadge";

interface MarketplaceCardProps {
  part: MarketplacePart;
}

export default function MarketplaceCard({ part }: MarketplaceCardProps) {
  const imageUrl = part.image_urls?.[0] ?? null;

  return (
    <article className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-56 w-full bg-aviation-light">
        {imageUrl ? (
          <Image src={imageUrl} alt={`${part.part_number} aircraft part`} fill unoptimized className="object-contain" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-aviation-muted">No Image Available</div>
        )}
      </div>

      <div className="space-y-4 p-6">
        <div>
          <h2 className="text-xl font-bold text-aviation-primary">
            <Link href={`/marketplace/${part.id}`} className="hover:underline">{part.part_number}</Link>
          </h2>
          <p className="mt-2 line-clamp-2 text-sm text-aviation-muted">{part.description || "Aircraft part listing"}</p>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-wide text-aviation-muted">Supplier trust</span><VerificationStatusBadge status={part.supplier_verification_status} compact /></div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-4"><span className="text-aviation-muted">Supplier</span><span className="text-right font-semibold">{part.supplier_name}</span></div>
          <div className="flex justify-between gap-4"><span className="text-aviation-muted">Country</span><span className="text-right font-medium">{part.supplier_country || "-"}</span></div>
          <div className="flex justify-between gap-4"><span className="text-aviation-muted">Manufacturer</span><span className="text-right font-medium">{part.manufacturer || "-"}</span></div>
          <div className="flex items-center justify-between gap-4"><span className="text-aviation-muted">Condition</span><span className="rounded-full bg-aviation-success-soft px-3 py-1 text-xs font-semibold text-aviation-success">{part.condition || "-"}</span></div>
          <div className="flex items-start justify-between gap-4"><span className="text-aviation-muted">Certification</span><div className="text-right">{part.verified_certification_types?.length ? <div className="flex flex-wrap justify-end gap-1.5">{part.verified_certification_types.map((type) => <TrustBadge key={type} kind={certificationKind(type)} compact />)}</div> : <span className="text-xs font-semibold text-aviation-muted">No AviaInventory-verified document</span>} {part.trace_certificate && part.trace_certificate !== "No certification document" && <p className="mt-1 text-[10px] text-aviation-muted">Supplier declared: {part.trace_certificate}</p>}</div></div>
          <div className="flex justify-between gap-4"><span className="text-aviation-muted">Quantity</span><span className="font-medium">{part.quantity}</span></div><div className="flex justify-between gap-4"><span className="text-aviation-muted">Minimum order</span><span className="font-medium">{part.minimum_order_quantity}</span></div><div className="flex justify-between gap-4"><span className="text-aviation-muted">Availability</span><span className="font-medium">{part.availability || "-"}</span></div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-aviation-muted">{part.price_type === "request_quote" ? "Pricing" : part.price_type === "negotiable" ? "Negotiable" : "Price"}</p>
          <p className="text-2xl font-bold text-aviation-primary">{part.price_type === "request_quote" ? "Request a Quote" : `${part.currency} ${Number(part.unit_price || 0).toLocaleString()} ${part.price_basis === "lot" ? `per lot (${part.lot_size || "?"} units)` : "per unit"}`}</p>
          {part.price_valid_until && <p className="mt-2 text-xs text-aviation-muted">Price valid until {part.price_valid_until}</p>}<Link href={`/marketplace/${part.id}`} className="mt-5 block rounded-xl bg-aviation-primary py-3 text-center font-semibold text-white transition hover:bg-aviation-primary">View Details</Link>
        </div>
      </div>
    </article>
  );
}
