"use client";

import { useState } from "react";
import { WorkoutForm, type WorkoutFormState } from "@/components/workout/workout-form";
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [initialState, setInitialState] = useState<WorkoutFormState | undefined>(
    undefined
  );
  const [pendingState, setPendingState] = useState<WorkoutFormState | null>(
    null
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

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
