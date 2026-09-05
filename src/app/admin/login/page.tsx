"use client";

import { createClient } from "@/lib/supabase/client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PasswordInput } from "@/components/PasswordInput";
import { TreeIllustration } from "@/components/TreeIllustration";

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
    // Only ever redirect within /admin — `next` is attacker-controllable
    // (it's a query param), so an arbitrary URL here would be an open
    // redirect off a real login form.
    const next = searchParams.get("next");
    router.push(next && next.startsWith("/admin") ? next : "/admin");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-stone-50 lg:flex">
      <div className="flex items-center justify-center bg-emerald-900 px-8 py-10 lg:w-1/2 lg:p-8">
        <TreeIllustration className="h-40 w-40 sm:h-52 sm:w-52 lg:h-full lg:max-h-[560px] lg:w-full lg:max-w-lg" />
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:w-1/2 lg:py-16">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <h1 className="text-lg font-medium text-stone-800">Staff sign in</h1>
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
