import { getCurrentProfile } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TreePinsMap } from "@/components/map";
import { StatCard } from "@/components/StatCard";
import { formatHectares } from "@/lib/geo";
import { toMapZones } from "@/lib/zones";
import { loadZonesAndTrees } from "./data";

export default async function ZonesPage() {
  const profile = await getCurrentProfile();
  if (!profile?.property_id) notFound();

  const { zones, pins } = await loadZonesAndTrees(profile.property_id);

  const totalArea = zones.reduce((s, z) => s + z.area_m2, 0);
  const inZones = zones.reduce((s, z) => s + z.treeCount, 0);
  const outside = pins.length - inZones;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-sand-900">Planting zones</h1>
          <p className="mt-1 text-sand-500">
            The areas guests plant in — outlined on the public map with their size and tree count.
          </p>
        </div>
        <Link
          href="/admin/zones/new"
          className="w-full rounded-lg bg-brand-800 px-4 py-2.5 text-center text-sm font-medium text-white shadow-card hover:bg-brand-900 sm:w-auto"
        >
          + Draw a zone
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Zones" value={zones.length} />
        <StatCard label="Total area" value={zones.length ? formatHectares(totalArea) : "—"} />
        <StatCard label="Trees inside zones" value={inZones} />
        <StatCard
          label="Trees outside any zone"
          value={outside}
          hint={outside > 0 ? "Check their GPS, or widen a zone" : undefined}
        />
      </div>

      <div className="mt-6 h-[380px] overflow-hidden rounded-2xl border border-sand-200 shadow-card sm:h-[460px]">
        <TreePinsMap satellite pins={pins} zones={toMapZones(zones)} className="h-full w-full" />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-sand-200 bg-white shadow-card">
        {zones.length === 0 ? (
          <p className="p-6 text-sm text-sand-500">
            No zones yet.{" "}
            <Link href="/admin/zones/new" className="text-brand-800 underline">
              Draw the first one
            </Link>{" "}
            on the satellite map.
          </p>
        ) : (
          <table className="w-full min-w-[520px] text-sm">
            <thead className="border-b border-sand-100 text-left text-xs uppercase tracking-wide text-sand-400">
              <tr>
                <th className="px-5 py-3 font-medium">Zone</th>
                <th className="px-5 py-3 text-right font-medium">Area</th>
                <th className="px-5 py-3 text-right font-medium">Trees</th>
                <th className="px-5 py-3 text-right font-medium">Per hectare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {zones.map((z) => (
                <tr key={z.id} className="hover:bg-sand-50">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/zones/${z.id}`} className="font-medium text-sand-900 hover:text-brand-800">
                      {z.name}
                    </Link>
                    {z.description && <p className="text-xs text-sand-500">{z.description}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-sand-700">{formatHectares(z.area_m2)}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-sand-700">{z.treeCount}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-sand-700">
                    {z.perHectare !== null ? z.perHectare.toFixed(1) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
