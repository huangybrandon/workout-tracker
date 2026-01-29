import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Pencil } from "lucide-react";
import { format } from "date-fns";
import { DeleteWorkoutButton } from "@/components/workout/delete-workout-button";
import type { Tag } from "@/lib/types";

interface WorkoutDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkoutDetailPage({
  params,
}: WorkoutDetailPageProps) {
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
  const exerciseGroups: Record<
    string,
    {
      exercise: {
        id: string;
        name: string;
        tags: Tag[];
      };
      sets: { set_number: number; reps: number; weight: number }[];
    }
  > = {};

  for (const set of workout.workout_sets) {
    const exerciseId = set.exercises.id;
    if (!exerciseGroups[exerciseId]) {
      const tags: Tag[] =
        set.exercises.exercise_tags?.map(
          (et: { tags: Tag }) => et.tags
        ) ?? [];
      exerciseGroups[exerciseId] = {
        exercise: {
          id: set.exercises.id,
          name: set.exercises.name,
          tags,
        },
        sets: [],
      };
    }
    exerciseGroups[exerciseId].sets.push({
      set_number: set.set_number,
      reps: set.reps,
      weight: Number(set.weight),
    });
  }

  // Sort sets by set_number within each group
  Object.values(exerciseGroups).forEach((group) => {
    group.sets.sort((a, b) => a.set_number - b.set_number);
  });

  const totalVolume = workout.workout_sets.reduce(
    (sum: number, s: { weight: number; reps: number }) =>
      sum + Number(s.weight) * s.reps,
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/workouts">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{workout.name}</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(workout.date + "T00:00:00"), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Button variant="outline" size="icon" asChild>
          <Link href={`/workouts/${id}/edit`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {workout.notes && (
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground">{workout.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Badge variant="secondary">
          {workout.workout_sets.length} total sets
        </Badge>
        <Badge variant="secondary">
          {Object.keys(exerciseGroups).length} exercises
        </Badge>
        {totalVolume > 0 && (
          <Badge variant="secondary">
            {totalVolume.toLocaleString()} lbs volume
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {Object.values(exerciseGroups).map((group) => (
          <Card key={group.exercise.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">
                  {group.exercise.name}
                </CardTitle>
                {group.exercise.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    className="text-xs"
                    style={{
                      backgroundColor: tag.color,
                      color: "white",
                      borderColor: "transparent",
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {group.sets.map((set, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 text-sm"
                  >
                    <span className="w-12 text-muted-foreground">
                      Set {set.set_number}
                    </span>
                    <span>{set.reps} reps</span>
                    <span className="text-muted-foreground">@</span>
                    <span>{set.weight} lbs</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <DeleteWorkoutButton workoutId={id} />
    </div>
  );
}
