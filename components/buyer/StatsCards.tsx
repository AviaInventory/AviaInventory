"use client";

import {
  FileText,
  Package,
  Heart,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

/* ==========================================================
   STAT CARD
========================================================== */

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  loading?: boolean;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  loading = false,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-aviation-border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">

        {/* TEXT */}

        <div>
          <p className="text-sm font-medium text-aviation-muted">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-bold text-aviation-dark">
            {loading ? "..." : value}
          </h2>

          <p className="mt-2 flex items-center gap-1 text-sm text-aviation-muted">
            <TrendingUp
              size={16}
              className="text-aviation-primary"
            />

            {subtitle}
          </p>
        </div>

        {/* ICON */}

        <div className="rounded-2xl bg-aviation-primary/10 p-4">
          <Icon
            size={30}
            className="text-aviation-primary"
          />
        </div>

      </div>
    </div>
  );
}

/* ==========================================================
   BUYER DASHBOARD STATS
========================================================== */

export default function StatsCards() {
  const [loading, setLoading] = useState(true);

  const [activeRFQs, setActiveRFQs] = useState(0);
  const [orders, setOrders] = useState(0);
  const [savedParts, setSavedParts] = useState(0);
  const [messages, setMessages] = useState(0);

  /* ========================================================
     LOAD DASHBOARD STATISTICS
  ======================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      try {
        setLoading(true);

        /* ==================================================
           CURRENT USER
        ================================================== */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            "Unable to get current user:",
            userError
          );

          return;
        }

        if (!user) {
          console.error(
            "No authenticated user found."
          );

          return;
        }

        console.log(
          "DASHBOARD USER:",
          user.id
        );

        /* ==================================================
           ACTIVE RFQs
           
           Current RFQ columns:
           
           id
           buyer_id
           supplier_id
           part_id
           quantity
           message
           status
           created_at
           
           Active:
           - Pending
           - Quoted
        ================================================== */

        const {
          count: rfqCount,
          error: rfqError,
        } = await supabase
          .from("rfqs")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("buyer_id", user.id)
          .in("status", [
            "Pending",
            "Quoted",
          ]);

        if (rfqError) {
          console.error(
            "Unable to load RFQ statistics:",
            rfqError
          );
        } else if (mounted) {
          setActiveRFQs(
            rfqCount ?? 0
          );
        }

        /* ==================================================
           SAVED PARTS
           
           Current table:
           public.saved_parts
           
           buyer_id identifies the buyer.
        ================================================== */

        const {
          count: savedPartsCount,
          error: savedPartsError,
        } = await supabase
          .from("saved_parts")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("buyer_id", user.id);

        if (savedPartsError) {
          console.error(
            "Unable to load saved parts statistics:",
            savedPartsError
          );
        } else if (mounted) {
          setSavedParts(
            savedPartsCount ?? 0
          );
        }

        /* ==================================================
           UNREAD MESSAGES
           
           Current messages table contains:
           
           id
           sender_id
           recipient_id
           ...
           
           We count messages received by this buyer
           that are not yet read.
        ================================================== */

        const {
          count: messageCount,
          error: messageError,
        } = await supabase
          .from("messages")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("recipient_id", user.id)
          .eq("is_read", false);

        if (messageError) {
          console.error(
            "Unable to load message statistics:",
            messageError
          );
        } else if (mounted) {
          setMessages(
            messageCount ?? 0
          );
        }

        /* ==================================================
           ORDERS
           
           IMPORTANT:
           
           There is currently NO "orders" table in the
           Supabase database.
           
           Current tables are:
           
           buyers
           messages
           notifications
           parts
           profiles
           quotes
           rfqs
           saved_parts
           suppliers
           
           Therefore we DO NOT query orders.
           
           Keep the value at 0 until we create the
           orders table.
        ================================================== */

        if (mounted) {
          setOrders(0);
        }

      } catch (error) {
        console.error(
          "Unable to load dashboard statistics:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  /* ==========================================================
     STATISTICS
  ========================================================== */

  const stats = [
    {
      title: "Active RFQs",
      value: activeRFQs,
      subtitle: "Currently active",
      icon: FileText,
    },

    {
      title: "Orders",
      value: orders,
      subtitle: "Orders will appear here",
      icon: Package,
    },

    {
      title: "Saved Parts",
      value: savedParts,
      subtitle: "Saved parts",
      icon: Heart,
    },

    {
      title: "Messages",
      value: messages,
      subtitle: "Unread conversations",
      icon: MessageSquare,
    },
  ];

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

      {stats.map((stat) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          subtitle={stat.subtitle}
          icon={stat.icon}
          loading={loading}
        />
      ))}

    </section>
  );
}