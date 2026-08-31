"use client";

import { useState, useTransition } from "react";
import { plantTree } from "./actions";
import { LocationCapture } from "@/components/LocationCapture";
import { TagPicker } from "@/components/TagPicker";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm placeholder:text-stone-400 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700";
const labelClass = "text-sm font-medium text-stone-700";

export function PlantTreeForm({ species }: { species: { id: string; common_name: string }[] }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await plantTree(formData);
      if (result?.error) setError(result.error);
      // on success the action redirects itself — nothing more to do here
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
        <h2 className="font-display text-lg text-stone-900">Tag &amp; species</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Tag code</label>
            <TagPicker status="unassigned" />
          </div>
          <div>
            <label className={labelClass}>Species</label>
            <select name="species_id" className={inputClass} required defaultValue="">
              <option value="" disabled>
                Select a species
              </option>
              {species.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.common_name}
                </option>
              ))}
            </select>
            {species.length === 0 && (
              <p className="mt-1 text-xs text-amber-700">
                No species set up yet — add one in Supabase before planting.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
        <h2 className="font-display text-lg text-stone-900">Guest</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Guest name</label>
            <input name="guest_name" className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Guest country</label>
            <input name="guest_country" className={inputClass} />
          </div>
        </div>
        <div className="mt-4">
          <label className={labelClass}>Guest email</label>
          <input name="guest_email" type="email" placeholder="Optional — for growth update emails" className={inputClass} />
          <p className="mt-1 text-xs text-stone-400">
            Used to send the guest photo updates as their tree grows. Never shown publicly.
          </p>
        </div>
        <div className="mt-4">
          <label className={labelClass}>Dedication message</label>
          <textarea name="dedication" rows={3} className={inputClass} />
        </div>
        <div className="mt-4 space-y-2">
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" name="consent_full_name" className="rounded border-stone-300 text-emerald-700" />
            Guest consents to showing full name publicly
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" name="consent_dedication" className="rounded border-stone-300 text-emerald-700" />
            Guest consents to showing dedication publicly
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
        <h2 className="font-display text-lg text-stone-900">Location &amp; photo</h2>
        <div className="mt-4">
          <LocationCapture />
        </div>
        <div className="mt-4">
          <label className={labelClass}>Planting photo</label>
          <input
            name="photo"
            type="file"
            accept="image/*"
            capture="environment"
            className="mt-1.5 w-full rounded-lg border border-dashed border-stone-300 px-3.5 py-3 text-sm text-stone-500 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-800 hover:file:bg-emerald-100"
          />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-medium text-white shadow-card hover:bg-emerald-900 disabled:opacity-60 sm:w-auto"
        >
          {isPending ? "Planting…" : "Plant tree"}
        </button>
      </div>
    </form>
  );
}
