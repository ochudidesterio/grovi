"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateTagBatch } from "./actions";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm placeholder:text-stone-400 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700";

export function NewBatchForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await generateTagBatch(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      form.reset();
      router.refresh();
      if (result.batchId) {
        router.push(`/admin/tags/${result.batchId}`);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
      <h2 className="font-display text-lg text-stone-900">Generate a new batch</h2>
      <p className="mt-1 text-sm text-stone-500">
        Codes continue automatically from the highest existing number for this prefix —
        no manual bookkeeping, no collisions.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-stone-700">Prefix</label>
          <input name="prefix" placeholder="TPK" maxLength={8} className={inputClass} required />
        </div>
        <div>
          <label className="text-sm font-medium text-stone-700">Quantity</label>
          <input name="quantity" type="number" min={1} max={500} defaultValue={10} className={inputClass} required />
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
      >
        {isPending ? "Generating…" : "Generate batch"}
      </button>
    </form>
  );
}
