import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface WorkoutCardProps {
  workout: {
    id: string;
    name: string;
    date: string;
    workout_sets: { weight: number; reps: number }[];
  };
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const totalSets = workout.workout_sets.length;
  const totalVolume = workout.workout_sets.reduce(
    (sum, s) => sum + Number(s.weight) * s.reps,
    0
  );

  return (
    <Link href={`/workouts/${workout.id}`}>
      <Card className="transition-colors hover:bg-accent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{workout.name}</CardTitle>
            <span className="text-xs text-muted-foreground">
              {format(new Date(workout.date + "T00:00:00"), "MMM d, yyyy")}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Badge variant="secondary">{totalSets} sets</Badge>
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
}
