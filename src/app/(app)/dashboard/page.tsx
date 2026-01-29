import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Dumbbell } from "lucide-react";
import { format } from "date-fns";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch recent workouts with set counts
  const { data: recentWorkouts } = await supabase
    .from("workouts")
    .select(
      `
      id,
      name,
      date,
      workout_sets (
        id,
        exercise_id,
        weight,
        reps
      )
    `
    )
    .order("date", { ascending: false })
    .limit(3);

  // Fetch latest bodyweight
  const { data: latestWeight } = await supabase
    .from("bodyweight_entries")
    .select("weight, date")
    .order("date", { ascending: false })
    .limit(1)
    .single();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Hi{user?.email ? `, ${user.email.split("@")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
        </div>
        <LogoutButton />
      </div>

      <Button asChild className="w-full" size="lg">
        <Link href="/workouts/new">
          <Plus className="mr-2 h-5 w-5" />
          Start Workout
        </Link>
      </Button>

      {latestWeight && (
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Latest bodyweight</CardDescription>
            <CardTitle className="text-3xl">
              {Number(latestWeight.weight)} lbs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {format(new Date(latestWeight.date + "T00:00:00"), "MMM d, yyyy")}
            </p>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Workouts</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/workouts">View all</Link>
          </Button>
        </div>
        {recentWorkouts && recentWorkouts.length > 0 ? (
          <div className="space-y-3">
            {recentWorkouts.map((workout) => {
              const sets = workout.workout_sets || [];
              const totalVolume = sets.reduce(
                (sum: number, s: { weight: number; reps: number }) =>
                  sum + Number(s.weight) * s.reps,
                0
              );
              const exerciseCount = new Set(
                sets.map(
                  (s: { id: string; exercise_id: string; weight: number; reps: number }) =>
                    s.exercise_id
                )
              ).size;

              return (
                <Link key={workout.id} href={`/workouts/${workout.id}`}>
                  <Card className="transition-colors hover:bg-accent">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {workout.name}
                        </CardTitle>
                        <span className="text-xs text-muted-foreground">
                          {format(
                            new Date(workout.date + "T00:00:00"),
                            "MMM d"
                          )}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          {sets.length} sets
                        </Badge>
                        {totalVolume > 0 && (
                          <Badge variant="secondary">
                            {totalVolume.toLocaleString()} lbs
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Dumbbell className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No workouts yet. Start your first one!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
