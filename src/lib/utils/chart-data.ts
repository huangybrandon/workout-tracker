import { format, startOfWeek, subWeeks } from "date-fns";

interface SetWithDate {
  date: string;
  weight: number;
  reps: number;
}

export interface SetWithExercise {
  date: string;
  weight: number;
  reps: number;
  exercise_id: string;
  exercise_name: string;
  exercise_mode: "weight" | "time";
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  value: number;
  unit: string;
  date: string;
}

export interface WeeklyVolume {
  week: string;
  label: string;
  volume: number;
}

export interface SparklinePoint {
  value: number;
}

export interface ExerciseSummary {
  exerciseId: string;
  exerciseName: string;
  exerciseMode: "weight" | "time";
  latestValue: number;
  unit: string;
  sparkline: number[];
  lastUsedDate: string;
}

export interface ChartDataPoint {
  date: string;
  label: string;
  maxWeight: number;
  totalVolume: number;
  maxTime: number;
  totalTime: number;
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
      maxTime: Math.max(...dateSets.map((s) => s.reps)),
      totalTime: dateSets.reduce((sum, s) => sum + s.reps, 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function computePersonalRecords(
  allSets: SetWithExercise[],
  days: number = 30
): PersonalRecord[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  // Group by exercise
  const byExercise: Record<string, SetWithExercise[]> = {};
  for (const s of allSets) {
    if (!byExercise[s.exercise_id]) byExercise[s.exercise_id] = [];
    byExercise[s.exercise_id].push(s);
  }

  const prs: PersonalRecord[] = [];
  for (const [exerciseId, sets] of Object.entries(byExercise)) {
    const first = sets[0];
    const isTime = first.exercise_mode === "time";
    const getValue = (s: SetWithExercise) => (isTime ? s.reps : s.weight);

    const allTimeMax = Math.max(...sets.map(getValue));
    const recentSets = sets.filter((s) => s.date >= cutoffStr);
    if (recentSets.length === 0) continue;

    const recentMax = Math.max(...recentSets.map(getValue));
    if (recentMax >= allTimeMax && recentMax > 0) {
      // Find the date of the PR
      const prSet = recentSets.find((s) => getValue(s) === recentMax)!;
      prs.push({
        exerciseId,
        exerciseName: first.exercise_name,
        value: recentMax,
        unit: isTime ? "sec" : "lbs",
        date: prSet.date,
      });
    }
  }

  return prs.sort((a, b) => b.date.localeCompare(a.date));
}

export function computeWeeklyVolume(
  allSets: SetWithExercise[],
  weeks: number = 12
): WeeklyVolume[] {
  const now = new Date();
  const start = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), weeks - 1);
  const startStr = format(start, "yyyy-MM-dd");

  const recentSets = allSets.filter(
    (s) => s.date >= startStr && s.exercise_mode === "weight"
  );

  // Group by ISO week start
  const byWeek: Record<string, number> = {};
  for (const s of recentSets) {
    const d = new Date(s.date + "T00:00:00");
    const weekStart = startOfWeek(d, { weekStartsOn: 1 });
    const key = format(weekStart, "yyyy-MM-dd");
    byWeek[key] = (byWeek[key] || 0) + s.weight * s.reps;
  }

  // Build array for all weeks (including zero-volume weeks)
  const result: WeeklyVolume[] = [];
  for (let i = 0; i < weeks; i++) {
    const weekStart = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), weeks - 1 - i);
    const key = format(weekStart, "yyyy-MM-dd");
    result.push({
      week: key,
      label: format(weekStart, "MMM d"),
      volume: Math.round(byWeek[key] || 0),
    });
  }

  return result;
}

export function computeExerciseSummaries(
  allSets: SetWithExercise[]
): ExerciseSummary[] {
  // Group by exercise
  const byExercise: Record<string, SetWithExercise[]> = {};
  for (const s of allSets) {
    if (!byExercise[s.exercise_id]) byExercise[s.exercise_id] = [];
    byExercise[s.exercise_id].push(s);
  }

  const summaries: ExerciseSummary[] = [];
  for (const [exerciseId, sets] of Object.entries(byExercise)) {
    const first = sets[0];
    const isTime = first.exercise_mode === "time";
    const getValue = (s: SetWithExercise) => (isTime ? s.reps : s.weight);

    // Group by date, get max per date
    const byDate: Record<string, number> = {};
    for (const s of sets) {
      const v = getValue(s);
      byDate[s.date] = Math.max(byDate[s.date] || 0, v);
    }

    const sortedDates = Object.keys(byDate).sort();
    const lastDate = sortedDates[sortedDates.length - 1];
    const last10 = sortedDates.slice(-10);
    const sparkline = last10.map((d) => byDate[d]);

    summaries.push({
      exerciseId,
      exerciseName: first.exercise_name,
      exerciseMode: first.exercise_mode,
      latestValue: byDate[lastDate],
      unit: isTime ? "sec" : "lbs",
      sparkline,
      lastUsedDate: lastDate,
    });
  }

  // Sort by most recently used
  return summaries.sort((a, b) => b.lastUsedDate.localeCompare(a.lastUsedDate));
}

export function computeWorkoutFrequency(
  allSets: SetWithExercise[],
  weeks: number = 12
): { thisWeek: number; byWeek: { week: string; count: number }[] } {
  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const start = subWeeks(currentWeekStart, weeks - 1);
  const startStr = format(start, "yyyy-MM-dd");

  // Get unique workout dates
  const dates = [...new Set(allSets.filter((s) => s.date >= startStr).map((s) => s.date))];

  // Group by week
  const byWeek: Record<string, Set<string>> = {};
  for (const date of dates) {
    const d = new Date(date + "T00:00:00");
    const weekStart = startOfWeek(d, { weekStartsOn: 1 });
    const key = format(weekStart, "yyyy-MM-dd");
    if (!byWeek[key]) byWeek[key] = new Set();
    byWeek[key].add(date);
  }

  const thisWeekKey = format(currentWeekStart, "yyyy-MM-dd");
  const thisWeek = byWeek[thisWeekKey]?.size || 0;

  const weeklyData: { week: string; count: number }[] = [];
  for (let i = 0; i < weeks; i++) {
    const weekStart = subWeeks(currentWeekStart, weeks - 1 - i);
    const key = format(weekStart, "yyyy-MM-dd");
    weeklyData.push({ week: key, count: byWeek[key]?.size || 0 });
  }

  return { thisWeek, byWeek: weeklyData };
}
