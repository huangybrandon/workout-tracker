"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Plus, Search, Dumbbell, X, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Exercise, Tag, ExerciseWithTags } from "@/lib/types";
import { normalizeExerciseTags } from "@/lib/types";

const TAG_COLOR_OPTIONS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#6b7280",
];

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editName, setEditName] = useState("");
  const [editMode, setEditMode] = useState<"weight" | "time">("weight");
  const [editTagIds, setEditTagIds] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState("");
  const [newMode, setNewMode] = useState<"weight" | "time">("weight");
  const [newExerciseTagIds, setNewExerciseTagIds] = useState<Set<string>>(new Set());
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLOR_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchExercises();
    fetchTags();
  }, []);

  async function fetchExercises() {
    const { data, error } = await supabase
      .from("exercises")
      .select("*, exercise_tags(tags(*))")
      .order("name");

    if (error) {
      toast.error("Failed to load exercises");
      return;
    }
    setExercises(
      (data as unknown as ExerciseWithTags[])?.map(normalizeExerciseTags) || []
    );
  }

  async function fetchTags() {
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Failed to load tags");
      return;
    }
    setTags(data || []);
  }

  async function addExercise() {
    if (!newName.trim()) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: exercise, error } = await supabase
      .from("exercises")
      .insert({
        name: newName.trim(),
        is_custom: true,
        user_id: user!.id,
        mode: newMode,
      })
      .select()
      .single();

    if (error || !exercise) {
      toast.error("Failed to add exercise");
      setLoading(false);
      return;
    }

    if (newExerciseTagIds.size > 0) {
      const tagRows = Array.from(newExerciseTagIds).map((tagId) => ({
        exercise_id: exercise.id,
        tag_id: tagId,
      }));
      const { error: tagError } = await supabase
        .from("exercise_tags")
        .insert(tagRows);
      if (tagError) {
        toast.error("Exercise added but failed to assign tags");
      }
    }

    toast.success("Exercise added");
    setNewName("");
    setNewMode("weight");
    setNewExerciseTagIds(new Set());
    setDialogOpen(false);
    fetchExercises();
    setLoading(false);
  }

  async function createTag() {
    if (!newTagName.trim()) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("tags").insert({
      name: newTagName.trim().toLowerCase(),
      color: newTagColor,
      user_id: user!.id,
    });

    if (error) {
      toast.error(
        error.message.includes("duplicate")
          ? "A tag with that name already exists"
          : "Failed to create tag"
      );
    } else {
      toast.success("Tag created");
      setNewTagName("");
      setNewTagColor(TAG_COLOR_OPTIONS[0]);
      setTagDialogOpen(false);
      fetchTags();
    }
    setLoading(false);
  }

  function openEditDialog(exercise: Exercise) {
    setEditingExercise(exercise);
    setEditName(exercise.name);
    setEditMode(exercise.mode);
    setEditTagIds(new Set(exercise.tags?.map((t) => t.id) ?? []));
    setEditDialogOpen(true);
  }

  async function saveExercise() {
    if (!editingExercise || !editName.trim()) return;
    setLoading(true);

    const { error: updateError } = await supabase
      .from("exercises")
      .update({ name: editName.trim(), mode: editMode })
      .eq("id", editingExercise.id);

    if (updateError) {
      toast.error("Failed to update exercise");
      setLoading(false);
      return;
    }

    // Replace tags: delete existing, insert new
    await supabase
      .from("exercise_tags")
      .delete()
      .eq("exercise_id", editingExercise.id);

    if (editTagIds.size > 0) {
      const tagRows = Array.from(editTagIds).map((tagId) => ({
        exercise_id: editingExercise.id,
        tag_id: tagId,
      }));
      const { error: tagError } = await supabase
        .from("exercise_tags")
        .insert(tagRows);
      if (tagError) {
        toast.error("Exercise updated but failed to save tags");
      }
    }

    toast.success("Exercise updated");
    setEditDialogOpen(false);
    setEditingExercise(null);
    fetchExercises();
    setLoading(false);
  }

  async function deleteExercise() {
    if (!editingExercise) return;
    setLoading(true);

    const { error } = await supabase
      .from("exercises")
      .delete()
      .eq("id", editingExercise.id);

    if (error) {
      toast.error("Failed to delete exercise");
    } else {
      toast.success("Exercise deleted");
      setDeleteDialogOpen(false);
      setEditDialogOpen(false);
      setEditingExercise(null);
      fetchExercises();
    }
    setLoading(false);
  }

  function toggleFilterTag(tagId: string) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }

  function toggleEditTag(tagId: string) {
    setEditTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }

  function toggleNewExerciseTag(tagId: string) {
    setNewExerciseTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }

  const filtered = exercises.filter((e) => {
    const matchesSearch = e.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesTags =
      selectedTagIds.size === 0 ||
      Array.from(selectedTagIds).every((tagId) =>
        e.tags?.some((t) => t.id === tagId)
      );
    return matchesSearch && matchesTags;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Exercises</h1>
        <div className="flex gap-2">
          <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" />
                Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Tag</DialogTitle>
                <DialogDescription>
                  Create a custom tag for organizing exercises.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tag-name">Name</Label>
                  <Input
                    id="tag-name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="e.g. glutes"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {TAG_COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="h-8 w-8 rounded-full border-2 transition-transform"
                        style={{
                          backgroundColor: color,
                          borderColor:
                            newTagColor === color
                              ? "white"
                              : "transparent",
                          transform:
                            newTagColor === color
                              ? "scale(1.15)"
                              : "scale(1)",
                        }}
                        onClick={() => setNewTagColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={createTag}
                  disabled={loading || !newTagName.trim()}
                >
                  {loading ? "Creating..." : "Create Tag"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Exercise
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Exercise</DialogTitle>
                <DialogDescription>
                  Create a new exercise for your library.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exercise-name">Name</Label>
                  <Input
                    id="exercise-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Cable Crossover"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant={newMode === "weight" ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs px-3"
                      onClick={() => setNewMode("weight")}
                    >
                      Weight
                    </Button>
                    <Button
                      type="button"
                      variant={newMode === "time" ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs px-3"
                      onClick={() => setNewMode("time")}
                    >
                      Time
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => {
                      const selected = newExerciseTagIds.has(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleNewExerciseTag(tag.id)}
                          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: selected
                              ? tag.color
                              : "transparent",
                            color: selected ? "white" : tag.color,
                            borderColor: tag.color,
                          }}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={addExercise}
                  disabled={loading || !newName.trim()}
                >
                  {loading ? "Adding..." : "Add Exercise"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tag filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {selectedTagIds.size > 0 && (
          <button
            type="button"
            onClick={() => setSelectedTagIds(new Set())}
            className="inline-flex items-center gap-1 rounded-full border border-muted-foreground/30 px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
        {tags.map((tag) => {
          const active = selectedTagIds.has(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleFilterTag(tag.id)}
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: active ? tag.color : "transparent",
                color: active ? "white" : tag.color,
                borderColor: tag.color,
              }}
            >
              {tag.name}
            </button>
          );
        })}
      </div>

      <div className="text-sm text-muted-foreground">
        {filtered.length} exercise{filtered.length !== 1 ? "s" : ""}
      </div>

      <ExerciseList exercises={filtered} onEdit={openEditDialog} />

      {/* Edit exercise dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Exercise</DialogTitle>
            <DialogDescription>
              Update exercise name and tags.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-exercise-name">Name</Label>
              <Input
                id="edit-exercise-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Exercise name"
              />
            </div>
            <div className="space-y-2">
              <Label>Mode</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant={editMode === "weight" ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs px-3"
                  onClick={() => setEditMode("weight")}
                >
                  Weight
                </Button>
                <Button
                  type="button"
                  variant={editMode === "time" ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs px-3"
                  onClick={() => setEditMode("time")}
                >
                  Time
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => {
                  const selected = editTagIds.has(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleEditTag(tag.id)}
                      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: selected
                          ? tag.color
                          : "transparent",
                        color: selected ? "white" : tag.color,
                        borderColor: tag.color,
                      }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
            <Button
              onClick={saveExercise}
              disabled={loading || !editName.trim()}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{editingExercise?.name}&rdquo;.
              Any workout sets using this exercise will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteExercise}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ExerciseList({
  exercises,
  onEdit,
}: {
  exercises: Exercise[];
  onEdit: (exercise: Exercise) => void;
}) {
  if (exercises.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <Dumbbell className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No exercises found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {exercises.map((exercise) => (
        <Card key={exercise.id}>
          <CardContent className="flex items-center justify-between py-3">
            <span className="font-medium">{exercise.name}</span>
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap justify-end gap-1">
                {exercise.tags?.map((tag) => (
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
                {exercise.is_custom && <Badge variant="outline">Custom</Badge>}
              </div>
              {exercise.is_custom && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => onEdit(exercise)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
