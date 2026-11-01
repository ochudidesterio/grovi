import "server-only";
import { createClient } from "@/lib/supabase/server";
import { treesToPins, zoneStats, type ZoneRow } from "@/lib/zones";

/** Zones + located alive trees for the signed-in staff member's property. */
export async function loadZonesAndTrees(propertyId: string) {
  const supabase = createClient();

  const [{ data: zones }, { data: trees }] = await Promise.all([
    supabase
      .from("planting_zones")
      .select("id, name, description, boundary, area_m2")
      .eq("property_id", propertyId)
      .order("created_at"),
    supabase
      .from("trees")
      .select("gps_lat, gps_lng, tags(code), species(common_name)")
      .eq("property_id", propertyId)
      .eq("status", "alive")
      .not("gps_lat", "is", null),
  ]);

  const pins = treesToPins(
    (trees ?? []).map((t) => {
      const tag = Array.isArray(t.tags) ? t.tags[0] : t.tags;
      const species = Array.isArray(t.species) ? t.species[0] : t.species;
      return {
        code: tag?.code ?? "",
        lat: t.gps_lat,
        lng: t.gps_lng,
        title: species?.common_name ?? "A tree",
        subtitle: tag?.code,
        href: `/admin/trees/${tag?.code}`,
      };
    })
  );

  return { zones: zoneStats((zones ?? []) as ZoneRow[], pins), pins };
}
