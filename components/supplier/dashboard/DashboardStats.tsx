"use client";

import {
  ClipboardList,
  FileText,
  CheckCircle2,
  DollarSign,
} from "lucide-react";

interface Props {
  openRFQs: number;
  pendingQuotes: number;
  acceptedQuotes: number;
  revenue: number;
  currency?: string;
}

export default function DashboardStats({
  openRFQs,
  pendingQuotes,
  acceptedQuotes,
  revenue,
  currency = "USD",
}: Props) {
  const cards = [
    {
      title: "Open RFQs",
      value: openRFQs.toLocaleString(),
      icon: ClipboardList,
      color: "text-aviation-success",
      bg: "bg-aviation-success-soft",
    },
    {
      title: "Pending Quotes",
      value: pendingQuotes.toLocaleString(),
      icon: FileText,
      color: "text-aviation-warning",
      bg: "bg-aviation-warning-soft",
    },
    {
      title: "Accepted Quotes",
      value: acceptedQuotes.toLocaleString(),
      icon: CheckCircle2,
      color: "text-aviation-success",
      bg: "bg-aviation-success-soft",
    },
    {
      title: "Revenue",
      value: `${currency} ${revenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-aviation-success",
      bg: "bg-aviation-success-soft",
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-aviation-muted">
                  {card.title}
                </p>

                <h2 className="mt-2 text-3xl font-bold text-aviation-primary">
                  {card.value}
                </h2>
              </div>

              <div
                className={`rounded-xl p-3 ${card.bg}`}
              >
                <Icon
                  className={`h-7 w-7 ${card.color}`}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}