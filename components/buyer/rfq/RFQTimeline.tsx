"use client";

import type { RFQ } from "@/lib/rfqs";
import { formatDate } from "@/lib/rfqs";

interface Props {
  rfq: RFQ;
}

interface TimelineItem {
  title: string;
  description: string;
  date?: string | null;
  completed: boolean;
  current?: boolean;
}

export default function RFQTimeline({
  rfq,
}: Props) {
  const timeline: TimelineItem[] = [
    {
      title: "RFQ Created",
      description:
        "The Request for Quotation was submitted by the buyer.",
      date: rfq.created_at,
      completed: true,
    },
    {
      title: "RFQ Sent to Suppliers",
      description:
        rfq.distribution_method === "broadcast"
          ? "The RFQ was distributed to all qualified suppliers."
          : "The RFQ was sent to the selected suppliers.",
      date: rfq.created_at,
      completed: true,
    },
    {
      title: "Quotations Received",
      description:
        "Suppliers can review the RFQ and submit their quotations.",
      completed:
        rfq.status === "Quoted" ||
        rfq.status === "Accepted" ||
        rfq.status === "Closed",
      current:
        rfq.status === "Pending",
    },
    {
      title: "Quotation Accepted",
      description:
        "A supplier quotation has been accepted by the buyer.",
      completed: rfq.status === "Accepted",
      current: false,
    },
    {
      title: "RFQ Closed",
      description:
        "The RFQ has been completed and closed.",
      completed: rfq.status === "Closed",
      current: false,
    },
  ];

  if (rfq.status === "Cancelled") {
    timeline.push({
      title: "RFQ Cancelled",
      description:
        "This RFQ was cancelled by the buyer.",
      date: rfq.created_at,
      completed: true,
      current: true,
    });
  }

  return (
    <div className="relative">
      <div className="space-y-8">
        {timeline.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="relative flex gap-5"
          >
            {/* Connecting Line */}

            {index < timeline.length - 1 && (
              <div className="absolute left-[15px] top-9 h-[calc(100%+2rem)] w-px bg-aviation-light" />
            )}

            {/* Status Circle */}

            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                  item.completed
                    ? "border-aviation-border bg-aviation-primary text-white"
                    : item.current
                    ? "border-aviation-border bg-white text-aviation-primary"
                    : "border-aviation-border bg-white text-aviation-muted"
                }`}
              >
                {item.completed ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m5 12 4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-current" />
                )}
              </div>
            </div>

            {/* Content */}

            <div className="min-w-0 flex-1 pb-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h3
                  className={`font-semibold ${
                    item.completed || item.current
                      ? "text-aviation-dark"
                      : "text-aviation-muted"
                  }`}
                >
                  {item.title}
                </h3>

                {item.date && (
                  <span className="text-sm text-aviation-muted">
                    {formatDate(item.date)}
                  </span>
                )}
              </div>

              <p
                className={`mt-2 text-sm leading-6 ${
                  item.completed || item.current
                    ? "text-aviation-muted"
                    : "text-aviation-muted"
                }`}
              >
                {item.description}
              </p>

              {item.current && (
                <span className="mt-3 inline-flex rounded-full bg-aviation-success-soft px-3 py-1 text-xs font-semibold text-aviation-primary">
                  Current Stage
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}