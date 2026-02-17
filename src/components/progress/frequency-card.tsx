import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FrequencyCardProps {
  thisWeek: number;
  byWeek: { week: string; count: number }[];
}

export function FrequencyCard({ thisWeek, byWeek }: FrequencyCardProps) {
  const maxCount = Math.max(...byWeek.map((w) => w.count), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Workout Frequency</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-2xl font-bold">
          {thisWeek}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            {thisWeek === 1 ? "workout" : "workouts"} this week
          </span>
        </p>
        <div className="flex items-end gap-1" style={{ height: 40 }}>
          {byWeek.map((w) => (
            <div
              key={w.week}
              className="flex-1 rounded-sm bg-primary/80"
              style={{
                height: w.count === 0 ? 2 : (w.count / maxCount) * 100 + "%",
                minHeight: 2,
              }}
              title={`${w.count} workouts`}
            />
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Last 12 weeks</p>
      </CardContent>
    </Card>
  );
}
