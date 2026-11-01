import { getCurrentProfile } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { toMapZones } from "@/lib/zones";
import { loadZonesAndTrees } from "../data";
import { ZoneForm } from "../ZoneForm";

export default async function NewZonePage() {
  const profile = await getCurrentProfile();
  if (!profile?.property_id) notFound();

  const { zones, pins } = await loadZonesAndTrees(profile.property_id);

  return (
    <div className="lg:max-w-[1500px]">
      <Link href="/admin/zones" className="text-sm text-sand-500 hover:text-sand-800">
        ← Back to zones
      </Link>
      <h1 className="mt-2 font-display text-3xl text-sand-900">Draw a zone</h1>
      <ZoneForm otherZones={toMapZones(zones, false)} pins={pins} />
    </div>
  );
}
