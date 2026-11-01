"use client";

import { useState, useTransition } from "react";
import { deleteZone, saveZone } from "./actions";
import { ZoneEditor, type MapZone, type TreePin } from "@/components/map";
import { formatHectares, ringAreaM2, type Ring } from "@/lib/geo";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-sand-300 px-3.5 py-2.5 text-sm placeholder:text-sand-400 focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700";
const labelClass = "text-sm font-medium text-sand-700";
const secondaryButton =
  "rounded-lg border border-sand-300 px-3 py-2 text-sm font-medium text-sand-700 hover:bg-sand-50 disabled:opacity-50";

export function ZoneForm({
  zone,
  otherZones,
  pins,
}: {
  zone?: { id: string; name: string; description: string | null; boundary: Ring };
  otherZones: MapZone[];
  pins: TreePin[];
}) {
  const [ring, setRing] = useState<Ring>(zone?.boundary ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("boundary", JSON.stringify(ring));
    startTransition(async () => {
      const result = await saveZone(formData);
      if (result?.error) setError(result.error);
    });
  }

  function remove() {
    if (!zone || !confirm(`Delete "${zone.name}"? Trees inside it aren't affected.`)) return;
    const formData = new FormData();
    formData.set("id", zone.id);
    startTransition(async () => {
      const result = await deleteZone(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-6">
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {zone && <input type="hidden" name="id" value={zone.id} />}

      <section className="rounded-2xl border border-sand-200 bg-white p-6 shadow-card">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Zone name</label>
            <input
              name="name"
              required
              defaultValue={zone?.name}
              placeholder="e.g. River Bend Restoration"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Short description</label>
            <input
              name="description"
              defaultValue={zone?.description ?? ""}
              placeholder="Optional — shown to guests on the map"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-sand-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-sand-900">Trace the area</h2>
            <p className="mt-1 text-sm text-sand-500">
              Tap the map to add each corner, drag a corner to adjust. Dashed outlines are your other zones.
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl text-sand-900">{ring.length >= 3 ? formatHectares(ringAreaM2(ring)) : "—"}</p>
            <p className="text-xs text-sand-400">{ring.length} corners</p>
          </div>
        </div>
        <div className="mt-4 h-[420px] overflow-hidden rounded-xl border border-sand-200 sm:h-[520px]">
          <ZoneEditor value={ring} onChange={setRing} otherZones={otherZones} pins={pins} className="h-full w-full" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={secondaryButton} disabled={!ring.length} onClick={() => setRing(ring.slice(0, -1))}>
            Undo last corner
          </button>
          <button type="button" className={secondaryButton} disabled={!ring.length} onClick={() => setRing([])}>
            Clear
          </button>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending || ring.length < 3}
          className="w-full rounded-lg bg-brand-800 px-5 py-2.5 text-sm font-medium text-white shadow-card hover:bg-brand-900 disabled:opacity-60 sm:w-auto"
        >
          {isPending ? "Saving…" : zone ? "Save zone" : "Create zone"}
        </button>
        {zone && (
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            className="w-full rounded-lg px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 sm:w-auto"
          >
            Delete zone
          </button>
        )}
      </div>
    </form>
  );
}
