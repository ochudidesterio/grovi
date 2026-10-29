import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { LocationForm } from "./LocationForm";
import Link from "next/link";

interface Props {
  params: { code: string };
}

export default async function TreeLocationPage({ params }: Props) {
  const profile = await getCurrentProfile();
  if (!profile?.property_id) notFound();

  const supabase = createClient();

  const { data: tag } = await supabase
    .from("tags")
    .select("status, trees(gps_lat, gps_lng, species(common_name))")
    .eq("property_id", profile.property_id)
    .eq("code", params.code)
    .maybeSingle();
  if (!tag || tag.status !== "assigned") notFound();

  const tree = Array.isArray(tag.trees) ? tag.trees[0] : tag.trees;
  const species = Array.isArray(tree?.species) ? tree?.species[0] : tree?.species;
  const current =
    tree?.gps_lat != null && tree?.gps_lng != null ? { lat: tree.gps_lat, lng: tree.gps_lng } : null;

  // No location yet → open the map over the rest of the grove instead of
  // the middle of the ocean, so dropping a pin by hand is realistic.
  let fallbackCenter: { lat: number; lng: number } | null = null;
  if (!current) {
    const { data: located } = await supabase
      .from("trees")
      .select("gps_lat, gps_lng")
      .eq("property_id", profile.property_id)
      .not("gps_lat", "is", null)
      .not("gps_lng", "is", null)
      .limit(200);
    if (located && located.length > 0) {
      fallbackCenter = {
        lat: located.reduce((s, t) => s + (t.gps_lat as number), 0) / located.length,
        lng: located.reduce((s, t) => s + (t.gps_lng as number), 0) / located.length,
      };
    }
  }

  return (
    <div className="lg:max-w-[1500px]">
      <Link href={`/admin/trees/${params.code}`} className="text-sm text-stone-500 hover:text-stone-800">
        ← Back to {params.code}
      </Link>
      <h1 className="mt-2 font-display text-3xl text-stone-900">
        {current ? "Adjust location" : "Set location"}
      </h1>
      <p className="mt-1 text-stone-500">
        {params.code} · {species?.common_name ?? "Unknown species"}
      </p>

      <LocationForm tagCode={params.code} current={current} fallbackCenter={fallbackCenter} />
    </div>
  );
}
