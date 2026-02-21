"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FrequencyCardProps {
  thisWeek: number;
  byWeek: { week: string; label: string; count: number }[];
}

export function FrequencyCard({ thisWeek, byWeek }: FrequencyCardProps) {
  const maxCount = Math.max(...byWeek.map((w) => w.count), 1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Workout Frequency</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-2xl font-bold">
          {thisWeek}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            {thisWeek === 1 ? "workout" : "workouts"} this week
          </span>
        </p>
        <div className="relative">
          {hoveredIndex !== null && (
            <div
              className="pointer-events-none absolute -top-8 z-10 rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md border border-border"
              style={{
                left: `calc(${(hoveredIndex / byWeek.length) * 100}% + ${(1 / byWeek.length) * 50}%)`,
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
              }}
            >
              {byWeek[hoveredIndex].label}: {byWeek[hoveredIndex].count}{" "}
              {byWeek[hoveredIndex].count === 1 ? "workout" : "workouts"}
            </div>
          )}
          <div className="flex items-end gap-1" style={{ height: 40 }}>
            {byWeek.map((w, i) => (
              <div
                key={w.week}
                className="flex-1 cursor-pointer rounded-sm transition-opacity"
                style={{
                  height: w.count === 0 ? 2 : (w.count / maxCount) * 100 + "%",
                  minHeight: 2,
                  backgroundColor: `hsl(var(--primary) / ${hoveredIndex === i ? 1 : 0.8})`,
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Last 12 weeks</p>
      </CardContent>
    </Card>
  );
}
