"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TemplateForm } from "@/components/template/template-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { Exercise, Tag } from "@/lib/types";

export default function EditTemplatePage() {
  const params = useParams();
  const id = params.id as string;
  const [initialState, setInitialState] = useState<{
    name: string;
    exercises: Exercise[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadTemplate() {
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
        toast.error("Failed to load template");
        setLoading(false);
        return;
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

      setInitialState({
        name: template.name,
        exercises,
      });
      setLoading(false);
    }

    loadTemplate();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-10 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!initialState) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Template not found</p>
      </div>
    );
  }

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
