"use client";

import { useReducer, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ExercisePicker } from "./exercise-picker";
import { ExerciseBlock } from "./exercise-block";
import type { Exercise, ExerciseBlock as ExerciseBlockType, SetInput } from "@/lib/types";

// State types
interface WorkoutFormState {
  name: string;
  date: Date;
  notes: string;
  exercises: ExerciseBlockType[];
}

type WorkoutFormAction =
  | { type: "SET_NAME"; payload: string }
  | { type: "SET_DATE"; payload: Date }
  | { type: "SET_NOTES"; payload: string }
  | { type: "ADD_EXERCISE"; payload: Exercise }
  | { type: "REMOVE_EXERCISE"; payload: number }
  | { type: "ADD_SET"; payload: number }
  | { type: "REMOVE_SET"; payload: { exerciseIndex: number; setIndex: number } }
  | {
      type: "UPDATE_SET";
      payload: {
        exerciseIndex: number;
        setIndex: number;
        field: "reps" | "weight";
        value: string;
      };
    }
  | { type: "LOAD"; payload: WorkoutFormState };

function createEmptySet(): SetInput {
  return { id: crypto.randomUUID(), reps: "", weight: "" };
}

function reducer(
  state: WorkoutFormState,
  action: WorkoutFormAction
): WorkoutFormState {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.payload };
    case "SET_DATE":
      return { ...state, date: action.payload };
    case "SET_NOTES":
      return { ...state, notes: action.payload };
    case "ADD_EXERCISE":
      return {
        ...state,
        exercises: [
          ...state.exercises,
          { exercise: action.payload, sets: [createEmptySet()] },
        ],
      };
    case "REMOVE_EXERCISE":
      return {
        ...state,
        exercises: state.exercises.filter((_, i) => i !== action.payload),
      };
    case "ADD_SET": {
      const exercises = [...state.exercises];
      exercises[action.payload] = {
        ...exercises[action.payload],
        sets: [...exercises[action.payload].sets, createEmptySet()],
      };
      return { ...state, exercises };
    }
    case "REMOVE_SET": {
      const exercises = [...state.exercises];
      exercises[action.payload.exerciseIndex] = {
        ...exercises[action.payload.exerciseIndex],
        sets: exercises[action.payload.exerciseIndex].sets.filter(
          (_, i) => i !== action.payload.setIndex
        ),
      };
      return { ...state, exercises };
    }
    case "UPDATE_SET": {
      const exercises = [...state.exercises];
      const sets = [...exercises[action.payload.exerciseIndex].sets];
      sets[action.payload.setIndex] = {
        ...sets[action.payload.setIndex],
        [action.payload.field]: action.payload.value,
      };
      exercises[action.payload.exerciseIndex] = {
        ...exercises[action.payload.exerciseIndex],
        sets,
      };
      return { ...state, exercises };
    }
    case "LOAD":
      return action.payload;
    default:
      return state;
  }
}

interface WorkoutFormProps {
  initialState?: WorkoutFormState;
  workoutId?: string;
}

