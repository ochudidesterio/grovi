"use server";

import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface SetLocationResult {
  error?: string;
}

// GPS is optional at planting (no fix under canopy, permission denied,
// staff in a hurry) — this is where it gets filled in or corrected later.
export async function setTreeLocation(formData: FormData): Promise<SetLocationResult> {
  const profile = await getCurrentProfile();
  if (!profile?.property_id) {
    return { error: "Your account isn't linked to a property yet. Contact an admin." };
  }

  const tagCode = (formData.get("tag_code") as string)?.trim();
  const clear = formData.get("clear") === "1";
  const lat = parseFloat(formData.get("lat") as string);
  const lng = parseFloat(formData.get("lng") as string);

  if (!clear && (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)) {
    return { error: "Set a valid location first — capture GPS, drop a pin, or type coordinates." };
  }

  const supabase = createClient();

  const { data: tag } = await supabase
    .from("tags")
    .select("id")
    .eq("property_id", profile.property_id)
    .eq("code", tagCode)
    .maybeSingle();
  if (!tag) {
    return { error: `Tag "${tagCode}" wasn't found for your property.` };
  }

  const { data: updated, error } = await supabase
    .from("trees")
    .update(clear ? { gps_lat: null, gps_lng: null } : { gps_lat: lat, gps_lng: lng })
    .eq("tag_id", tag.id)
    .select("id");
  if (error || !updated || updated.length === 0) {
    return { error: "Couldn't save the location. Please try again." };
  }

  redirect(`/admin/trees/${tagCode}`);
}
