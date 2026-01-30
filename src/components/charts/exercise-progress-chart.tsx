"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint } from "@/lib/utils/chart-data";

type Metric = "maxWeight" | "totalVolume" | "maxTime" | "totalTime";

interface ExerciseProgressChartProps {
  data: ChartDataPoint[];
  metric: Metric;
}

const metricLabels: Record<Metric, string> = {
  maxWeight: "Max Weight",
  totalVolume: "Total Volume",
  maxTime: "Max Time",
  totalTime: "Total Time",
};

export function ExerciseProgressChart({
  data,
  metric,
}: ExerciseProgressChartProps) {
  if (data.length === 0) return null;

  const label = metricLabels[metric];
  const unit = metric === "maxTime" || metric === "totalTime" ? "sec" : "lbs";

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          width={50}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
          }}
          formatter={(value) => [
            `${Number(value).toLocaleString()} ${unit}`,
            label,
          ]}
          labelFormatter={(l) => String(l)}
        />
        <Line
          type="monotone"
          dataKey={metric}
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          dot={{ r: 4, fill: "hsl(var(--chart-1))" }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
