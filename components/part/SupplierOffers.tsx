import OfferCard from "./OfferCard";

const offers = [
  {
    supplier: "Aero Components Ltd",
    country: "United Kingdom",
    condition: "NEW",
    stock: 18,
    leadTime: "2 Days",
    certification: "FAA / EASA",
    verified: true,
  },
  {
    supplier: "Global Aircraft Parts",
    country: "United States",
    condition: "SERVICEABLE",
    stock: 7,
    leadTime: "1 Day",
    certification: "FAA",
    verified: true,
  },
  {
    supplier: "Sky Aviation Supplies",
    country: "United Arab Emirates",
    condition: "OVERHAULED",
    stock: 4,
    leadTime: "5 Days",
    certification: "EASA",
    verified: true,
  },
];

export default function SupplierOffers() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-10">

          <h2 className="text-3xl font-bold text-aviation-primary">
            Supplier Offers
          </h2>

          <p className="mt-2 text-aviation-muted">
            Compare supplier availability and request quotations directly from verified aviation suppliers.
          </p>

        </div>

        <div className="space-y-6">

          {offers.map((offer, index) => (
            <OfferCard
              key={index}
              offer={offer}
            />
          ))}

        </div>

      </div>
    </section>
  );
}