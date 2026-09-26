import { Package, Building2, Globe2, ShoppingCart } from "lucide-react";

const stats = [
  {
    icon: Package,
    value: "100,000+",
    label: "Aircraft Parts",
  },
  {
    icon: ShoppingCart,
    value: "18,500+",
    label: "Active Offers",
  },
  {
    icon: Building2,
    value: "420+",
    label: "Verified Suppliers",
  },
  {
    icon: Globe2,
    value: "75+",
    label: "Countries",
  },
];

export default function Stats() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-6">

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-aviation-border bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-5 inline-flex rounded-xl bg-aviation-primary/10 p-4">
                  <Icon size={28} className="text-aviation-primary" />
                </div>

                <h2 className="text-4xl font-bold text-aviation-primary">
                  {item.value}
                </h2>

                <p className="mt-2 text-aviation-muted">
                  {item.label}
                </p>
              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}