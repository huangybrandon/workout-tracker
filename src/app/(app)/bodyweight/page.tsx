"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Scale, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { BodyweightChart } from "@/components/charts/bodyweight-chart";
import type { BodyweightEntry } from "@/lib/types";

export default function BodyweightPage() {
  const [entries, setEntries] = useState<BodyweightEntry[]>([]);
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    const { data, error } = await supabase
      .from("bodyweight_entries")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      toast.error("Failed to load entries");
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  }

  async function handleLog() {
    if (!weight) return;
    const parsed = parseFloat(weight);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Enter a valid weight");
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const today = format(new Date(), "yyyy-MM-dd");

    const { error } = await supabase.from("bodyweight_entries").upsert(
      {
        user_id: user!.id,
        date: today,
        weight: parsed,
      },
      { onConflict: "user_id,date" }
    );

    if (error) {
      toast.error("Failed to log weight");
    } else {
      toast.success("Weight logged");
      setWeight("");
      fetchEntries();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from("bodyweight_entries")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete entry");
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("Entry deleted");
    }
  }

  const chartData = entries.map((e) => ({
    date: e.date,
    weight: Number(e.weight),
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Bodyweight</h1>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Log Today&apos;s Weight</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="e.g. 175.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                inputMode="decimal"
              />
            </div>
            <span className="flex items-center text-sm text-muted-foreground">
              lbs
            </span>
            <Button onClick={handleLog} disabled={saving || !weight}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Log"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      ) : chartData.length > 1 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <BodyweightChart data={chartData} />
          </CardContent>
        </Card>
      ) : null}

      <div>
        <h2 className="mb-3 text-lg font-semibold">History</h2>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Scale className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No entries yet. Log your first weight above.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div>
                  <p className="font-medium">
                    {Number(entry.weight)} lbs
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(
                      new Date(entry.date + "T00:00:00"),
                      "EEEE, MMM d, yyyy"
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(entry.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
