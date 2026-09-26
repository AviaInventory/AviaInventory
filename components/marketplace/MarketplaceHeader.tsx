"use client";

import { Search, SlidersHorizontal } from "lucide-react";

export default function MarketplaceHeader() {
  return (
    <section className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* Heading */}

        <div className="mb-8">

          <h1 className="text-4xl font-bold text-aviation-primary">
            Aircraft Parts Marketplace
          </h1>

          <p className="mt-3 max-w-3xl text-aviation-muted">
            Search aircraft parts by part number, aircraft model,
            manufacturer, NSN or description.
          </p>

        </div>

        {/* Search */}

        <div className="rounded-2xl border bg-aviation-light p-5 shadow-sm">

          <div className="flex flex-col gap-4 lg:flex-row">

            <div className="relative flex-1">

              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2 text-aviation-muted"
                size={22}
              />

              <input
                type="text"
                placeholder="Search Part Number, Aircraft, Description, Manufacturer or NSN..."
                className="w-full rounded-xl border bg-white py-4 pl-14 pr-4 outline-none transition focus:border-aviation-border"
              />

            </div>

            <button className="rounded-xl bg-aviation-primary px-8 py-4 font-semibold text-white transition hover:bg-aviation-primary">
              Search
            </button>

          </div>

        </div>

        {/* Quick Search */}

        <div className="mt-6 flex flex-wrap gap-3">

          {[
            "Dash 8 Q400",
            "PT6A",
            "CFM56",
            "Honeywell",
            "Landing Gear",
            "Brake Assembly",
            "AeroShell",
          ].map((item) => (
            <button
              key={item}
              className="rounded-full border bg-white px-4 py-2 text-sm transition hover:border-aviation-border hover:text-aviation-primary"
            >
              {item}
            </button>
          ))}

        </div>

        {/* Results Bar */}

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t pt-6 md:flex-row md:items-center">

          <div>

            <h2 className="text-xl font-semibold">
              12,584 Parts Found
            </h2>

            <p className="text-aviation-muted">
              Showing the latest available aircraft parts.
            </p>

          </div>

          <div className="flex items-center gap-4">

            <button className="flex items-center gap-2 rounded-xl border px-5 py-3 hover:bg-aviation-light">

              <SlidersHorizontal size={18} />

              Filters

            </button>

            <select className="rounded-xl border px-4 py-3">

              <option>Newest</option>

              <option>Most Offers</option>

              <option>Recently Updated</option>

              <option>Part Number (A-Z)</option>

            </select>

          </div>

        </div>

      </div>
    </section>
  );
}