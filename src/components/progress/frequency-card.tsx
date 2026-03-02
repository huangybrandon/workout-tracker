"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isToday,
  isFuture,
} from "date-fns";

interface FrequencyCardProps {
  workoutDates: Set<string>;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function FrequencyCard({ workoutDates }: FrequencyCardProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const workoutCountThisMonth = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    let count = 0;
    for (const dateStr of workoutDates) {
      const d = new Date(dateStr + "T00:00:00");
      if (d >= monthStart && d <= monthEnd) count++;
    }
    return count;
  }, [currentMonth, workoutDates]);

  const canGoNext = !isFuture(addMonths(startOfMonth(currentMonth), 1));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Workout Frequency</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[100px] text-center text-sm font-medium">
              {format(currentMonth, "MMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              disabled={canGoNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-[10px] font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}
          {calendarDays.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, currentMonth);
            const hasWorkout = inMonth && workoutDates.has(dateStr);
            const today = isToday(day);

            return (
              <div
                key={dateStr}
                className="flex flex-col items-center justify-center py-0.5"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    !inMonth
                      ? "text-muted-foreground/30"
                      : today
                        ? "font-semibold ring-1 ring-primary"
                        : "text-foreground"
                  }`}
                >
                  {format(day, "d")}
                </span>
                <span
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                    hasWorkout ? "bg-primary" : "bg-transparent"
                  }`}
                />
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {workoutCountThisMonth}{" "}
          {workoutCountThisMonth === 1 ? "workout" : "workouts"} in{" "}
          {format(currentMonth, "MMMM")}
        </p>
      </CardContent>
    </Card>
  );
}
