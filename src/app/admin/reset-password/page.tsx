"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/PasswordInput";
import { BrandMark } from "@/components/BrandMark";
import { BackToSite } from "@/components/BackToSite";

// Reached either from a password-reset email or a staff-invite email — both
// land here via /admin/auth/callback, which has already exchanged the code
// for a real session by the time this page renders.
export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-sand-50 px-6">
      <BackToSite />
      <div className="w-full max-w-sm">
        <div className="text-center">
          <BrandMark stacked className="mx-auto h-20" />
          <h1 className="mt-2 text-lg font-medium text-sand-800">Set a new password</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-sand-200 bg-white p-6 shadow-card"
        >
          <PasswordInput
            name="password"
            label="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <PasswordInput
            name="confirm_password"
            label="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-800 py-2.5 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
          >
            {loading ? "Saving…" : "Set new password"}
          </button>
        </form>
      </div>
    </main>
  );
}
