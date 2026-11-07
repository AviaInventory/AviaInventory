"use client";

import { Download } from "lucide-react";
import type { MarketIntelligence } from "@/lib/market-intelligence";

const cell = (value: unknown) => {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Downloads every table on the page as one CSV file, built in the browser. */
export default function ExportIntelligenceCsv({ data }: { data: MarketIntelligence }) {
  function download() {
    const lines: string[] = [];
    const section = (title: string, header: string[], rows: unknown[][]) => {
      lines.push(cell(title), header.map(cell).join(","), ...rows.map((row) => row.map(cell).join(",")), "");
    };
    const s = data.summary;
    section(`AviaInventory market intelligence — last ${data.period_days} days (generated ${data.generated_at})`, ["Measure", "Value"], [
      ["RFQs", s.rfqs], ["RFQs, previous period", s.rfqs_previous], ["Parts RFQs", s.parts_rfqs], ["MRO RFQs", s.mro_rfqs],
      ["Quotes", s.quotes], ["Quotes per RFQ", s.quotes_per_rfq], ["Median hours to first quote", s.median_first_quote_hours], ["Active buyers", s.buyers ?? "fewer than 3"],
    ]);
    section("Most requested part numbers", ["Part number", "Category", "RFQs", "Quantity", "Buyers"], data.top_parts.map((p) => [p.part_number, p.category, p.rfqs, p.quantity, p.buyers ?? "fewer than 3"]));
    section("Demand by category", ["Category", "RFQs", "RFQs, previous period"], data.categories.map((c) => [c.category, c.rfqs, c.rfqs_previous]));
    section("Demand by buyer country", ["Country", "RFQs"], data.countries.map((c) => [c.country, c.rfqs]));
    section("Quoted price ranges", ["Part number", "Currency", "Suppliers", "Quotes", "Low", "Median", "High"], data.price_ranges.map((p) => [p.part_number, p.currency, p.suppliers, p.quotes, p.low, p.median, p.high]));
    section("Repair / overhaul demand", ["Category", "RFQs"], data.mro_demand.map((m) => [m.category, m.rfqs]));
    const me = data.my_performance;
    section("Your performance", ["Measure", "Value"], [
      ["RFQs open to you", me.rfqs_available], ["RFQs you quoted", me.rfqs_quoted], ["Quotes sent", me.quotes], ["Quotes won", me.quotes_won],
      ["Your median response (hours)", me.median_response_hours], ["Market median response (hours)", me.market_median_response_hours],
      ["Your price vs market median (%)", me.price_vs_median_pct],
    ]);

    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aviainventory-market-intelligence-${data.period_days}d.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" onClick={download} className="inline-flex h-9 items-center gap-2 rounded-lg border border-aviation-border bg-white px-3 text-sm font-semibold text-aviation-dark hover:border-aviation-primary">
      <Download size={15} /> Export CSV
    </button>
  );
}
