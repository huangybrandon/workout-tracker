import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkoutForm } from "@/components/workout/workout-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { ExerciseBlock, Exercise, Tag } from "@/lib/types";

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

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
    notFound();
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
        mode: set.exercises.mode || "weight",
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

  const initialState = {
    name: workout.name,
    date: new Date(workout.date + "T12:00:00Z"),
    notes: workout.notes || "",
    exercises,
  };

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
