import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { WorkoutList } from "@/components/workout/workout-list";
import { Plus, LayoutTemplate } from "lucide-react";

const PAGE_SIZE = 10;

export default async function WorkoutsPage() {
  const supabase = await createClient();

  const { data } = await supabase
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
    .range(0, PAGE_SIZE - 1);

  const workouts = data || [];
  const hasMore = workouts.length === PAGE_SIZE;

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

      <WorkoutList initialWorkouts={workouts} initialHasMore={hasMore} />
    </div>
  );
}
