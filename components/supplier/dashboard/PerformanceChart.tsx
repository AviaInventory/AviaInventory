"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface PerformanceData {
  month: string;
  quotations: number;
  accepted: number;
  revenue: number;
}

interface Props {
  data: PerformanceData[];
}

export default function PerformanceChart({
  data,
}: Props) {
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-xl font-bold text-aviation-primary">
          Performance Overview
        </h2>

        <p className="mt-1 text-sm text-aviation-muted">
          Quotations, accepted quotes and revenue over time
        </p>

      </div>

      <div className="aviation-chart-mobile h-[280px] sm:h-[340px] lg:h-[400px]">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <LineChart data={data}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="month" />

            <YAxis />

            <Tooltip />

            <Legend />

            <Line
              type="monotone"
              dataKey="quotations"
              stroke="#2563eb"
              strokeWidth={3}
              name="Submitted Quotes"
            />

            <Line
              type="monotone"
              dataKey="accepted"
              stroke="#16a34a"
              strokeWidth={3}
              name="Accepted Quotes"
            />

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#f59e0b"
              strokeWidth={3}
              name="Revenue"
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </section>
  );
}