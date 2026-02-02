"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import type { Exercise } from "@/lib/types";

interface TemplateFormState {
  name: string;
  exercises: Exercise[];
}

interface TemplateFormProps {
  initialState?: TemplateFormState;
  templateId?: string;
}

export function TemplateForm({ initialState, templateId }: TemplateFormProps) {
  const [name, setName] = useState(initialState?.name ?? "");
  const [exercises, setExercises] = useState<Exercise[]>(
    initialState?.exercises ?? []
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isEditing = !!templateId;

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    if (exercises.length === 0) {
      toast.error("Add at least one exercise");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      if (isEditing) {
        const { error: updateError } = await supabase
          .from("workout_templates")
          .update({
            name: name.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", templateId);

        if (updateError) throw updateError;

        // Delete existing exercise rows and re-insert
        const { error: deleteError } = await supabase
          .from("workout_template_exercises")
          .delete()
          .eq("template_id", templateId);

        if (deleteError) throw deleteError;

        const rows = exercises.map((exercise, index) => ({
          template_id: templateId,
          exercise_id: exercise.id,
          sort_order: index,
        }));

        if (rows.length > 0) {
          const { error: insertError } = await supabase
            .from("workout_template_exercises")
            .insert(rows);
          if (insertError) throw insertError;
        }

        toast.success("Template updated");
        router.push(`/workouts/templates/${templateId}`);
      } else {
        const { data: template, error: templateError } = await supabase
          .from("workout_templates")
          .insert({
            user_id: user.id,
            name: name.trim(),
          })
          .select("id")
          .single();

        if (templateError || !template) throw templateError;

        const rows = exercises.map((exercise, index) => ({
          template_id: template.id,
          exercise_id: exercise.id,
          sort_order: index,
        }));

        if (rows.length > 0) {
          const { error: insertError } = await supabase
            .from("workout_template_exercises")
            .insert(rows);
          if (insertError) throw insertError;
        }

        toast.success("Template saved");
        router.push(`/workouts/templates/${template.id}`);
      }

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save template"
      );
    } finally {
      setSaving(false);
    }
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="template-name">Template Name</Label>
        <Input
          id="template-name"
          placeholder="e.g. Push Day"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {exercises.map((exercise, index) => (
          <Card key={`${exercise.id}-${index}`}>
            <CardContent className="flex items-center justify-between py-3">
              <span className="text-sm font-medium">{exercise.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeExercise(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setPickerOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Exercise
      </Button>

      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(exercise) =>
          setExercises((prev) => [...prev, exercise])
        }
      />

      <Button
        className="w-full"
        size="lg"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : isEditing ? (
          "Update Template"
        ) : (
          "Save Template"
        )}
      </Button>
    </div>
  );
}
