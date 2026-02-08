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
import { ArrowLeft, Pencil, Play } from "lucide-react";
import { DeleteTemplateButton } from "@/components/template/delete-template-button";
import type { Tag } from "@/lib/types";

interface TemplateDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TemplateDetailPage({
  params,
}: TemplateDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: template, error } = await supabase
    .from("workout_templates")
    .select(
      `
      *,
      workout_template_exercises (
        sort_order,
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

  if (error || !template) {
    notFound();
  }

  const exercises = (template.workout_template_exercises || [])
    .sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    )
    .map((te: any) => ({
      id: te.exercises.id,
      name: te.exercises.name,
      mode: te.exercises.mode || "weight",
      tags:
        te.exercises.exercise_tags?.map((et: { tags: Tag }) => et.tags) ?? [],
    }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/workouts/templates">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{template.name}</h1>
        </div>
        <Button variant="outline" size="icon" asChild>
          <Link href={`/workouts/templates/${id}/edit`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <Button className="w-full" asChild>
        <Link href={`/workouts/new?templateId=${id}`}>
          <Play className="mr-2 h-4 w-4" />
          Load Template
        </Link>
      </Button>

      <div className="flex gap-3">
        <Badge variant="secondary">
          {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"}
        </Badge>
      </div>

      <div className="space-y-3">
        {exercises.map(
          (
            exercise: {
              id: string;
              name: string;
              mode: string;
              tags: Tag[];
            },
            index: number
          ) => (
            <Card key={`${exercise.id}-${index}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{exercise.name}</CardTitle>
                  {exercise.tags.map((tag) => (
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
                <p className="text-sm text-muted-foreground">
                  {exercise.mode === "time" ? "Time-based" : "Weight-based"} — 1
                  set when loaded
                </p>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {exercises.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          No exercises in this template
        </div>
      )}

      <Separator />

      <DeleteTemplateButton templateId={id} />
    </div>
  );
}
