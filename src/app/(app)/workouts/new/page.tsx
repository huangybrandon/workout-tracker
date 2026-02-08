"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WorkoutForm, type WorkoutFormState } from "@/components/workout/workout-form";
import type { Tag } from "@/lib/types";
import { TemplatePicker } from "@/components/template/template-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LayoutTemplate } from "lucide-react";
import Link from "next/link";

export default function NewWorkoutPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");
  const supabase = createClient();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [initialState, setInitialState] = useState<WorkoutFormState | undefined>(
    undefined
  );
  const [pendingState, setPendingState] = useState<WorkoutFormState | null>(
    null
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (templateId && !initialState) {
      loadTemplateById(templateId);
    }
  }, [templateId]);

  async function loadTemplateById(id: string) {
    const { data: template, error } = await supabase
      .from("workout_templates")
      .select(
        `
        id,
        name,
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

    if (error || !template) return;

    const exercises = (template.workout_template_exercises || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((te: any) => ({
        id: te.exercises.id,
        name: te.exercises.name,
        is_custom: te.exercises.is_custom,
        user_id: te.exercises.user_id,
        mode: te.exercises.mode || "weight",
        created_at: te.exercises.created_at,
        tags:
          te.exercises.exercise_tags?.map((et: { tags: Tag }) => et.tags) ?? [],
      }));

    const state: WorkoutFormState = {
      name: "",
      date: new Date(),
      notes: "",
      exercises: exercises.map((exercise: any) => ({
        exercise,
        sets: [{ id: crypto.randomUUID(), reps: "1", weight: "0" }],
      })),
    };

    setInitialState(state);
    setFormKey((k) => k + 1);
  }

  function handleLoadTemplate() {
    // If form has exercises, we need to check after template is selected
    setPickerOpen(true);
  }

  function handleTemplateSelected(state: WorkoutFormState) {
    // If we already have exercises loaded, confirm before replacing
    if (initialState && initialState.exercises.length > 0) {
      setPendingState(state);
      setConfirmOpen(true);
      return;
    }
    applyTemplate(state);
  }

  function applyTemplate(state: WorkoutFormState) {
    setInitialState(state);
    setFormKey((k) => k + 1);
    setPendingState(null);
  }

  function handleConfirmReplace() {
    if (pendingState) {
      applyTemplate(pendingState);
    }
    setConfirmOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/workouts">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="flex-1 text-2xl font-bold">New Workout</h1>
        <Button variant="outline" size="sm" onClick={handleLoadTemplate}>
          <LayoutTemplate className="mr-1 h-4 w-4" />
          Load Template
        </Button>
      </div>
      <WorkoutForm key={formKey} initialState={initialState} />

      <TemplatePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleTemplateSelected}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace current exercises?</AlertDialogTitle>
            <AlertDialogDescription>
              Loading a template will replace your current exercises. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingState(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReplace}>
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
