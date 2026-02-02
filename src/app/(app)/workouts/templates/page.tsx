import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { TemplateCard } from "@/components/template/template-card";
import { Plus, ArrowLeft, LayoutTemplate } from "lucide-react";

interface TemplateListItem {
  id: string;
  name: string;
  exercises: string[];
}

export default async function TemplatesPage() {
  const supabase = await createClient();

  const { data } = await supabase
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

  const templates: TemplateListItem[] = (data || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    exercises: (t.workout_template_exercises || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((e: any) => e.exercises.name),
  }));

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

      {templates.length === 0 ? (
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
