"use server";

import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface FollowupResult {
  error?: string;
}

export async function submitFollowup(formData: FormData): Promise<FollowupResult> {
  const profile = await getCurrentProfile();
  if (!profile?.property_id) {
    return { error: "Your account isn't linked to a property yet. Contact an admin." };
  }

  const tagCode = (formData.get("tag_code") as string)?.trim();
  const kind = formData.get("kind") as "quarterly" | "mortality" | "replacement";
  const note = (formData.get("note") as string)?.trim() || null;
  const newSpeciesId = formData.get("new_species_id") as string;
  const photo = formData.get("photo") as File | null;

  if (!tagCode || !kind) {
    return { error: "Tag code and follow-up type are required." };
  }
  if (kind === "replacement" && !newSpeciesId) {
    return { error: "Select the species that was replanted." };
  }

  const supabase = createClient();

  // Resolve the tag → tree. Unlike planting, a follow-up needs a tag that's
  // already assigned — there must be an existing tree to follow up on.
  const { data: tag, error: tagError } = await supabase
    .from("tags")
    .select("id, status")
    .eq("property_id", profile.property_id)
    .eq("code", tagCode)
    .single();
  if (tagError || !tag) {
    return { error: `Tag "${tagCode}" wasn't found for your property.` };
  }
  if (tag.status !== "assigned") {
    return { error: `Tag "${tagCode}" has no tree planted on it yet — use "Plant a tree" instead.` };
  }

  const { data: tree, error: treeError } = await supabase
    .from("trees")
    .select("id, replant_count")
    .eq("tag_id", tag.id)
    .single();
  if (treeError || !tree) {
    return { error: "Couldn't find the tree record for this tag. Please try again." };
  }

  // Photo upload — same best-effort behavior as planting: a failed upload
  // shouldn't block the rest of the record from being saved.
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

  if (kind === "quarterly") {
    await supabase.from("timeline_entries").insert({
      tree_id: tree.id,
      type: "quarterly",
      photo_url: photoUrl,
      note,
    });
  } else if (kind === "mortality") {
    await supabase.from("trees").update({ status: "dead" }).eq("id", tree.id);
    await supabase.from("timeline_entries").insert({
      tree_id: tree.id,
      type: "note",
      photo_url: photoUrl,
      note: note ?? "Tree recorded as dead.",
    });
  } else if (kind === "replacement") {
    // Same-tree-ID replant rule: update in place, never a new trees row.
    await supabase
      .from("trees")
      .update({
        species_id: newSpeciesId,
        status: "alive",
        replant_count: tree.replant_count + 1,
        planting_date: new Date().toISOString().slice(0, 10),
      })
      .eq("id", tree.id);
    await supabase.from("timeline_entries").insert({
      tree_id: tree.id,
      type: "replacement",
      photo_url: photoUrl,
      note: note ?? "Tree replanted.",
    });
  }

  redirect(`/admin/trees/${tagCode}`);
}
