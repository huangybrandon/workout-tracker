"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { SetRow } from "./set-row";
import type { ExerciseBlock as ExerciseBlockType } from "@/lib/types";

interface ExerciseBlockProps {
  block: ExerciseBlockType;
  onAddSet: () => void;
  onRemoveSet: (setIndex: number) => void;
  onUpdateSet: (setIndex: number, field: "reps" | "weight", value: string) => void;
  onRemoveExercise: () => void;
}

const MAX_VISIBLE_TAGS = 2;

export function ExerciseBlock({
  block,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onRemoveExercise,
}: ExerciseBlockProps) {
  const visibleTags = block.exercise.tags?.slice(0, MAX_VISIBLE_TAGS) ?? [];
  const overflowCount =
    (block.exercise.tags?.length ?? 0) - MAX_VISIBLE_TAGS;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{block.exercise.name}</CardTitle>
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRemoveExercise}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-8 text-center">Set</span>
          <span className="flex-1">Reps</span>
          <span className="flex-1">Weight</span>
          <span className="w-8" />
          <span className="w-9" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {block.sets.map((set, index) => (
          <SetRow
            key={set.id}
            setNumber={index + 1}
            set={set}
            onChange={(field, value) => onUpdateSet(index, field, value)}
            onRemove={() => onRemoveSet(index)}
            canRemove={block.sets.length > 1}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onAddSet}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add Set
        </Button>
      </CardContent>
    </Card>
  );
}
