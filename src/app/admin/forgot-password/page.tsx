"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { BackToSite } from "@/components/BackToSite";

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
    <main className="relative flex min-h-screen items-center justify-center bg-sand-50 px-6">
      <BackToSite />
      <div className="w-full max-w-sm">
        <div className="text-center">
          <BrandMark stacked className="mx-auto h-20" />
          <h1 className="mt-2 text-lg font-medium text-sand-800">Reset your password</h1>
        </div>

        {sent ? (
          <div className="mt-6 rounded-2xl border border-sand-200 bg-white p-6 text-center shadow-card">
            <p className="text-sm text-sand-600">
              If an account exists for <strong>{email}</strong>, a reset link is on its way — check
              your inbox.
            </p>
            <Link href="/admin/login" className="mt-4 inline-block text-sm text-brand-800 hover:underline">
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4 rounded-2xl border border-sand-200 bg-white p-6 shadow-card"
          >
            <div>
              <label className="text-sm font-medium text-sand-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-sand-300 px-3.5 py-2.5 text-sm focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700"
                required
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-800 py-2.5 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
            <Link href="/admin/login" className="block text-center text-sm text-sand-500 hover:text-sand-800">
              ← Back to sign in
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
