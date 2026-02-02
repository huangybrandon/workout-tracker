import { createClient } from "@/lib/supabase/server";
import { BodyweightClient } from "@/components/bodyweight/bodyweight-client";

export default async function BodyweightPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("bodyweight_entries")
    .select("*")
    .order("date", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Bodyweight</h1>
      <BodyweightClient initialEntries={data || []} />
    </div>
  );
}
