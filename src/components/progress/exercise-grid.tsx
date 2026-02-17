import { Card, CardContent } from "@/components/ui/card";
import { Sparkline } from "@/components/charts/sparkline";
import { ChevronRight } from "lucide-react";
import type { ExerciseSummary } from "@/lib/utils/chart-data";

interface ExerciseGridProps {
  exercises: ExerciseSummary[];
  onSelect: (exerciseId: string) => void;
}

export function ExerciseGrid({ exercises, onSelect }: ExerciseGridProps) {
  if (exercises.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No exercises logged yet. Start a workout to see your progress!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {exercises.map((ex) => (
        <Card
          key={ex.exerciseId}
          className="cursor-pointer transition-colors hover:bg-accent/50"
          onClick={() => onSelect(ex.exerciseId)}
        >
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium leading-tight">
                {ex.exerciseName}
              </p>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <p className="mt-1 text-lg font-bold">
              {ex.latestValue}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {ex.unit}
              </span>
            </p>
            <div className="mt-1">
              <Sparkline data={ex.sparkline} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
