"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProperty } from "./actions";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-sand-300 px-3.5 py-2.5 text-sm placeholder:text-sand-400 focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700";

export function NewPropertyForm() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await createProperty(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setDone(true);
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-sand-200 bg-white p-6 shadow-card">
      <h2 className="font-display text-lg text-sand-900">New property</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-sand-700">Name</label>
          <input name="name" placeholder="Coastal Retreat" className={inputClass} required />
        </div>
        <div>
          <label className="text-sm font-medium text-sand-700">Slug</label>
          <input name="slug" placeholder="coastal-retreat" className={inputClass} required />
          <p className="mt-1 text-xs text-sand-400">Public grove URL: /p/&lt;slug&gt;</p>
        </div>
      </div>
      <div className="mt-4 max-w-[10rem]">
        <label className="text-sm font-medium text-sand-700">Brand color</label>
        <input name="brand_color" type="color" defaultValue="#065f46" className="mt-1.5 h-10 w-full rounded-lg border border-sand-300" />
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {done && <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">Property created.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 w-full rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Creating…" : "Create property"}
      </button>
    </form>
  );
}
