"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { WorkoutCard } from "@/components/workout/workout-card";
import { Plus, Dumbbell } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 10;

interface WorkoutListItem {
  id: string;
  name: string;
  date: string;
  workout_sets: { weight: number; reps: number }[];
}

export function WorkoutList({
  initialWorkouts,
  initialHasMore,
}: {
  initialWorkouts: WorkoutListItem[];
  initialHasMore: boolean;
}) {
  const [workouts, setWorkouts] = useState(initialWorkouts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);

  async function loadMore() {
    setLoadingMore(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("workouts")
      .select(
        `
        id,
        name,
        date,
        workout_sets (
          weight,
          reps
        )
      `
      )
      .order("date", { ascending: false })
      .range(workouts.length, workouts.length + PAGE_SIZE - 1);

    if (error) {
      toast.error("Failed to load workouts");
    } else {
      const fetched = data || [];
      setWorkouts((prev) => [...prev, ...fetched]);
      setHasMore(fetched.length === PAGE_SIZE);
    }

    setLoadingMore(false);
  }

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <Dumbbell className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="mb-4 text-muted-foreground">No workouts yet</p>
        <Button asChild>
          <Link href="/workouts/new">
            <Plus className="mr-2 h-4 w-4" />
            Create your first workout
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {workouts.map((workout) => (
          <WorkoutCard key={workout.id} workout={workout} />
        ))}
      </div>
      {hasMore && (
        <Button
          variant="outline"
          className="w-full"
          onClick={loadMore}
          disabled={loadingMore}
        >
          {loadingMore ? "Loading..." : "Load More"}
        </Button>
      )}
    </>
  );
}
