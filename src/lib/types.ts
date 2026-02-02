export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string | null;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  is_custom: boolean;
  user_id: string | null;
  mode: "weight" | "time";
  created_at: string;
  tags?: Tag[];
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSet {
  id: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight: number;
  created_at: string;
}

export interface BodyweightEntry {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  created_at: string;
}

// Raw shape from Supabase when joining exercise_tags -> tags
export interface ExerciseWithTags {
  id: string;
  name: string;
  is_custom: boolean;
  user_id: string | null;
  mode: "weight" | "time";
  created_at: string;
  exercise_tags: { tags: Tag }[];
}

// Flatten the nested join into a clean tags array
export function normalizeExerciseTags(raw: ExerciseWithTags): Exercise {
  return {
    id: raw.id,
    name: raw.name,
    is_custom: raw.is_custom,
    user_id: raw.user_id,
    mode: raw.mode ?? "weight",
    created_at: raw.created_at,
    tags: raw.exercise_tags?.map((et) => et.tags) ?? [],
  };
}

// Workout templates
export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutTemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  sort_order: number;
}

export interface WorkoutTemplateWithExercises extends WorkoutTemplate {
  workout_template_exercises: (WorkoutTemplateExercise & {
    exercises: Exercise & {
      exercise_tags: { tags: Tag }[];
    };
  })[];
}

// Extended types for UI
export interface WorkoutWithSets extends Workout {
  workout_sets: (WorkoutSet & { exercises: Exercise })[];
}

export interface ExerciseBlock {
  exercise: Exercise;
  sets: SetInput[];
}

export interface SetInput {
  id: string;
  reps: string;
  weight: string;
}
