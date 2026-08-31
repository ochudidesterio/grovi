"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/auth/callback?next=/admin/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="font-display text-2xl text-emerald-900">Grovi</p>
          <h1 className="mt-2 text-lg font-medium text-stone-800">Reset your password</h1>
        </div>

        {sent ? (
          <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-card">
            <p className="text-sm text-stone-600">
              If an account exists for <strong>{email}</strong>, a reset link is on its way — check
              your inbox.
            </p>
            <Link href="/admin/login" className="mt-4 inline-block text-sm text-emerald-800 hover:underline">
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-card"
          >
            <div>
              <label className="text-sm font-medium text-stone-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                required
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-800 py-2.5 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
            <Link href="/admin/login" className="block text-center text-sm text-stone-500 hover:text-stone-800">
              ← Back to sign in
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
