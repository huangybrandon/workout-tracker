import { format } from "date-fns";

interface SetWithDate {
  date: string;
  weight: number;
  reps: number;
}

export interface ChartDataPoint {
  date: string;
  label: string;
  maxWeight: number;
  totalVolume: number;
}

export function transformProgressData(sets: SetWithDate[]): ChartDataPoint[] {
  // Group sets by date
  const byDate: Record<string, SetWithDate[]> = {};
  for (const set of sets) {
    if (!byDate[set.date]) {
      byDate[set.date] = [];
    }
    byDate[set.date].push(set);
  }

  // Transform to chart data points
  return Object.entries(byDate)
    .map(([date, dateSets]) => ({
      date,
      label: format(new Date(date + "T00:00:00"), "MMM d"),
      maxWeight: Math.max(...dateSets.map((s) => Number(s.weight))),
      totalVolume: dateSets.reduce(
        (sum, s) => sum + Number(s.weight) * s.reps,
        0
      ),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
