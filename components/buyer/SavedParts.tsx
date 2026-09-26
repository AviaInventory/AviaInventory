"use client";

import Link from "next/link";
import { Bookmark, Package } from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

interface SavedPart {
  id: string;
  part_id: string;
  part_number: string;
  manufacturer: string;
  description: string | null;
  image_urls: string[];
}

export default function SavedParts() {
  const [savedParts, setSavedParts] = useState<SavedPart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSavedParts() {
      try {
        setLoading(true);

        /* =====================================================
           GET CURRENT USER
        ===================================================== */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error(
            "Unable to get current user:",
            userError
          );

          return;
        }

        /* =====================================================
           GET SAVED PART RECORDS
        ===================================================== */

        const {
          data: savedData,
          error: savedError,
        } = await supabase
          .from("saved_parts")
          .select(`
            id,
            part_id,
            created_at
          `)
          .eq("buyer_id", user.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(5);

        if (savedError) {
          console.error(
            "Unable to load saved parts:",
            savedError
          );

          return;
        }

        if (!savedData || savedData.length === 0) {
          setSavedParts([]);
          return;
        }

        /* =====================================================
           GET PART IDs
        ===================================================== */

        const partIds = savedData.map(
          (saved) => saved.part_id
        );

        /* =====================================================
           GET PART DETAILS
        ===================================================== */

        const {
          data: partsData,
          error: partsError,
        } = await supabase
          .from("parts")
          .select(`
            id,
            part_number,
            manufacturer,
            description,
            image_urls
          `)
          .in("id", partIds);

        if (partsError) {
          console.error(
            "Unable to load saved part details:",
            partsError
          );

          return;
        }

        /* =====================================================
           COMBINE SAVED PARTS WITH PART DETAILS
        ===================================================== */

        const partsMap = new Map(
          (partsData ?? []).map((part) => [
            part.id,
            part,
          ])
        );

        const results: SavedPart[] = savedData
          .map((saved) => {
            const part = partsMap.get(
              saved.part_id
            );

            if (!part) return null;

            return {
              id: saved.id,
              part_id: saved.part_id,
              part_number:
                part.part_number,
              manufacturer:
                part.manufacturer,
              description:
                part.description,
              image_urls:
                part.image_urls ?? [],
            };
          })
          .filter(
            (part): part is SavedPart =>
              part !== null
          );

        setSavedParts(results);
      } catch (error) {
        console.error(
          "Saved parts error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadSavedParts();
  }, []);

  return (
    <section className="rounded-2xl border border-aviation-border bg-white p-6 shadow-sm">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-xl font-bold text-aviation-primary">
            Saved Parts
          </h2>

          <p className="mt-1 text-sm text-aviation-muted">
            Parts you have saved for future reference.
          </p>
        </div>

        <Link
          href="/marketplace"
          className="text-sm font-semibold text-aviation-primary hover:underline"
        >
          View All
        </Link>

      </div>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (
        <div className="mt-6 space-y-3">

          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-xl bg-aviation-light p-4"
            >
              <div className="h-4 w-1/3 rounded bg-aviation-light" />

              <div className="mt-3 h-3 w-2/3 rounded bg-aviation-light" />

              <div className="mt-3 h-3 w-1/4 rounded bg-aviation-light" />
            </div>
          ))}

        </div>
      )}

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {!loading && savedParts.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-aviation-border p-10 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-aviation-success-soft">
            <Bookmark
              size={22}
              className="text-aviation-primary"
            />
          </div>

          <h3 className="mt-4 font-semibold text-aviation-dark">
            No Saved Parts
          </h3>

          <p className="mt-2 text-sm text-aviation-muted">
            Parts you save while browsing the marketplace will appear here.
          </p>

          <Link
            href="/marketplace"
            className="mt-5 inline-flex rounded-lg bg-aviation-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-aviation-primary"
          >
            Browse Parts
          </Link>

        </div>
      )}

      {/* =====================================================
          SAVED PARTS
      ===================================================== */}

      {!loading && savedParts.length > 0 && (
        <div className="mt-6 space-y-3">

          {savedParts.map((part) => (
            <Link
              key={part.id}
              href={`/buyer/parts/${part.part_id}`}
              className="flex items-center gap-4 rounded-xl border border-aviation-border p-4 transition hover:bg-aviation-light"
            >

              {/* IMAGE */}

              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-aviation-light">

                {part.image_urls?.length > 0 ? (
                  <img
                    src={part.image_urls[0]}
                    alt={part.part_number}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package
                    size={24}
                    className="text-aviation-muted"
                  />
                )}

              </div>

              {/* PART INFORMATION */}

              <div className="min-w-0 flex-1">

                <h3 className="truncate font-semibold text-aviation-dark">
                  {part.part_number}
                </h3>

                <p className="mt-1 truncate text-sm text-aviation-muted">
                  {part.manufacturer || "Unknown manufacturer"}
                </p>

                {part.description && (
                  <p className="mt-1 truncate text-xs text-aviation-muted">
                    {part.description}
                  </p>
                )}

              </div>

              {/* ARROW */}

              <span className="shrink-0 text-aviation-muted">
                →
              </span>

            </Link>
          ))}

        </div>
      )}

    </section>
  );
}