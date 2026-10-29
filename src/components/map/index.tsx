"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` on import, so it can't render on the server —
// these wrappers are what pages import.

function MapLoading({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 ${className ?? ""}`} />;
}

export const TreePinsMap = dynamic(
  () => import("./LeafletMaps").then((m) => m.TreePinsMap),
  { ssr: false, loading: () => <MapLoading className="h-full w-full" /> }
);

export const PinPicker = dynamic(
  () => import("./LeafletMaps").then((m) => m.PinPicker),
  { ssr: false, loading: () => <MapLoading className="h-full w-full" /> }
);

export type { LatLng, TreePin } from "./types";
