"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton({ full = false }: { full?: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className={
        full
          ? "w-full rounded-lg border border-stone-300 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          : "text-sm text-stone-500 hover:text-stone-800 disabled:opacity-50"
      }
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
