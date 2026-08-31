"use client";

import { useState } from "react";

type Status = "idle" | "locating" | "done" | "error";

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 8000,
    })
  );
}

const READINGS = 3;

/**
 * Averages a few GPS readings rather than trusting a single one — the doc
 * calls for this explicitly ("GPS averaged over multiple readings at
 * capture") since accuracy degrades under canopy. Feeds the result into the
 * form via plain hidden inputs so the server action's FormData parsing
 * doesn't need to change.
 */
export function LocationCapture({
  latName = "lat",
  lngName = "lng",
}: {
  latName?: string;
  lngName?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function capture() {
    if (!("geolocation" in navigator)) {
      setError("This browser doesn't support location capture.");
      setStatus("error");
      return;
    }

    setStatus("locating");
    setError(null);
    setProgress(0);

    const readings: GeolocationPosition[] = [];
    for (let i = 0; i < READINGS; i++) {
      try {
        readings.push(await getPosition());
        setProgress(i + 1);
      } catch {
        // one failed reading isn't fatal — keep trying for the rest
      }
    }

    if (readings.length === 0) {
      setError("Couldn't get a location. Check location permissions and try again.");
      setStatus("error");
      return;
    }

    const avgLat = readings.reduce((sum, p) => sum + p.coords.latitude, 0) / readings.length;
    const avgLng = readings.reduce((sum, p) => sum + p.coords.longitude, 0) / readings.length;
    setLat(avgLat);
    setLng(avgLng);
    setStatus("done");
  }

  return (
    <div>
      <input type="hidden" name={latName} value={lat ?? ""} />
      <input type="hidden" name={lngName} value={lng ?? ""} />

      <button
        type="button"
        onClick={capture}
        disabled={status === "locating"}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
      >
        {status === "locating" ? (
          <>Capturing location… ({progress}/{READINGS})</>
        ) : status === "done" ? (
          <>📍 Recapture location</>
        ) : (
          <>📍 Capture location</>
        )}
      </button>

      {status === "done" && lat !== null && lng !== null && (
        <p className="mt-2 text-xs text-stone-500">
          {lat.toFixed(6)}, {lng.toFixed(6)} — averaged from {READINGS} readings
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
