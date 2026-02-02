import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    exercises: string[];
  };
}

export function TemplateCard({ template }: TemplateCardProps) {
  const exerciseCount = template.exercises.length;
  const preview = template.exercises.slice(0, 3).join(", ");
  const overflow = exerciseCount - 3;

  return (
    <Link href={`/workouts/templates/${template.id}`}>
      <Card className="transition-colors hover:bg-accent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{template.name}</CardTitle>
            <Badge variant="secondary">
              {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {exerciseCount === 0
              ? "No exercises"
              : preview + (overflow > 0 ? `, +${overflow} more` : "")}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
