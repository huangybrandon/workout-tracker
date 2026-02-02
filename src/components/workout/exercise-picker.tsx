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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";
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
  const [mode, setMode] = useState<"search" | "create">("search");
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newMode, setNewMode] = useState<"weight" | "time">("weight");
  const [creating, setCreating] = useState(false);
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

  function resetCreateState() {
    setMode("search");
    setSearch("");
    setNewName("");
    setNewMode("weight");
    setCreating(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetCreateState();
    }
    onOpenChange(nextOpen);
  }

  function enterCreateMode() {
    setNewName(search.trim());
    setNewMode("weight");
    setMode("create");
  }

  async function createExercise() {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setCreating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("exercises")
        .insert({
          name: trimmed,
          mode: newMode,
          is_custom: true,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newExercise: Exercise = { ...data, tags: [] };
      setExercises((prev) => [...prev, newExercise]);
      onSelect(newExercise);
      handleOpenChange(false);
      toast.success(`Created "${trimmed}"`);
    } catch {
      toast.error("Failed to create exercise");
    } finally {
      setCreating(false);
    }
  }

  const available = exercises.filter((e) => !excludeIds.includes(e.id));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>
            {mode === "search" ? "Add Exercise" : "Create Exercise"}
          </DialogTitle>
        </DialogHeader>

        {mode === "search" ? (
          <Command>
            <CommandInput
              placeholder="Search exercises..."
              value={search}
              onValueChange={setSearch}
            />
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
                        handleOpenChange(false);
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
            <div
              className="flex items-center gap-2 border-t px-3 py-2 text-sm text-muted-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground"
              onClick={enterCreateMode}
            >
              <Plus className="h-4 w-4" />
              <span>
                Create new exercise
                {search.trim() && (
                  <>
                    {" "}
                    &ldquo;<span className="font-medium">{search.trim()}</span>
                    &rdquo;
                  </>
                )}
              </span>
            </div>
          </Command>
        ) : (
          <div className="flex flex-col gap-4 px-4 pb-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="exercise-name">Name</Label>
              <Input
                id="exercise-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Exercise name"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Mode</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={newMode === "weight" ? "default" : "outline"}
                  onClick={() => setNewMode("weight")}
                >
                  Weight
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={newMode === "time" ? "default" : "outline"}
                  onClick={() => setNewMode("time")}
                >
                  Time
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("search")}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={createExercise}
                disabled={!newName.trim() || creating}
              >
                {creating ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
