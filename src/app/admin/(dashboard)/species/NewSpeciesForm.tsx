"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSpecies } from "./actions";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm placeholder:text-stone-400 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700";

export function NewSpeciesForm() {
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
      const result = await createSpecies(formData);
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
    <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
      <h2 className="font-display text-lg text-stone-900">Add a species</h2>
      <p className="mt-1 text-sm text-stone-500">
        Indigenous species, ideally chosen with local nursery or forestry guidance.
      </p>
      <div className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-stone-700">Common name</label>
          <input name="common_name" placeholder="Baobab" className={inputClass} required />
        </div>
        <div>
          <label className="text-sm font-medium text-stone-700">Local name</label>
          <input name="local_name" placeholder="Optional" className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-medium text-stone-700">Significance</label>
          <textarea
            name="significance"
            rows={3}
            placeholder="Cultural or local significance, shown on the tree's public page"
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {done && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Species added.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Saving…" : "Add species"}
      </button>
    </form>
  );
}
