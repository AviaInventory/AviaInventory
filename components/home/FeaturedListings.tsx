import Image from "next/image";
import { ArrowRight, Lock } from "lucide-react";

const listings = [
  {
    id: 1,
    partNumber: "BACB30LN3K3",
    description: "Close Tolerance Bolt",
    manufacturer: "Boeing",
    condition: "New",
    offers: 18,
    image: "/parts/bolt.jpg",
  },
  {
    id: 2,
    partNumber: "065-311-200",
    description: "Landing Gear Actuator",
    manufacturer: "Collins Aerospace",
    condition: "Overhauled",
    offers: 6,
    image: "/parts/landing-gear.jpg",
  },
  {
    id: 3,
    partNumber: "23065890",
    description: "Brake Assembly",
    manufacturer: "Goodrich",
    condition: "Serviceable",
    offers: 9,
    image: "/parts/brake.jpg",
  },
  {
    id: 4,
    partNumber: "LW-16702",
    description: "Aircraft Oil Filter",
    manufacturer: "Lycoming",
    condition: "New",
    offers: 24,
    image: "/parts/filter.jpg",
  },
];

export default function FeaturedListings() {
  return (
    <section className="bg-aviation-light py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-4xl font-bold text-aviation-primary">
              Featured Listings
            </h2>

            <p className="mt-2 text-aviation-muted">
              Browse some of the latest aircraft parts available on AviaInventory.
            </p>
          </div>

          <a href="/marketplace" className="inline-flex items-center justify-center gap-2 self-start rounded-lg border px-5 py-3 hover:bg-white sm:self-auto">
            View Marketplace
            <ArrowRight size={18} />
          </a>

        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">

          {listings.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
            >
              <div className="relative aspect-video bg-aviation-light">
                <Image
                  src={item.image}
                  alt={item.description}
                  fill
                  className="object-cover"
                />

                <span className="absolute left-4 top-4 rounded-full bg-aviation-primary px-3 py-1 text-xs font-semibold text-white">
                  {item.condition}
                </span>
              </div>

              <div className="p-6">

                <p className="text-sm font-semibold text-aviation-primary">
                  {item.partNumber}
                </p>

                <h3 className="mt-2 text-xl font-bold">
                  {item.description}
                </h3>

                <p className="mt-2 text-aviation-muted">
                  {item.manufacturer}
                </p>

                <div className="mt-5 flex items-center justify-between">

                  <span className="rounded-full bg-aviation-light px-3 py-2 text-sm">
                    {item.offers} Offers
                  </span>

                  <div className="flex items-center gap-2 text-aviation-primary">
                    <Lock size={16} />
                    <span className="text-sm font-medium">
                      Login for Price
                    </span>
                  </div>

                </div>

                <button className="mt-6 w-full rounded-xl bg-aviation-primary py-3 font-semibold text-white transition hover:bg-aviation-primary">
                  View Details
                </button>

              </div>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}