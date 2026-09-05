"use server";

import { createClient } from "@/lib/supabase/server";
import { sendPlantingConfirmationEmail } from "@/lib/email";
import { redirect } from "next/navigation";

export interface PlantTreeResult {
  error?: string;
}

export async function plantTree(formData: FormData): Promise<PlantTreeResult> {
  const supabase = createClient();

  const tagCode = formData.get("tag_code") as string;
  const speciesId = formData.get("species_id") as string;
  const guestName = formData.get("guest_name") as string;
  const guestEmail = formData.get("guest_email") as string;
  const guestCountry = formData.get("guest_country") as string;
  const dedication = formData.get("dedication") as string;
  const consentFullName = formData.get("consent_full_name") === "on";
  const consentDedication = formData.get("consent_dedication") === "on";
  const lat = parseFloat(formData.get("lat") as string);
  const lng = parseFloat(formData.get("lng") as string);
  const photo = formData.get("photo") as File | null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("property_id")
    .eq("id", user?.id)
    .single();

  if (!profile?.property_id) {
    return { error: "Your account isn't linked to a property yet. Contact an admin." };
  }

  // 1. Resolve the tag
  const { data: tag, error: tagError } = await supabase
    .from("tags")
    .select("id, status")
    .eq("property_id", profile.property_id)
    .eq("code", tagCode)
    .single();
  if (tagError || !tag) {
    return { error: `Tag "${tagCode}" wasn't found for your property. Check the code and try again.` };
  }
  if (tag.status === "assigned") {
    return { error: `Tag "${tagCode}" is already assigned to a tree.` };
  }

  // 2. Create the guest record
  const { data: guest, error: guestError } = await supabase
    .from("guests")
    .insert({
      property_id: profile.property_id,
      full_name: guestName,
      display_name: guestName.split(" ")[0], // default: first name only
      email: guestEmail || null,
      country: guestCountry,
      consent_full_name: consentFullName,
      consent_dedication: consentDedication,
    })
    .select("id")
    .single();
  if (guestError || !guest) {
    return { error: "Couldn't save the guest record. Please try again." };
  }

  // 3. Create the tree
  const { data: tree, error: treeError } = await supabase
    .from("trees")
    .insert({
      property_id: profile.property_id,
      tag_id: tag.id,
      species_id: speciesId,
      guest_id: guest.id,
      dedication_message: dedication,
      planting_date: new Date().toISOString().slice(0, 10),
      gps_lat: isNaN(lat) ? null : lat,
      gps_lng: isNaN(lng) ? null : lng,
    })
    .select("id")
    .single();
  if (treeError || !tree) {
    return { error: "Couldn't save the tree record. Please try again." };
  }

  // 4. Upload the planting photo, if one was provided. A failed upload
  // shouldn't strand the tree/tag we already committed — skip the photo
  // and let the planting go through; it can be added later via a
  // quarterly-update entry.
  let photoUrl: string | null = null;
  if (photo && photo.size > 0) {
    const ext = photo.name.split(".").pop();
    const path = `${profile.property_id}/${tagCode}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("tree-photos")
      .upload(path, photo, { contentType: photo.type });
    if (!uploadError) {
      photoUrl = supabase.storage.from("tree-photos").getPublicUrl(path).data.publicUrl;
    }
  }

  // 5. Mark tag assigned + log the planting timeline entry
  await supabase.from("tags").update({ status: "assigned" }).eq("id", tag.id);
  await supabase.from("timeline_entries").insert({
    tree_id: tree.id,
    type: "planting",
    note: "Tree planted.",
    photo_url: photoUrl,
    created_by: user?.id,
  });

  // 6. Confirmation email, best-effort — never blocks the planting itself.
  if (guestEmail) {
    const { data: species } = await supabase
      .from("species")
      .select("common_name")
      .eq("id", speciesId)
      .maybeSingle();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    await sendPlantingConfirmationEmail({
      to: guestEmail,
      guestName: guestName.split(" ")[0],
      treeCode: tagCode,
      speciesName: species?.common_name ?? null,
      publicUrl: `${baseUrl}/t/${tagCode}`,
    });
  }

  redirect(`/t/${tagCode}`);
}
