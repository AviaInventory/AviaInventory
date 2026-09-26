import Image from "next/image";
import Link from "next/link";
import { certificationKind, TrustBadge } from "@/components/trust/TrustBadge";
import {
  ArrowRight,
  Building2,
  Plane,
  ShieldCheck,
  Lock,
} from "lucide-react";

interface PartCardProps {
  part: {
    id: number;
    image: string;
    partNumber: string;
    description: string;
    manufacturer: string;
    category: string;
    condition: string;
    offers: number;
    aircraft: string[];
    updated: string;
    traceCertificate?: string;
  };
}

export default function PartCard({ part }: PartCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-aviation-border bg-white shadow-sm transition-all duration-300 hover:border-aviation-border hover:shadow-xl">

      <div className="flex flex-col lg:flex-row">

        {/* Image */}
        <div className="relative h-72 lg:h-auto lg:w-72 flex-shrink-0">
          <Image
            src={part.image}
            alt={part.description}
            fill
            className="object-cover"
          />
        </div>

        {/* Information */}
        <div className="flex flex-1 flex-col justify-between p-8">

          <div>

            <div className="flex flex-wrap items-center justify-between gap-4">

              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-aviation-primary">
                  {part.partNumber}
                </p>

                <h2 className="mt-2 text-2xl font-bold text-aviation-dark">
                  {part.description}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-aviation-success-soft px-4 py-2 text-sm font-semibold text-aviation-success">{part.condition}</span>
                <TrustBadge kind={certificationKind(part.traceCertificate)} compact />
              </div>

            </div>

            {/* Information Grid */}

            <div className="mt-8 grid gap-6 md:grid-cols-2">

              <div className="space-y-4">

                <div className="flex items-center gap-3">

                  <Building2 size={18} className="text-aviation-primary" />

                  <span>
                    <strong>Manufacturer:</strong> {part.manufacturer}
                  </span>

                </div>

                <div className="flex items-center gap-3">

                  <Plane size={18} className="text-aviation-primary" />

                  <span>
                    <strong>Category:</strong> {part.category}
                  </span>

                </div>

                <div className="flex items-center gap-3">

                  <ShieldCheck size={18} className="text-aviation-primary" />

                  <span>
                    <strong>{part.offers}</strong> Supplier Offers
                  </span>

                </div>

              </div>

              <div>

                <p className="mb-3 font-semibold">
                  Compatible Aircraft
                </p>

                <div className="flex flex-wrap gap-2">

                  {part.aircraft.map((aircraft) => (
                    <span
                      key={aircraft}
                      className="rounded-full bg-aviation-light px-3 py-1 text-sm"
                    >
                      {aircraft}
                    </span>
                  ))}

                </div>

              </div>

            </div>

            {/* Locked Pricing */}

            <div className="mt-8 rounded-xl border bg-aviation-light p-5">

              <div className="flex items-center gap-3">

                <Lock size={18} className="text-aviation-primary" />

                <div>

                  <p className="font-semibold">
                    Pricing & Supplier Details
                  </p>

                  <p className="text-sm text-aviation-muted">
                    Register or sign in to view pricing, stock availability,
                    supplier information and request quotations.
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* Bottom */}

          <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t pt-6 md:flex-row md:items-center">

            <p className="text-sm text-aviation-muted">
              Updated {part.updated}
            </p>

            <Link
              href={`/marketplace/${part.partNumber}`}
              className="inline-flex items-center gap-2 rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white transition hover:bg-aviation-primary"
            >
              View Details
              <ArrowRight size={18} />
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}