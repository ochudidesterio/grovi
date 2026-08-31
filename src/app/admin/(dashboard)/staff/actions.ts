"use server";

import { getCurrentProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface CreateStaffResult {
  error?: string;
}

// Staff accounts get a password set directly here rather than via an email
// invite — the capture app (mobile) is where staff will change their own
// password once it exists. Whoever creates the account is responsible for
// telling the staff member their initial password out of band.
export async function createStaff(formData: FormData): Promise<CreateStaffResult> {
  const profile = await getCurrentProfile();
  if (profile?.role !== "super_admin") {
    return { error: "Only super admins can create staff." };
  }

  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const fullName = (formData.get("full_name") as string)?.trim() || null;
  const propertyId = formData.get("property_id") as string;
  const role = formData.get("role") as string;

  if (!email || !password || !propertyId || !role) {
    return { error: "Email, password, property, and role are all required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  // Auth admin operations and the resulting profile row both need to bypass
  // RLS (there's no "insert your own profile" policy — and shouldn't be,
  // since staff can't self-assign roles). We already checked super_admin
  // above; this client trusts that check completely, so nothing past this
  // point should run without it.
  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { error: createError?.message ?? "Couldn't create the account." };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    property_id: propertyId,
    role,
    full_name: fullName,
  });

  if (profileError) {
    return { error: "Account created, but linking the profile failed. Contact support." };
  }

  revalidatePath("/admin/staff");
  return {};
}
