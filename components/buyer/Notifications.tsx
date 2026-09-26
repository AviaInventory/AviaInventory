"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

import { supabase } from "@/lib/supabase";

interface Notification {
  id: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadNotifications() {
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
           GET USER NOTIFICATIONS
        ===================================================== */

        const {
          data,
          error,
        } = await supabase
          .from("notifications")
          .select(`
            id,
            title,
            message,
            is_read,
            created_at
          `)
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(5);

        if (error) {
          console.error(
            "Unable to load notifications:",
            error
          );

          return;
        }

        if (mounted) {
          setNotifications(
            (data ?? []) as Notification[]
          );
        }
      } catch (error) {
        console.error(
          "Notifications error:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, []);

  /* ==========================================================
     FORMAT DATE
  ========================================================== */

  function formatDate(
    value: string
  ) {
    return new Date(value).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-start justify-between gap-4">

        <div className="flex items-start gap-3">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-aviation-success-soft">
            <Bell
              size={22}
              className="text-aviation-primary"
            />
          </div>

          <div>
            <h2 className="text-xl font-bold text-aviation-primary">
              Notifications
            </h2>

            <p className="mt-1 text-sm text-aviation-muted">
              Your latest account and quotation updates.
            </p>
          </div>

        </div>

        <Link
          href="/buyer/dashboard"
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
              <div className="h-4 w-1/2 rounded bg-aviation-light" />

              <div className="mt-3 h-3 w-3/4 rounded bg-aviation-light" />

              <div className="mt-3 h-3 w-1/4 rounded bg-aviation-light" />
            </div>
          ))}

        </div>
      )}

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {!loading &&
        notifications.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-aviation-border p-8 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-aviation-success-soft">
              <Bell
                size={22}
                className="text-aviation-primary"
              />
            </div>

            <h3 className="mt-4 font-semibold text-aviation-dark">
              No Notifications Yet
            </h3>

            <p className="mt-2 text-sm text-aviation-muted">
              New RFQs, quotations and account
              updates will appear here.
            </p>

          </div>
        )}

      {/* =====================================================
          NOTIFICATIONS
      ===================================================== */}

      {!loading &&
        notifications.length > 0 && (
          <div className="mt-6 divide-y divide-gray-100">

            {notifications.map(
              (notification) => (
                <div
                  key={notification.id}
                  className={`py-4 ${
                    !notification.is_read
                      ? "bg-aviation-success-soft/40"
                      : ""
                  }`}
                >

                  <div className="flex items-start gap-3">

                    <div
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        notification.is_read
                          ? "bg-aviation-light"
                          : "bg-aviation-success"
                      }`}
                    />

                    <div className="min-w-0 flex-1">

                      <div className="flex items-start justify-between gap-4">

                        <h3
                          className={`text-sm ${
                            notification.is_read
                              ? "font-medium text-aviation-dark"
                              : "font-bold text-aviation-dark"
                          }`}
                        >
                          {notification.title}
                        </h3>

                        <span className="shrink-0 text-xs text-aviation-muted">
                          {formatDate(
                            notification.created_at
                          )}
                        </span>

                      </div>

                      {notification.message && (
                        <p className="mt-1 text-sm leading-6 text-aviation-muted">
                          {notification.message}
                        </p>
                      )}

                    </div>

                  </div>

                </div>
              )
            )}

          </div>
        )}

    </section>
  );
}