"use client";

import { createClient } from "@/lib/supabase/client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PasswordInput } from "@/components/PasswordInput";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="font-display text-2xl text-emerald-900">Grovi</p>
          <h1 className="mt-2 text-lg font-medium text-stone-800">Staff sign in</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-card"
        >
          <div>
            <label className="text-sm font-medium text-stone-700">Email</label>
            <input
              type="email"
              placeholder="you@property.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-stone-700">Password</label>
              <Link href="/admin/forgot-password" className="text-xs text-emerald-800 hover:underline">
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              name="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
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
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
