import Image from "next/image";
import {
  BadgeCheck,
  Plane,
  Factory,
  Package,
  Calendar,
  FileText,
} from "lucide-react";

export default function PartDetails() {
  return (
    <section className="bg-white border-b">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">

        <div className="grid gap-10 lg:grid-cols-2">

          {/* Left Side - Image */}

          <div>

            <div className="relative aspect-square overflow-hidden rounded-2xl border bg-aviation-light">

              <Image
                src="/parts/bolt.jpg"
                alt="Aircraft Part"
                fill
                className="object-cover"
              />

            </div>

            {/* Thumbnail Gallery */}

            <div className="mt-4 grid grid-cols-4 gap-3">

              {[1,2,3,4].map((item) => (
                <div
                  key={item}
                  className="relative aspect-square overflow-hidden rounded-xl border bg-aviation-light"
                >
                  <Image
                    src="/parts/bolt.jpg"
                    alt="Part"
                    fill
                    className="object-cover"
                  />
                </div>
              ))}

            </div>

          </div>

          {/* Right Side */}

          <div>

            <span className="rounded-full bg-aviation-success-soft px-4 py-2 text-sm font-semibold text-aviation-success">
              NEW
            </span>

            <h1 className="mt-5 text-4xl font-bold text-aviation-primary">
              BACB30LN3K3
            </h1>

            <h2 className="mt-3 text-2xl text-aviation-dark">
              Close Tolerance Bolt
            </h2>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">

              <div className="flex items-center gap-3">
                <Factory className="text-aviation-primary" />
                <div>
                  <p className="text-sm text-aviation-muted">Manufacturer</p>
                  <p className="font-semibold">Boeing</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Package className="text-aviation-primary" />
                <div>
                  <p className="text-sm text-aviation-muted">Category</p>
                  <p className="font-semibold">Hardware</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <BadgeCheck className="text-aviation-primary" />
                <div>
                  <p className="text-sm text-aviation-muted">Available Offers</p>
                  <p className="font-semibold">18 Suppliers</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="text-aviation-primary" />
                <div>
                  <p className="text-sm text-aviation-muted">Last Updated</p>
                  <p className="font-semibold">Today</p>
                </div>
              </div>

            </div>

            {/* Description */}

            <div className="mt-10">

              <h3 className="mb-3 text-xl font-bold">
                Description
              </h3>

              <p className="leading-8 text-aviation-muted">
                High-strength close tolerance aircraft bolt used in
                structural assemblies requiring precision fit and
                reliable performance in demanding aviation
                environments.
              </p>

            </div>

            {/* Compatible Aircraft */}

            <div className="mt-10">

              <div className="mb-4 flex items-center gap-2">

                <Plane className="text-aviation-primary" />

                <h3 className="text-xl font-bold">
                  Compatible Aircraft
                </h3>

              </div>

              <div className="flex flex-wrap gap-3">

                {[
                  "B737",
                  "B747",
                  "B757",
                  "B767",
                  "B777",
                  "B787",
                ].map((aircraft) => (

                  <span
                    key={aircraft}
                    className="rounded-full bg-aviation-light px-4 py-2"
                  >
                    {aircraft}
                  </span>

                ))}

              </div>

            </div>

            {/* Specifications */}

            <div className="mt-10 rounded-2xl border bg-aviation-light p-6">

              <div className="mb-5 flex items-center gap-2">

                <FileText className="text-aviation-primary" />

                <h3 className="text-xl font-bold">
                  Technical Information
                </h3>

              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <p className="text-sm text-aviation-muted">
                    Part Number
                  </p>
                  <p className="font-semibold">
                    BACB30LN3K3
                  </p>
                </div>

                <div>
                  <p className="text-sm text-aviation-muted">
                    Condition
                  </p>
                  <p className="font-semibold">
                    New
                  </p>
                </div>

                <div>
                  <p className="text-sm text-aviation-muted">
                    TSN
                  </p>
                  <p className="font-semibold">
                    0 Hours
                  </p>
                </div>

                <div>
                  <p className="text-sm text-aviation-muted">
                    TSO
                  </p>
                  <p className="font-semibold">
                    0 Hours
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}