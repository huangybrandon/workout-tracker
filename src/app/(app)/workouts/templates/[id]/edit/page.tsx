import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplateForm } from "@/components/template/template-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Exercise, Tag } from "@/lib/types";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const exercises: Exercise[] = (template.workout_template_exercises || [])
    .sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    )
    .map((te: any) => ({
      id: te.exercises.id,
      name: te.exercises.name,
      is_custom: te.exercises.is_custom,
      user_id: te.exercises.user_id,
      mode: te.exercises.mode || "weight",
      created_at: te.exercises.created_at,
      tags:
        te.exercises.exercise_tags?.map((et: { tags: Tag }) => et.tags) ??
        [],
    }));

  const initialState = {
    name: template.name,
    exercises,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/workouts/templates/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Template</h1>
      </div>
      <TemplateForm initialState={initialState} templateId={id} />
    </div>
  );
}
