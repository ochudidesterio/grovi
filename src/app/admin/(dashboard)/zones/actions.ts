"use server";

import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { ringAreaM2, type Ring } from "@/lib/geo";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export interface ZoneResult {
  error?: string;
}

function parseRing(raw: string): Ring | null {
  try {
    const ring = JSON.parse(raw);
    if (!Array.isArray(ring) || ring.length < 3) return null;
    for (const p of ring) {
      if (
        !Array.isArray(p) ||
        p.length !== 2 ||
        typeof p[0] !== "number" ||
        typeof p[1] !== "number" ||
        Math.abs(p[0]) > 90 ||
        Math.abs(p[1]) > 180
      ) {
        return null;
      }
    }
    return ring as Ring;
  } catch {
    return null;
  }
}

export async function saveZone(formData: FormData): Promise<ZoneResult> {
  const profile = await getCurrentProfile();
  if (!profile?.property_id) {
    return { error: "Your account isn't linked to a property yet. Contact an admin." };
  }

  const id = (formData.get("id") as string) || null;
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const ring = parseRing(formData.get("boundary") as string);

  if (!name) return { error: "Give the zone a name." };
  if (!ring) return { error: "Trace the zone on the map — at least 3 corners." };

  // Area is computed here, not trusted from the browser.
  const row = { name, description, boundary: ring, area_m2: ringAreaM2(ring) };

  const supabase = createClient();
  const { error } = id
    ? await supabase.from("planting_zones").update(row).eq("id", id).eq("property_id", profile.property_id)
    : await supabase.from("planting_zones").insert({ ...row, property_id: profile.property_id });
  if (error) return { error: "Couldn't save the zone. Please try again." };

  revalidatePath("/admin/zones");
  redirect("/admin/zones");
}

export async function deleteZone(formData: FormData): Promise<ZoneResult> {
  const profile = await getCurrentProfile();
  if (!profile?.property_id) return { error: "Not allowed." };

  const supabase = createClient();
  const { error } = await supabase
    .from("planting_zones")
    .delete()
    .eq("id", formData.get("id") as string)
    .eq("property_id", profile.property_id);
  if (error) return { error: "Couldn't delete the zone." };

  revalidatePath("/admin/zones");
  redirect("/admin/zones");
}
