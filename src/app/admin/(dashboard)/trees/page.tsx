import { createClient } from "@/lib/supabase/server";
import { TreeTable, type TreeRow } from "@/components/TreeTable";
import Link from "next/link";

export default async function AdminTreesPage() {
  const supabase = createClient();

  const { data: trees } = await supabase
    .from("trees")
    .select(
      "id, planting_date, status, replant_count, tags(code), species(common_name), guests(display_name, full_name)"
    )
    .order("planting_date", { ascending: false });

  const rows: TreeRow[] = (trees ?? []).map((t) => {
    const tag = Array.isArray(t.tags) ? t.tags[0] : t.tags;
    const species = Array.isArray(t.species) ? t.species[0] : t.species;
    const guest = Array.isArray(t.guests) ? t.guests[0] : t.guests;
    return {
      id: t.id,
      code: tag?.code ?? "—",
      species: species?.common_name ?? "Unknown",
      guest: guest?.full_name ?? guest?.display_name ?? "—",
      plantingDate: t.planting_date,
      status: t.status,
      replantCount: t.replant_count,
    };
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-stone-900">Trees</h1>
          <p className="mt-1 text-stone-500">Every tree planted at this property.</p>
        </div>
        <Link
          href="/admin/trees/new"
          className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white shadow-card hover:bg-emerald-900"
        >
          + Plant a tree
        </Link>
      </div>

      <div className="mt-6">
        <TreeTable rows={rows} />
      </div>
    </div>
  );
}