export function WorkoutForm({ initialState, workoutId }: WorkoutFormProps) {
  const [state, dispatch] = useReducer(
    reducer,
    initialState || {
      name: "",
      date: new Date(),
      notes: "",
      exercises: [],
    }
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isEditing = !!workoutId;

  const hasUnsavedChanges = useCallback(() => {
    return state.name.trim() !== "" || state.exercises.length > 0;
  }, [state.name, state.exercises.length]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  async function handleSave() {
    if (!state.name.trim()) {
      toast.error("Please enter a workout name");
      return;
    }
    if (state.exercises.length === 0) {
      toast.error("Please add at least one exercise");
      return;
    }

    // Validate all sets have required fields
    for (const block of state.exercises) {
      for (const set of block.sets) {
        if (block.exercise.mode === "time") {
          if (!set.reps) {
            toast.error(`Fill in all sets for ${block.exercise.name}`);
            return;
          }
        } else {
          if (!set.reps || !set.weight) {
            toast.error(`Fill in all sets for ${block.exercise.name}`);
            return;
          }
        }
      }
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      if (isEditing) {
        // Update workout
        const { error: updateError } = await supabase
          .from("workouts")
          .update({
            name: state.name.trim(),
            date: format(state.date, "yyyy-MM-dd"),
            notes: state.notes.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", workoutId);

        if (updateError) throw updateError;

        // Delete existing sets and reinsert
        const { error: deleteError } = await supabase
          .from("workout_sets")
          .delete()
          .eq("workout_id", workoutId);

        if (deleteError) throw deleteError;

        // Insert new sets
        const sets = state.exercises.flatMap((block) =>
          block.sets.map((set, setIndex) => ({
            workout_id: workoutId,
            exercise_id: block.exercise.id,
            set_number: setIndex + 1,
            reps: parseInt(set.reps),
            weight: block.exercise.mode === "time" ? 0 : parseFloat(set.weight),
          }))
        );

        if (sets.length > 0) {
          const { error: setsError } = await supabase
            .from("workout_sets")
            .insert(sets);
          if (setsError) throw setsError;
        }

        toast.success("Workout updated");
        router.push(`/workouts/${workoutId}`);
      } else {
        // Create workout
        const { data: workout, error: workoutError } = await supabase
          .from("workouts")
          .insert({
            user_id: user.id,
            name: state.name.trim(),
            date: format(state.date, "yyyy-MM-dd"),
            notes: state.notes.trim() || null,
          })
          .select("id")
          .single();

        if (workoutError || !workout) throw workoutError;

        // Insert sets
        const sets = state.exercises.flatMap((block) =>
          block.sets.map((set, setIndex) => ({
            workout_id: workout.id,
            exercise_id: block.exercise.id,
            set_number: setIndex + 1,
            reps: parseInt(set.reps),
            weight: block.exercise.mode === "time" ? 0 : parseFloat(set.weight),
          }))
        );

        if (sets.length > 0) {
          const { error: setsError } = await supabase
            .from("workout_sets")
            .insert(sets);
          if (setsError) throw setsError;
        }

        toast.success("Workout saved");
        router.push(`/workouts/${workout.id}`);
      }

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save workout"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="workout-name">Workout Name</Label>
        <Input
          id="workout-name"
          placeholder="e.g. Push Day A"
          value={state.name}
          onChange={(e) =>
            dispatch({ type: "SET_NAME", payload: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !state.date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(state.date, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={state.date}
              onSelect={(date) =>
                date && dispatch({ type: "SET_DATE", payload: date })
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="workout-notes">Notes (optional)</Label>
        <Textarea
          id="workout-notes"
          placeholder="How did the workout feel?"
          value={state.notes}
          onChange={(e) =>
            dispatch({ type: "SET_NOTES", payload: e.target.value })
          }
          rows={2}
        />
      </div>

      <div className="space-y-3">
        {state.exercises.map((block, index) => (
          <ExerciseBlock
            key={`${block.exercise.id}-${index}`}
            block={block}
            onAddSet={() => dispatch({ type: "ADD_SET", payload: index })}
            onRemoveSet={(setIndex) =>
              dispatch({
                type: "REMOVE_SET",
                payload: { exerciseIndex: index, setIndex },
              })
            }
            onUpdateSet={(setIndex, field, value) =>
              dispatch({
                type: "UPDATE_SET",
                payload: { exerciseIndex: index, setIndex, field, value },
              })
            }
            onRemoveExercise={() =>
              dispatch({ type: "REMOVE_EXERCISE", payload: index })
            }
          />
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
          dispatch({ type: "ADD_EXERCISE", payload: exercise })
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
          "Update Workout"
        ) : (
          "Save Workout"
        )}
      </Button>
    </div>
  );
}
