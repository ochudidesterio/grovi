import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Used in server components / route handlers for admin pages.
// Runs as the logged-in staff member, so RLS policies from schema.sql apply.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component during render — safe to ignore,
            // middleware refreshes the session instead
          }
        },
      },
    }
  );
}

// Used only for public pages (/t/[code], /p/[slug]) that read across all
// properties without a logged-in session — anon key, subject to the
// "public can read" policies in schema.sql, never the service role key.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Convenience for pages/actions that need to know who's signed in and their
// role — e.g. gating the super_admin-only Properties/Staff screens.
export async function getCurrentProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, property_id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  return profile ? { ...profile, userId: user.id } : null;
}
