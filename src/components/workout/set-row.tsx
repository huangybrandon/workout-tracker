"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { SetInput } from "@/lib/types";

interface SetRowProps {
  setNumber: number;
  set: SetInput;
  onChange: (field: "reps" | "weight", value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function SetRow({
  setNumber,
  set,
  onChange,
  onRemove,
  canRemove,
}: SetRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 shrink-0 text-center text-sm text-muted-foreground">
        {setNumber}
      </span>
      <Input
        placeholder="Reps"
        value={set.reps}
        onChange={(e) => onChange("reps", e.target.value)}
        inputMode="numeric"
        className="h-9"
      />
      <Input
        placeholder="Weight"
        value={set.weight}
        onChange={(e) => onChange("weight", e.target.value)}
        inputMode="decimal"
        className="h-9"
      />
      <span className="shrink-0 text-xs text-muted-foreground">lbs</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={onRemove}
        disabled={!canRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
