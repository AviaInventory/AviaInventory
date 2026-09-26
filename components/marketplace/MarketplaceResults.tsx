import PartCard from "./PartCard";

const parts = [
  {
    id: 1,
    image: "/parts/bolt.jpg",
    partNumber: "BACB30LN3K3",
    description: "Close Tolerance Bolt",
    manufacturer: "Boeing",
    category: "Hardware",
    condition: "NEW",
    offers: 18,
    aircraft: ["B737", "B747", "B777"],
    updated: "2 hours ago",
    traceCertificate: "FAA 8130-3",
  },
  {
    id: 2,
    image: "/parts/filter.jpg",
    partNumber: "LW-16702",
    description: "Oil Filter",
    manufacturer: "Lycoming",
    category: "Consumables",
    condition: "NEW",
    offers: 12,
    aircraft: ["C172", "PA28", "Baron"],
    updated: "Today",
    traceCertificate: "EASA Form 1",
  },
  {
    id: 3,
    image: "/parts/brake.jpg",
    partNumber: "23065890",
    description: "Brake Assembly",
    manufacturer: "Goodrich",
    category: "Landing Gear",
    condition: "SERVICEABLE",
    offers: 9,
    aircraft: ["Dash 8", "CRJ200"],
    updated: "Yesterday",
    traceCertificate: "None",
  },
  {
    id: 4,
    image: "/parts/landing-gear.jpg",
    partNumber: "065-311-200",
    description: "Landing Gear Actuator",
    manufacturer: "Collins Aerospace",
    category: "Landing Gear",
    condition: "OVERHAULED",
    offers: 6,
    aircraft: ["ATR42", "ATR72"],
    updated: "3 days ago",
    traceCertificate: "FAA 8130-3",
  },
];

export default function MarketplaceResults() {
  return (
    <div className="space-y-6">

      {parts.map((part) => (
        <PartCard
          key={part.id}
          part={part}
        />
      ))}

      {/* Pagination */}

      <div className="flex items-center justify-center gap-3 pt-10">

        <button className="rounded-lg border px-4 py-2 hover:bg-aviation-light">
          Previous
        </button>

        <button className="rounded-lg bg-aviation-primary px-4 py-2 text-white">
          1
        </button>

        <button className="rounded-lg border px-4 py-2 hover:bg-aviation-light">
          2
        </button>

        <button className="rounded-lg border px-4 py-2 hover:bg-aviation-light">
          3
        </button>

        <button className="rounded-lg border px-4 py-2 hover:bg-aviation-light">
          Next
        </button>

      </div>

    </div>
  );
}