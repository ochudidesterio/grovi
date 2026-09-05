import { createClient } from "@/lib/supabase/server";
import { PlantTreeForm } from "./PlantTreeForm";
import Link from "next/link";

interface Props {
  searchParams: { tag?: string };
}

export default async function NewTreePage({ searchParams }: Props) {
  const supabase = createClient();
  const { data: species } = await supabase
    .from("species")
    .select("id, common_name")
    .order("common_name");

  return (
    <div className="lg:max-w-[1500px]">
      <Link href="/admin/trees" className="text-sm text-stone-500 hover:text-stone-800">
        ← Back to trees
      </Link>
      <h1 className="mt-2 font-display text-3xl text-stone-900">Plant a tree</h1>
      <p className="mt-1 text-stone-500">
        Capture GPS and a photo right from your phone — this is the field tool.
      </p>

      <PlantTreeForm species={species ?? []} initialTagCode={searchParams.tag} />
    </div>
  );
}
