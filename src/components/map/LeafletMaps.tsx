"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import {
  CircleMarker,
  LayersControl,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLng, TreePin } from "./types";

// Everything Leaflet-specific lives in this one file (loaded client-side
// only, via ./index.tsx) — swapping to Google Maps later means replacing
// this file, not the pages that use it.

const PIN_COLOR = "#065f46"; // emerald-800, the primary brand color

function BaseLayers({ defaultSatellite }: { defaultSatellite: boolean }) {
  return (
    <LayersControl position="topright">
      <LayersControl.BaseLayer checked={!defaultSatellite} name="Map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
      </LayersControl.BaseLayer>
      <LayersControl.BaseLayer checked={defaultSatellite} name="Satellite">
        <TileLayer
          attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
      </LayersControl.BaseLayer>
    </LayersControl>
  );
}

function FitToPins({ pins }: { pins: TreePin[] }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length === 0) return;
    const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
  }, [map, pins]);
  return null;
}

/** Read-only map of tree pins, each with a popup linking to its tree page. */
export function TreePinsMap({
  pins,
  className,
  satellite = false,
}: {
  pins: TreePin[];
  className?: string;
  satellite?: boolean;
}) {
  return (
    <div className={`relative z-0 overflow-hidden ${className ?? ""}`}>
      <MapContainer
        center={pins[0] ? [pins[0].lat, pins[0].lng] : [0, 0]}
        zoom={pins[0] ? 15 : 2}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <BaseLayers defaultSatellite={satellite} />
        <FitToPins pins={pins} />
        {pins.map((pin) => (
          <CircleMarker
            key={pin.code}
            center={[pin.lat, pin.lng]}
            radius={8}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: PIN_COLOR, fillOpacity: 1 }}
          >
            <Popup>
              <div className="min-w-[140px]">
                {pin.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pin.photoUrl} alt="" className="mb-2 h-20 w-full rounded object-cover" />
                )}
                <p className="font-medium text-stone-900">{pin.title}</p>
                {pin.subtitle && <p className="text-xs text-stone-500">{pin.subtitle}</p>}
                <a href={pin.href} className="mt-1 inline-block text-xs text-emerald-800">
                  View tree →
                </a>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

const pickerIcon = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:9999px;background:${PIN_COLOR};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function PickerEvents({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
}) {
  const map = useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  // Follow updates coming from outside the map (GPS capture, typed
  // coordinates) — but don't yank the view around while the pin is being
  // dragged within what's already on screen.
  useEffect(() => {
    if (!value) return;
    if (!map.getBounds().contains([value.lat, value.lng])) {
      map.setView([value.lat, value.lng], Math.max(map.getZoom(), 18));
    }
  }, [map, value]);
  return null;
}

/**
 * Manual pin adjustment against a satellite basemap — the doc's fix for GPS
 * drift under canopy. Click anywhere or drag the pin to move it.
 */
export function PinPicker({
  value,
  onChange,
  fallbackCenter,
  className,
}: {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
  fallbackCenter?: LatLng | null;
  className?: string;
}) {
  const start = value ?? fallbackCenter;
  return (
    <div className={`relative z-0 overflow-hidden ${className ?? ""}`}>
      <MapContainer
        center={start ? [start.lat, start.lng] : [0, 0]}
        zoom={value ? 18 : start ? 16 : 2}
        className="h-full w-full"
      >
        <BaseLayers defaultSatellite />
        <PickerEvents value={value} onChange={onChange} />
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            icon={pickerIcon}
            draggable
            eventHandlers={{
              dragend(e) {
                const ll = (e.target as L.Marker).getLatLng();
                onChange({ lat: ll.lat, lng: ll.lng });
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
