"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
import type { Exercise, ExerciseWithTags } from "@/lib/types";
import { normalizeExerciseTags } from "@/lib/types";

interface ExercisePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (exercise: Exercise) => void;
  excludeIds?: string[];
}

const MAX_VISIBLE_TAGS = 3;

export function ExercisePicker({
  open,
  onOpenChange,
  onSelect,
  excludeIds = [],
}: ExercisePickerProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      fetchExercises();
    }
  }, [open]);

  async function fetchExercises() {
    const { data } = await supabase
      .from("exercises")
      .select("*, exercise_tags(tags(*))")
      .order("name");

    setExercises(
      (data as unknown as ExerciseWithTags[])?.map(normalizeExerciseTags) || []
    );
  }

  const available = exercises.filter((e) => !excludeIds.includes(e.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Add Exercise</DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Search exercises..." />
          <CommandList>
            <CommandEmpty>No exercises found.</CommandEmpty>
            <CommandGroup>
              {available.map((exercise) => {
                const visibleTags =
                  exercise.tags?.slice(0, MAX_VISIBLE_TAGS) ?? [];
                const overflowCount =
                  (exercise.tags?.length ?? 0) - MAX_VISIBLE_TAGS;
                return (
                  <CommandItem
                    key={exercise.id}
                    value={exercise.name}
                    onSelect={() => {
                      onSelect(exercise);
                      onOpenChange(false);
                    }}
                    className="flex items-center justify-between"
                  >
                    <span>{exercise.name}</span>
                    <div className="ml-2 flex gap-1">
                      {visibleTags.map((tag) => (
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
                      {overflowCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          +{overflowCount}
                        </Badge>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
