import { createClient } from "@/lib/supabase/server";
import { PlantTreeForm } from "./PlantTreeForm";
import Link from "next/link";

export default async function NewTreePage() {
  const supabase = createClient();
  const { data: species } = await supabase
    .from("species")
    .select("id, common_name")
    .order("common_name");

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/trees" className="text-sm text-stone-500 hover:text-stone-800">
        ← Back to trees
      </Link>
      <h1 className="mt-2 font-display text-3xl text-stone-900">Plant a tree</h1>
      <p className="mt-1 text-stone-500">
        This form is the Phase 1 stand-in for the capture app — same write path, done by hand.
      </p>

      <PlantTreeForm species={species ?? []} />
    </div>
  );
}
