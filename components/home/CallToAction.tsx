import Link from "next/link";
import { ArrowRight, Plane } from "lucide-react";

export default function CallToAction() {
  return (
    <section className="bg-aviation-primary py-20">
      <div className="mx-auto max-w-7xl px-6">

        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#6B9B7A] via-[#4F7A5F] to-[#6B9B7A] px-10 py-16 text-white shadow-2xl">

          <div className="mx-auto max-w-4xl text-center">

            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-white/10 p-5">
                <Plane size={42} />
              </div>
            </div>

            <h2 className="text-4xl font-bold lg:text-5xl">
              Ready to Buy or Sell Aircraft Parts?
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-aviation-muted">
              Join AviaInventory today and connect with verified aviation suppliers,
              airlines, MROs, brokers and operators across the globe.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">

              <Link
                href="/register?type=buyer"
                className="rounded-xl bg-white px-8 py-4 font-semibold text-aviation-primary transition hover:bg-aviation-light"
              >
                Register as Buyer
              </Link>

              <Link
                href="/register?type=supplier"
                className="flex items-center justify-center gap-2 rounded-xl border border-white px-8 py-4 font-semibold transition hover:bg-white hover:text-aviation-primary"
              >
                Become a Supplier
                <ArrowRight size={18} />
              </Link>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}