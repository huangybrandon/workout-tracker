import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TemplateForm } from "@/components/template/template-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Exercise, Tag } from "@/lib/types";

interface NewTemplatePageProps {
  searchParams: Promise<{ workoutId?: string }>;
}

export default async function NewTemplatePage({
  searchParams,
}: NewTemplatePageProps) {
  const { workoutId } = await searchParams;

  let initialExercises: Exercise[] = [];
  let backHref = "/workouts/templates";

  if (workoutId) {
    const supabase = await createClient();

    const { data: workout } = await supabase
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
      .eq("id", workoutId)
      .single();

    if (workout?.workout_sets) {
      // Extract unique exercises in their original order
      const seen = new Set<string>();
      for (const set of workout.workout_sets) {
        const exerciseId = set.exercises.id;
        if (!seen.has(exerciseId)) {
          seen.add(exerciseId);
          const tags: Tag[] =
            set.exercises.exercise_tags?.map(
              (et: { tags: Tag }) => et.tags
            ) ?? [];
          initialExercises.push({
            id: set.exercises.id,
            name: set.exercises.name,
            is_custom: set.exercises.is_custom,
            user_id: set.exercises.user_id,
            mode: set.exercises.mode ?? "weight",
            created_at: set.exercises.created_at,
            tags,
          });
        }
      }
      backHref = `/workouts/${workoutId}`;
    }
  }

  const initialState =
    initialExercises.length > 0
      ? { name: "", exercises: initialExercises }
      : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={backHref}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New Template</h1>
      </div>
      <TemplateForm initialState={initialState} />
    </div>
  );
}
