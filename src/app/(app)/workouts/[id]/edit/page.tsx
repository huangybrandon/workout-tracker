"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { WorkoutForm } from "@/components/workout/workout-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { normalizeExerciseTags } from "@/lib/types";
import type { ExerciseBlock, Exercise, Tag } from "@/lib/types";

export default function EditWorkoutPage() {
  const params = useParams();
  const id = params.id as string;
  const [initialState, setInitialState] = useState<{
    name: string;
    date: Date;
    notes: string;
    exercises: ExerciseBlock[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadWorkout() {
      const { data: workout, error } = await supabase
        .from("workouts")
        .select(
          `
          *,
          workout_sets (
            *,
            exercises (
              *,
              exercise_tags (
                tags (*)
              )
            )
          )
        `
        )
        .eq("id", id)
        .single();

      if (error || !workout) {
        toast.error("Failed to load workout");
        setLoading(false);
        return;
      }

      // Group sets by exercise
      const exerciseMap: Record<string, ExerciseBlock> = {};
      for (const set of workout.workout_sets) {
        const exerciseId = set.exercises.id;
        if (!exerciseMap[exerciseId]) {
          const tags: Tag[] =
            set.exercises.exercise_tags?.map(
              (et: { tags: Tag }) => et.tags
            ) ?? [];
          const exercise: Exercise = {
            id: set.exercises.id,
            name: set.exercises.name,
            is_custom: set.exercises.is_custom,
            user_id: set.exercises.user_id,
            created_at: set.exercises.created_at,
            tags,
          };
          exerciseMap[exerciseId] = {
            exercise,
            sets: [],
          };
        }
        exerciseMap[exerciseId].sets.push({
          id: crypto.randomUUID(),
          reps: String(set.reps),
          weight: String(Number(set.weight)),
        });
      }

      // Sort sets within each exercise by set_number
      const sortedSets = workout.workout_sets.sort(
        (a: { set_number: number }, b: { set_number: number }) =>
          a.set_number - b.set_number
      );

      // Rebuild exercise blocks preserving order
      const seen = new Set<string>();
      const exercises: ExerciseBlock[] = [];
      for (const set of sortedSets) {
        const exerciseId = set.exercises.id;
        if (!seen.has(exerciseId)) {
          seen.add(exerciseId);
          exercises.push(exerciseMap[exerciseId]);
        }
      }

      setInitialState({
        name: workout.name,
        date: new Date(workout.date + "T00:00:00"),
        notes: workout.notes || "",
        exercises,
      });
      setLoading(false);
    }

    loadWorkout();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-10 animate-pulse rounded bg-muted" />
        <div className="h-10 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!initialState) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Workout not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/workouts/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Workout</h1>
      </div>
      <WorkoutForm initialState={initialState} workoutId={id} />
    </div>
  );
}
