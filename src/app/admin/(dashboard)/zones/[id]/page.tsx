import { getCurrentProfile } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { toMapZones } from "@/lib/zones";
import { loadZonesAndTrees } from "../data";
import { ZoneForm } from "../ZoneForm";

interface Props {
  params: { id: string };
}

export default async function EditZonePage({ params }: Props) {
  const profile = await getCurrentProfile();
  if (!profile?.property_id) notFound();

  const { zones, pins } = await loadZonesAndTrees(profile.property_id);
  const zone = zones.find((z) => z.id === params.id);
  if (!zone) notFound();

  return (
    <div className="lg:max-w-[1500px]">
      <Link href="/admin/zones" className="text-sm text-sand-500 hover:text-sand-800">
        ← Back to zones
      </Link>
      <h1 className="mt-2 font-display text-3xl text-sand-900">{zone.name}</h1>
      <p className="mt-1 text-sand-500">
        {zone.treeCount} {zone.treeCount === 1 ? "tree" : "trees"} inside
      </p>
      <ZoneForm
        zone={{ id: zone.id, name: zone.name, description: zone.description, boundary: zone.boundary }}
        otherZones={toMapZones(
          zones.filter((z) => z.id !== zone.id),
          false
        )}
        pins={pins}
      />
    </div>
  );
}
