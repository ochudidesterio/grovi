"use server";

import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface GenerateBatchResult {
  error?: string;
  batchId?: string;
}

const CODE_WIDTH = 4;

export async function generateTagBatch(formData: FormData): Promise<GenerateBatchResult> {
  const profile = await getCurrentProfile();
  if (!profile?.property_id) {
    return { error: "Your account isn't linked to a property yet. Contact an admin." };
  }

  const prefix = (formData.get("prefix") as string)?.trim().toUpperCase();
  const quantity = parseInt(formData.get("quantity") as string, 10);

  if (!prefix || !/^[A-Z0-9]+$/.test(prefix)) {
    return { error: "Prefix must be letters/numbers only (e.g. TPK)." };
  }
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 500) {
    return { error: "Quantity must be between 1 and 500." };
  }

  const supabase = createClient();

  // Find the highest existing sequence number for this prefix at this
  // property, so a new batch always continues the sequence rather than
  // risking a collision with a previous one.
  const { data: existing } = await supabase
    .from("tags")
    .select("code")
    .eq("property_id", profile.property_id)
    .ilike("code", `${prefix}-%`);

  let nextSeq = 1;
  for (const row of existing ?? []) {
    const match = row.code.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (match) {
      const n = parseInt(match[1], 10);
      if (n >= nextSeq) nextSeq = n + 1;
    }
  }

  const { data: batch, error: batchError } = await supabase
    .from("tag_batches")
    .insert({ property_id: profile.property_id, quantity, prefix })
    .select("id")
    .single();
  if (batchError || !batch) {
    return { error: "Couldn't create the batch. Please try again." };
  }

  const codes = Array.from({ length: quantity }, (_, i) =>
    `${prefix}-${String(nextSeq + i).padStart(CODE_WIDTH, "0")}`
  );

  const { error: tagsError } = await supabase.from("tags").insert(
    codes.map((code) => ({
      property_id: profile.property_id,
      batch_id: batch.id,
      code,
    }))
  );
  if (tagsError) {
    return { error: "Batch created, but generating the tags failed. Contact support." };
  }

  revalidatePath("/admin/tags");
  return { batchId: batch.id };
}
