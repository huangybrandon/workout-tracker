"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  createEmptySet,
  type WorkoutFormState,
} from "@/components/workout/workout-form";
import type { Exercise, Tag } from "@/lib/types";

interface TemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (state: WorkoutFormState) => void;
}

interface TemplateOption {
  id: string;
  name: string;
  exercises: Exercise[];
}

export function TemplatePicker({
  open,
  onOpenChange,
  onSelect,
}: TemplatePickerProps) {
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  async function fetchTemplates() {
    const { data, error } = await supabase
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
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Failed to load templates");
      return;
    }

    const options: TemplateOption[] = (data || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      exercises: (t.workout_template_exercises || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
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
        })),
    }));

    setTemplates(options);
  }

  function handleSelect(template: TemplateOption) {
    const state: WorkoutFormState = {
      name: "",
      date: new Date(),
      notes: "",
      exercises: template.exercises.map((exercise) => ({
        exercise,
        sets: [createEmptySet(), createEmptySet(), createEmptySet()],
      })),
    };

    onSelect(state);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Load Template</DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Search templates..." />
          <CommandList>
            <CommandEmpty>No templates found.</CommandEmpty>
            <CommandGroup>
              {templates.map((template) => (
                <CommandItem
                  key={template.id}
                  value={template.name}
                  onSelect={() => handleSelect(template)}
                  className="flex items-center justify-between"
                >
                  <span>{template.name}</span>
                  <Badge variant="secondary" className="ml-2">
                    {template.exercises.length}{" "}
                    {template.exercises.length === 1
                      ? "exercise"
                      : "exercises"}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="border-t px-4 py-3">
          <Link
            href="/workouts/templates/new"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Create New Template
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
