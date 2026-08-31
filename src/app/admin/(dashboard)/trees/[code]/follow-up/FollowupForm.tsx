"use client";

import { useState, useTransition } from "react";
import { submitFollowup } from "./actions";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm placeholder:text-stone-400 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700";
const labelClass = "text-sm font-medium text-stone-700";

type Kind = "quarterly" | "mortality" | "replacement";

const KIND_META: Record<Kind, { label: string; noteLabel: string; notePlaceholder: string }> = {
  quarterly: {
    label: "Quarterly photo",
    noteLabel: "Note",
    notePlaceholder: "Optional — e.g. new growth, healthy leaves",
  },
  mortality: {
    label: "Tree died",
    noteLabel: "Cause",
    notePlaceholder: "Optional — e.g. root rot after heavy rains",
  },
  replacement: {
    label: "Tree replaced",
    noteLabel: "Note",
    notePlaceholder: "Optional",
  },
};

export function FollowupForm({
  tagCode,
  species,
  currentSpeciesId,
  currentStatus,
}: {
  tagCode: string;
  species: { id: string; common_name: string }[];
  currentSpeciesId: string | null;
  currentStatus: "alive" | "dead";
}) {
  // A dead tree is almost always here to be replaced, not re-marked dead or
  // photographed as if it were thriving — default to the action that's
  // actually relevant instead of making staff pick it every time.
  const [kind, setKind] = useState<Kind>(currentStatus === "dead" ? "replacement" : "quarterly");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const meta = KIND_META[kind];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitFollowup(formData);
      if (result?.error) setError(result.error);
      // on success the action redirects itself
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <input type="hidden" name="tag_code" value={tagCode} />

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
        <label className={labelClass}>What happened?</label>
        <div className="mt-1.5 flex flex-col gap-2 rounded-lg border border-stone-300 p-1 sm:flex-row">
          {(Object.keys(KIND_META) as Kind[]).map((k) => {
            const disabled = k === "mortality" && currentStatus === "dead";
            return (
              <button
                key={k}
                type="button"
                onClick={() => !disabled && setKind(k)}
                disabled={disabled}
                title={disabled ? "Already marked dead — record a replacement instead" : undefined}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  kind === k
                    ? "bg-emerald-800 text-white"
                    : disabled
                      ? "cursor-not-allowed text-stone-300"
                      : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                {KIND_META[k].label}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="kind" value={kind} />

        {kind === "replacement" && (
          <div className="mt-4">
            <label className={labelClass}>New species</label>
            <select
              name="new_species_id"
              className={inputClass}
              required
              defaultValue={currentSpeciesId ?? ""}
            >
              <option value="" disabled>
                Select a species
              </option>
              {species.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.common_name}
                </option>
              ))}
            </select>
            {currentSpeciesId && (
              <p className="mt-1 text-xs text-stone-400">Pre-filled with the current species — change it if different.</p>
            )}
          </div>
        )}

        <div className="mt-4">
          <label className={labelClass}>{meta.noteLabel}</label>
          <textarea name="note" rows={3} placeholder={meta.notePlaceholder} className={inputClass} />
        </div>

        <div className="mt-4">
          <label className={labelClass}>Photo</label>
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
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
