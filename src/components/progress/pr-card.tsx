import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trophy } from "lucide-react";
import type { PersonalRecord } from "@/lib/utils/chart-data";

interface PrCardProps {
  records: PersonalRecord[];
}

export function PrCard({ records }: PrCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recent PRs</CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No new PRs in the last 30 days
          </p>
        ) : (
          <ul className="space-y-2">
            {records.slice(0, 5).map((pr) => (
              <li
                key={pr.exerciseId}
                className="flex items-center gap-2 text-sm"
              >
                <Trophy className="h-4 w-4 shrink-0 text-yellow-500" />
                <span className="font-medium">{pr.exerciseName}</span>
                <span className="ml-auto text-muted-foreground">
                  {pr.value} {pr.unit}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(pr.date + "T00:00:00"), "MMM d")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
