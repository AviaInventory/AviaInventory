"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  Eye,
  Lock,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

interface Part {
  id: string;
  part_number: string;
  description: string;
  manufacturer: string;
  category: string;
  condition: string;
  quantity: number;
  unit_price: number;
  currency: string;
  image_urls: string[] | null;
  status: string;
}

export default function RecentlyAddedParts() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentlyAddedParts();
  }, []);

  async function loadRecentlyAddedParts() {
    try {
      const { data, error } = await supabase
        .from("parts")
        .select(`
          id,
          part_number,
          description,
          manufacturer,
          category,
          condition,
          quantity,
          unit_price,
          currency,
          image_urls,
          status
        `)
        .eq("status", "Published")
        .order("created_at", {
          ascending: false,
        })
        .limit(4);

      if (error) {
        console.error(
          "RECENTLY ADDED PARTS ERROR:",
          error
        );

        setParts([]);
        return;
      }

      console.log(
        "RECENTLY ADDED PARTS:",
        data
      );

      setParts(data || []);
    } catch (error) {
      console.error(
        "LOAD RECENTLY ADDED PARTS ERROR:",
        error
      );

      setParts([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6">

        {/* ====================================================== */}
        {/* HEADER */}
        {/* ====================================================== */}

        <div className="mb-12 flex items-center justify-between">

          <div>
            <h2 className="text-4xl font-bold text-aviation-primary">
              Recently Added Parts
            </h2>

            <p className="mt-3 text-aviation-muted">
              New listings from verified aviation suppliers.
            </p>
          </div>

          <Link
            href="/marketplace"
            className="hidden items-center gap-2 rounded-xl border px-5 py-3 transition hover:bg-white md:flex"
          >
            Browse Marketplace
            <ArrowRight size={18} />
          </Link>

        </div>

        {/* ====================================================== */}
        {/* LOADING */}
        {/* ====================================================== */}

        {loading && (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">

            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-aviation-border bg-white shadow-sm"
              >
                <div className="aspect-video animate-pulse bg-aviation-light" />

                <div className="space-y-4 p-6">

                  <div className="h-4 w-1/3 animate-pulse rounded bg-aviation-light" />

                  <div className="h-6 w-3/4 animate-pulse rounded bg-aviation-light" />

                  <div className="h-4 w-full animate-pulse rounded bg-aviation-light" />

                  <div className="h-10 w-full animate-pulse rounded bg-aviation-light" />

                </div>
              </div>
            ))}

          </div>
        )}

        {/* ====================================================== */}
        {/* NO PARTS */}
        {/* ====================================================== */}

        {!loading && parts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-aviation-border bg-aviation-light p-12 text-center">

            <h3 className="text-xl font-semibold text-aviation-dark">
              No recently added parts
            </h3>

            <p className="mt-2 text-aviation-muted">
              New aviation parts will appear here once suppliers publish their listings.
            </p>

            <Link
              href="/marketplace"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white transition hover:bg-aviation-primary"
            >
              Browse Marketplace
              <ArrowRight size={18} />
            </Link>

          </div>
        )}

        {/* ====================================================== */}
        {/* PARTS GRID */}
        {/* ====================================================== */}

        {!loading && parts.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">

            {parts.map((part) => {

              const imageUrl =
                part.image_urls &&
                part.image_urls.length > 0
                  ? part.image_urls[0]
                  : null;

              return (
                <div
                  key={part.id}
                  className="group overflow-hidden rounded-2xl border border-aviation-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-aviation-border hover:shadow-xl"
                >

                  {/* ================================================== */}
                  {/* IMAGE */}
                  {/* ================================================== */}

                  <Link
                    href={`/marketplace/${part.id}`}
                    className="block"
                  >

                    <div className="relative aspect-video overflow-hidden bg-aviation-light">

                      {imageUrl ? (

                        <Image
                          src={imageUrl}
                          alt={part.part_number}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                          unoptimized
                          className="object-contain transition duration-500 group-hover:scale-105"
                        />

                      ) : (

                        <div className="flex h-full items-center justify-center text-sm text-aviation-muted">
                          No Image Available
                        </div>

                      )}

                      {/* CONDITION */}

                      {part.condition && (
                        <span className="absolute left-4 top-4 rounded-full bg-aviation-primary px-3 py-1 text-xs font-semibold text-white">
                          {part.condition}
                        </span>
                      )}

                    </div>

                  </Link>

                  {/* ================================================== */}
                  {/* CONTENT */}
                  {/* ================================================== */}

                  <div className="p-6">

                    {/* PART NUMBER */}

                    <p className="text-sm font-semibold text-aviation-primary">
                      {part.part_number}
                    </p>

                    {/* DESCRIPTION */}

                    <h3 className="mt-2 line-clamp-2 text-xl font-bold text-aviation-dark">
                      {part.description}
                    </h3>

                    {/* ================================================== */}
                    {/* PART INFORMATION */}
                    {/* ================================================== */}

                    <div className="mt-5 space-y-2 text-sm">

                      <div className="flex justify-between gap-4">

                        <span className="text-aviation-muted">
                          Manufacturer
                        </span>

                        <span className="text-right font-medium">
                          {part.manufacturer || "-"}
                        </span>

                      </div>

                      <div className="flex justify-between gap-4">

                        <span className="text-aviation-muted">
                          Category
                        </span>

                        <span className="text-right font-medium">
                          {part.category || "-"}
                        </span>

                      </div>

                      <div className="flex justify-between gap-4">

                        <span className="text-aviation-muted">
                          Quantity
                        </span>

                        <span className="font-semibold text-aviation-primary">
                          {part.quantity}
                        </span>

                      </div>

                    </div>

                    {/* ================================================== */}
                    {/* LOCKED INFORMATION */}
                    {/* ================================================== */}

                    <div className="mt-6 rounded-xl bg-aviation-light p-4">

                      <div className="flex items-start gap-2 text-aviation-primary">

                        <Lock
                          size={16}
                          className="mt-0.5 shrink-0"
                        />

                        <span className="text-sm font-medium">
                          Login to view supplier details, stock and pricing
                        </span>

                      </div>

                    </div>

                    {/* ================================================== */}
                    {/* ACTIONS */}
                    {/* ================================================== */}

                    <div className="mt-6 flex gap-3">

                      {/* VIEW DETAILS */}

                      <Link
                        href={`/marketplace/${part.id}`}
                        className="flex flex-1 items-center justify-center rounded-xl bg-aviation-primary py-3 font-semibold text-white transition hover:bg-aviation-primary"
                      >
                        View Details
                      </Link>

                      {/* VIEW */}

                      <Link
                        href={`/marketplace/${part.id}`}
                        aria-label={`View ${part.part_number}`}
                        className="rounded-xl border p-3 transition hover:bg-aviation-light"
                      >
                        <Eye size={20} />
                      </Link>

                      {/* BOOKMARK */}

                      <button
                        type="button"
                        aria-label={`Bookmark ${part.part_number}`}
                        className="rounded-xl border p-3 transition hover:bg-aviation-light"
                      >
                        <Bookmark size={20} />
                      </button>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

        {/* ====================================================== */}
        {/* MOBILE MARKETPLACE BUTTON */}
        {/* ====================================================== */}

        {!loading && parts.length > 0 && (
          <div className="mt-8 md:hidden">

            <Link
              href="/marketplace"
              className="flex items-center justify-center gap-2 rounded-xl border px-5 py-3 font-semibold transition hover:bg-white"
            >
              Browse Marketplace
              <ArrowRight size={18} />
            </Link>

          </div>
        )}

      </div>
    </section>
  );
}