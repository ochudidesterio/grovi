"use server";

import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CreateSpeciesResult {
  error?: string;
}

export async function createSpecies(formData: FormData): Promise<CreateSpeciesResult> {
  const profile = await getCurrentProfile();
  if (!profile?.property_id) {
    return { error: "Your account isn't linked to a property yet. Contact an admin." };
  }

  const commonName = (formData.get("common_name") as string)?.trim();
  const localName = (formData.get("local_name") as string)?.trim() || null;
  const significance = (formData.get("significance") as string)?.trim() || null;

  if (!commonName) {
    return { error: "Common name is required." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("species").insert({
    property_id: profile.property_id,
    common_name: commonName,
    local_name: localName,
    significance,
  });

  if (error) {
    return { error: "Couldn't save the species. Please try again." };
  }

  revalidatePath("/admin/species");
  return {};
}
