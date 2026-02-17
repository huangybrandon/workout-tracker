"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { ExerciseProgressChart } from "@/components/charts/exercise-progress-chart";
import { WeeklyVolumeChart } from "@/components/charts/weekly-volume-chart";
import { PrCard } from "@/components/progress/pr-card";
import { FrequencyCard } from "@/components/progress/frequency-card";
import { ExerciseGrid } from "@/components/progress/exercise-grid";
import {
  transformProgressData,
  computePersonalRecords,
  computeWeeklyVolume,
  computeExerciseSummaries,
  computeWorkoutFrequency,
  type ChartDataPoint,
  type SetWithExercise,
  type PersonalRecord,
  type WeeklyVolume,
  type ExerciseSummary,
} from "@/lib/utils/chart-data";

type Metric = "maxWeight" | "totalVolume" | "maxTime" | "totalTime";

export default function ProgressPage() {
  const [allSets, setAllSets] = useState<SetWithExercise[]>([]);
  const [loading, setLoading] = useState(true);

  // Dashboard data
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [weeklyVolume, setWeeklyVolume] = useState<WeeklyVolume[]>([]);
  const [frequency, setFrequency] = useState<{
    thisWeek: number;
    byWeek: { week: string; count: number }[];
  }>({ thisWeek: 0, byWeek: [] });
  const [exerciseSummaries, setExerciseSummaries] = useState<
    ExerciseSummary[]
  >([]);

  // Detail view state
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
    null
  );
  const [detailData, setDetailData] = useState<ChartDataPoint[]>([]);
  const [metric, setMetric] = useState<Metric>("maxWeight");

  const supabase = createClient();

  useEffect(() => {
    async function fetchAllData() {
      setLoading(true);
      const { data, error } = await supabase
        .from("workout_sets")
        .select(
          `
          weight,
          reps,
          exercise_id,
          workouts!inner(date),
          exercises!inner(name, mode)
        `
        )
        .order("created_at", { ascending: true });

      if (error) {
        toast.error("Failed to load progress data");
        setLoading(false);
        return;
      }

      const sets: SetWithExercise[] = (data || []).map((s: any) => ({
        date: s.workouts.date,
        weight: Number(s.weight),
        reps: s.reps,
        exercise_id: s.exercise_id,
        exercise_name: s.exercises.name,
        exercise_mode: s.exercises.mode ?? "weight",
      }));

      setAllSets(sets);
      setPrs(computePersonalRecords(sets));
      setWeeklyVolume(computeWeeklyVolume(sets));
      setFrequency(computeWorkoutFrequency(sets));
      setExerciseSummaries(computeExerciseSummaries(sets));
      setLoading(false);
    }

    fetchAllData();
  }, []);

  function selectExercise(exerciseId: string) {
    setSelectedExerciseId(exerciseId);

    const exerciseSets = allSets.filter((s) => s.exercise_id === exerciseId);
    const mode = exerciseSets[0]?.exercise_mode ?? "weight";
    setMetric(mode === "time" ? "maxTime" : "maxWeight");

    const transformed = transformProgressData(
      exerciseSets.map((s) => ({
        date: s.date,
        weight: s.weight,
        reps: s.reps,
      }))
    );
    setDetailData(transformed);
  }

  function goBack() {
    setSelectedExerciseId(null);
    setDetailData([]);
  }

  const selectedSummary = exerciseSummaries.find(
    (e) => e.exerciseId === selectedExerciseId
  );
  const exerciseMode = selectedSummary?.exerciseMode ?? "weight";

  const metricLabel: Record<Metric, string> = {
    maxWeight: "Max Weight",
    totalVolume: "Total Volume",
    maxTime: "Max Time",
    totalTime: "Total Time",
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Progress</h1>
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  // Exercise detail view
  if (selectedExerciseId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={goBack} className="-ml-2">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>

        <h2 className="text-xl font-bold">{selectedSummary?.exerciseName}</h2>

        <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
          <TabsList className="w-full">
            {exerciseMode === "time" ? (
              <>
                <TabsTrigger value="maxTime" className="flex-1">
                  Max Time
                </TabsTrigger>
                <TabsTrigger value="totalTime" className="flex-1">
                  Total Time
                </TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="maxWeight" className="flex-1">
                  Max Weight
                </TabsTrigger>
                <TabsTrigger value="totalVolume" className="flex-1">
                  Total Volume
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </Tabs>

        {detailData.length > 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {selectedSummary?.exerciseName} - {metricLabel[metric]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExerciseProgressChart data={detailData} metric={metric} />
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center py-12 text-center">
            <TrendingUp className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No data for this exercise yet.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Dashboard view
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Progress</h1>

      <PrCard records={prs} />

      <FrequencyCard thisWeek={frequency.thisWeek} byWeek={frequency.byWeek} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Total Volume - Last 12 Weeks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyVolume.some((w) => w.volume > 0) ? (
            <WeeklyVolumeChart data={weeklyVolume} />
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No volume data yet
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Your Exercises</h2>
        <ExerciseGrid
          exercises={exerciseSummaries}
          onSelect={selectExercise}
        />
      </div>
    </div>
  );
}
