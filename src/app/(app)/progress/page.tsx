"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { ExerciseProgressChart } from "@/components/charts/exercise-progress-chart";
import {
  transformProgressData,
  type ChartDataPoint,
} from "@/lib/utils/chart-data";
import type { Exercise, ExerciseWithTags } from "@/lib/types";
import { normalizeExerciseTags } from "@/lib/types";

type Metric = "maxWeight" | "totalVolume" | "maxTime" | "totalTime";

export default function ProgressPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [metric, setMetric] = useState<Metric>("maxWeight");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchExercises() {
      const { data } = await supabase
        .from("exercises")
        .select("*, exercise_tags(tags(*))")
        .order("name");
      setExercises(
        (data as unknown as ExerciseWithTags[])?.map(normalizeExerciseTags) || []
      );
    }
    fetchExercises();
  }, []);

  const selectedExercise = exercises.find((e) => e.id === selectedExerciseId);
  const exerciseMode = selectedExercise?.mode ?? "weight";

  useEffect(() => {
    if (selectedExerciseId) {
      setMetric(exerciseMode === "time" ? "maxTime" : "maxWeight");
      fetchProgressData(selectedExerciseId);
    }
  }, [selectedExerciseId]);

  async function fetchProgressData(exerciseId: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from("workout_sets")
      .select(
        `
        weight,
        reps,
        workouts!inner (
          date
        )
      `
      )
      .eq("exercise_id", exerciseId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load progress data");
      setLoading(false);
      return;
    }

    const sets = (data || []).map((s) => ({
      date: (s.workouts as unknown as { date: string }).date,
      weight: Number(s.weight),
      reps: s.reps,
    }));

    setChartData(transformProgressData(sets));
    setLoading(false);
  }

  const metricLabel: Record<Metric, string> = {
    maxWeight: "Max Weight",
    totalVolume: "Total Volume",
    maxTime: "Max Time",
    totalTime: "Total Time",
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Progress</h1>

      <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
        <SelectTrigger>
          <SelectValue placeholder="Select an exercise" />
        </SelectTrigger>
        <SelectContent>
          {exercises.map((exercise) => (
            <SelectItem key={exercise.id} value={exercise.id}>
              {exercise.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedExerciseId && (
        <Tabs
          value={metric}
          onValueChange={(v) => setMetric(v as Metric)}
        >
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
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      ) : selectedExerciseId && chartData.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {selectedExercise?.name} - {metricLabel[metric]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExerciseProgressChart data={chartData} metric={metric} />
          </CardContent>
        </Card>
      ) : selectedExerciseId && chartData.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <TrendingUp className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No data for this exercise yet. Log some workouts first!
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center py-12 text-center">
          <TrendingUp className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Select an exercise to view your progress
          </p>
        </div>
      )}
    </div>
  );
}
