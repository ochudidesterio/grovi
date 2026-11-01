import { density, formatHectares, pointInRing, type Ring } from "@/lib/geo";
import type { MapZone, TreePin } from "@/components/map";

export interface ZoneRow {
  id: string;
  name: string;
  description: string | null;
  boundary: Ring;
  area_m2: number;
}

export interface ZoneStats extends ZoneRow {
  treeCount: number;
  perHectare: number | null;
}

/** Trees inside each zone, by GPS — a tree outside every zone simply isn't counted in one. */
export function zoneStats(zones: ZoneRow[], trees: { lat: number; lng: number }[]): ZoneStats[] {
  return zones.map((z) => {
    const treeCount = trees.filter((t) => pointInRing(t.lat, t.lng, z.boundary)).length;
    return { ...z, treeCount, perHectare: density(treeCount, z.area_m2) };
  });
}

export function zoneLabel(z: ZoneStats): string {
  return `${z.name} · ${formatHectares(z.area_m2)} · ${z.treeCount} ${z.treeCount === 1 ? "tree" : "trees"}`;
}

export function toMapZones(zones: ZoneStats[], withLabels = true): MapZone[] {
  return zones.map((z) => ({ id: z.id, boundary: z.boundary, label: withLabels ? zoneLabel(z) : undefined }));
}

export function treesToPins(
  trees: {
    code: string;
    lat: number | null;
    lng: number | null;
    title: string;
    subtitle?: string;
    photoUrl?: string | null;
    href?: string;
  }[]
): TreePin[] {
  return trees
    .filter((t) => t.lat != null && t.lng != null)
    .map((t) => ({
      code: t.code,
      lat: t.lat as number,
      lng: t.lng as number,
      title: t.title,
      subtitle: t.subtitle,
      photoUrl: t.photoUrl,
      href: t.href ?? `/t/${t.code}`,
    }));
}
