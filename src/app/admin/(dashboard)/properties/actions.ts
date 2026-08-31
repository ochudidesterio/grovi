"use server";

import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CreatePropertyResult {
  error?: string;
}

export async function createProperty(formData: FormData): Promise<CreatePropertyResult> {
  const profile = await getCurrentProfile();
  if (profile?.role !== "super_admin") {
    return { error: "Only super admins can create properties." };
  }

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim().toLowerCase();
  const brandColor = (formData.get("brand_color") as string) || null;

  if (!name || !slug) {
    return { error: "Name and slug are required." };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: "Slug can only contain lowercase letters, numbers, and hyphens." };
  }

  // Regular RLS-scoped client — the "super admin manage properties" insert
  // policy enforces this at the database level too, not just here.
  const supabase = createClient();
  const { error } = await supabase.from("properties").insert({
    name,
    slug,
    brand_color: brandColor,
  });

  if (error) {
    return {
      error: error.code === "23505" ? `Slug "${slug}" is already in use.` : "Couldn't create the property.",
    };
  }

  revalidatePath("/admin/properties");
  return {};
}
