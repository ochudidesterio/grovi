// Small geometry helpers for planting zones — no turf/GIS dependency needed
// at this scale (a handful of zones, hundreds of trees).

/** [lat, lng] — the order Leaflet uses, and what planting_zones.boundary stores. */
export type Ring = [number, number][];

const EARTH_RADIUS_M = 6378137;
const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Geodesic area of a polygon ring in m² — the spherical-excess formula
 * Leaflet.draw uses. Accurate to well under 1% at reserve scale.
 */
export function ringAreaM2(ring: Ring): number {
  if (ring.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const [lat1, lng1] = ring[i];
    const [lat2, lng2] = ring[(i + 1) % ring.length];
    area += rad(lng2 - lng1) * (2 + Math.sin(rad(lat1)) + Math.sin(rad(lat2)));
  }
  return Math.abs((area * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
}

/** Ray-casting point-in-polygon. Fine for small, non-self-intersecting zones. */
export function pointInRing(lat: number, lng: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i];
    const [yj, xj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export function m2ToHectares(m2: number): number {
  return m2 / 10_000;
}

/** "2.4 ha", "0.35 ha", "1,250 ha" — precision that reads naturally at each scale. */
export function formatHectares(m2: number): string {
  const ha = m2ToHectares(m2);
  if (ha >= 100) return `${Math.round(ha).toLocaleString("en")} ha`;
  if (ha >= 10) return `${ha.toFixed(1)} ha`;
  return `${ha.toFixed(2)} ha`;
}

/** Trees per hectare, or null when there's no area to divide by. */
export function density(treeCount: number, areaM2: number): number | null {
  const ha = m2ToHectares(areaM2);
  return ha > 0 ? treeCount / ha : null;
}
