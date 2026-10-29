"use client";

import { useState, useTransition } from "react";
import { setTreeLocation } from "./actions";
import { LocationCapture } from "@/components/LocationCapture";
import { PinPicker, type LatLng } from "@/components/map";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm placeholder:text-stone-400 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700";
const labelClass = "text-sm font-medium text-stone-700";

export function LocationForm({
  tagCode,
  current,
  fallbackCenter,
}: {
  tagCode: string;
  current: LatLng | null;
  fallbackCenter: LatLng | null;
}) {
  const [point, setPoint] = useState<LatLng | null>(current);
  // Typed coordinates are kept as raw strings so half-typed values like
  // "-1." don't get clobbered; the pin only moves once both parse.
  const [latText, setLatText] = useState(current ? current.lat.toFixed(6) : "");
  const [lngText, setLngText] = useState(current ? current.lng.toFixed(6) : "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function movePin(next: LatLng) {
    setPoint(next);
    setLatText(next.lat.toFixed(6));
    setLngText(next.lng.toFixed(6));
  }

  function onTyped(nextLat: string, nextLng: string) {
    setLatText(nextLat);
    setLngText(nextLng);
    const lat = parseFloat(nextLat);
    const lng = parseFloat(nextLng);
    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      setPoint({ lat, lng });
    }
  }

  function submit(clear: boolean) {
    setError(null);
    const formData = new FormData();
    formData.set("tag_code", tagCode);
    if (clear) formData.set("clear", "1");
    else if (point) {
      formData.set("lat", String(point.lat));
      formData.set("lng", String(point.lng));
    }
    startTransition(async () => {
      const result = await setTreeLocation(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="mt-8 space-y-6">
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
        <h2 className="font-display text-lg text-stone-900">At the tree</h2>
        <p className="mt-1 text-sm text-stone-500">
          Standing next to it? Capture GPS from this phone, then nudge the pin if it&apos;s off.
        </p>
        <div className="mt-4">
          <LocationCapture onCapture={(lat, lng) => movePin({ lat, lng })} />
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
        <h2 className="font-display text-lg text-stone-900">Adjust on the map</h2>
        <p className="mt-1 text-sm text-stone-500">
          Tap the map to drop the pin, or drag it. Satellite view helps spot the actual tree.
        </p>
        <div className="mt-4 h-[360px] overflow-hidden rounded-xl border border-stone-200 sm:h-[440px]">
          <PinPicker
            value={point}
            onChange={movePin}
            fallbackCenter={fallbackCenter}
            className="h-full w-full"
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Latitude</label>
            <input
              inputMode="decimal"
              value={latText}
              onChange={(e) => onTyped(e.target.value, lngText)}
              placeholder="-1.292066"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Longitude</label>
            <input
              inputMode="decimal"
              value={lngText}
              onChange={(e) => onTyped(latText, e.target.value)}
              placeholder="36.821946"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => submit(false)}
          disabled={isPending || !point}
          className="w-full rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-medium text-white shadow-card hover:bg-emerald-900 disabled:opacity-60 sm:w-auto"
        >
          {isPending ? "Saving…" : "Save location"}
        </button>
        {current && (
          <button
            type="button"
            onClick={() => submit(true)}
            disabled={isPending}
            className="w-full rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60 sm:w-auto"
          >
            Remove location
          </button>
        )}
      </div>
    </div>
  );
}
