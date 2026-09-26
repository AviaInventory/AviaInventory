import { MapPin, Package, Clock, ShieldCheck, Send } from "lucide-react";

interface OfferCardProps {
  offer: {
    supplier: string;
    country: string;
    condition: string;
    stock: number;
    leadTime: string;
    certification: string;
    verified: boolean;
  };
}

export default function OfferCard({ offer }: OfferCardProps) {
  return (
    <div className="rounded-2xl border border-aviation-border bg-white p-6 shadow-sm transition hover:shadow-lg">

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

        {/* Left */}

        <div className="flex-1">

          <div className="flex items-center gap-3">

            <h3 className="text-xl font-bold text-aviation-primary">
              {offer.supplier}
            </h3>

            {offer.verified && (
              <span className="rounded-full bg-aviation-success-soft px-3 py-1 text-xs font-semibold text-aviation-success">
                VERIFIED
              </span>
            )}

          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">

            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-aviation-primary" />
              <span>{offer.country}</span>
            </div>

            <div className="flex items-center gap-2">
              <Package size={18} className="text-aviation-primary" />
              <span>{offer.stock} In Stock</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock size={18} className="text-aviation-primary" />
              <span>Lead Time: {offer.leadTime}</span>
            </div>

            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-aviation-primary" />
              <span>{offer.certification}</span>
            </div>

          </div>

        </div>

        {/* Right */}

        <div className="flex flex-col items-start gap-3 lg:items-end">

          <span className="rounded-full bg-aviation-light px-4 py-2 text-sm font-semibold">
            {offer.condition}
          </span>

          <button className="flex items-center gap-2 rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white transition hover:bg-aviation-primary">
            <Send size={18} />
            Request Quote
          </button>

        </div>

      </div>

    </div>
  );
}