"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { WorkoutCard } from "@/components/workout/workout-card";
import { Plus, Dumbbell, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 10;

interface WorkoutListItem {
  id: string;
  name: string;
  date: string;
  workout_sets: { weight: number; reps: number }[];
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<WorkoutListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchWorkouts();
  }, []);

  async function fetchWorkouts(offset = 0) {
    const isLoadMore = offset > 0;
    if (isLoadMore) setLoadingMore(true);

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
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      toast.error("Failed to load workouts");
    } else {
      const fetched = data || [];
      if (isLoadMore) {
        setWorkouts((prev) => [...prev, ...fetched]);
      } else {
        setWorkouts(fetched);
      }
      setHasMore(fetched.length === PAGE_SIZE);
    }

    setLoading(false);
    setLoadingMore(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workouts</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/workouts/templates">
              <LayoutTemplate className="mr-1 h-4 w-4" />
              Templates
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/workouts/new">
              <Plus className="mr-1 h-4 w-4" />
              New
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : workouts.length === 0 ? (
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
      ) : (
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
              onClick={() => fetchWorkouts(workouts.length)}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load More"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
