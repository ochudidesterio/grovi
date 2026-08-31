import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { FollowupForm } from "./FollowupForm";
import Link from "next/link";

interface Props {
  params: { code: string };
}

export default async function TreeFollowupPage({ params }: Props) {
  const profile = await getCurrentProfile();
  if (!profile?.property_id) notFound();

  const supabase = createClient();

  const { data: tag } = await supabase
    .from("tags")
    .select("status, trees(status, species_id, species(common_name))")
    .eq("property_id", profile.property_id)
    .eq("code", params.code)
    .maybeSingle();
  if (!tag || tag.status !== "assigned") notFound();

  const tree = Array.isArray(tag.trees) ? tag.trees[0] : tag.trees;
  const species = Array.isArray(tree?.species) ? tree?.species[0] : tree?.species;

  const { data: allSpecies } = await supabase
    .from("species")
    .select("id, common_name")
    .order("common_name");

  return (
    <div className="lg:max-w-[1500px]">
      <Link href={`/admin/trees/${params.code}`} className="text-sm text-stone-500 hover:text-stone-800">
        ← Back to {params.code}
      </Link>
      <h1 className="mt-2 font-display text-3xl text-stone-900">Log a follow-up</h1>
      <p className="mt-1 text-stone-500">
        {params.code} · {species?.common_name ?? "Unknown species"}
      </p>

      <FollowupForm
        tagCode={params.code}
        species={allSpecies ?? []}
        currentSpeciesId={tree?.species_id ?? null}
        currentStatus={tree?.status ?? "alive"}
      />
    </div>
  );
}
