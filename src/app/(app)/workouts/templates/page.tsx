"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { TemplateCard } from "@/components/template/template-card";
import { Plus, ArrowLeft, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";

interface TemplateListItem {
  id: string;
  name: string;
  exercises: string[];
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchTemplates();
  }, []);

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
            name
          )
        )
      `
      )
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Failed to load templates");
    } else {
      const items: TemplateListItem[] = (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        exercises: (t.workout_template_exercises || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((e: any) => e.exercises.name),
      }));
      setTemplates(items);
    }

    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/workouts">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Templates</h1>
        </div>
        <Button size="sm" asChild>
          <Link href="/workouts/templates/new">
            <Plus className="mr-1 h-4 w-4" />
            New
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <LayoutTemplate className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="mb-4 text-muted-foreground">No templates yet</p>
          <Button asChild>
            <Link href="/workouts/templates/new">
              <Plus className="mr-2 h-4 w-4" />
              Create your first template
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
