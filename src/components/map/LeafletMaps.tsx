"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import {
  CircleMarker,
  LayersControl,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { BRAND } from "@/lib/brand";
import type { Ring } from "@/lib/geo";
import type { LatLng, MapZone, TreePin } from "./types";

// Everything Leaflet-specific lives in this one file (loaded client-side
// only, via ./index.tsx) — swapping to Google Maps later means replacing
// this file, not the pages that use it.

const PIN_COLOR = BRAND.map.pin;

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

function FitTo({ points }: { points: [number, number][] }) {
  const map = useMap();
  // Keyed on content, not array identity — a parent re-render builds a new
  // array every time, and refitting then would yank the user's view around.
  const key = JSON.stringify(points);
  useEffect(() => {
    const pts = JSON.parse(key) as [number, number][];
    if (pts.length === 0) return;
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 17 });
  }, [map, key]);
  return null;
}

function ZoneLayer({ zones, faded = false }: { zones: MapZone[]; faded?: boolean }) {
  return (
    <>
      {zones.map((z) => (
        <Polygon
          key={z.id}
          positions={z.boundary}
          pathOptions={{
            color: BRAND.map.zoneStroke,
            weight: faded ? 1.5 : 2,
            dashArray: faded ? "4 4" : undefined,
            fillColor: BRAND.map.zoneFill,
            fillOpacity: faded ? 0.08 : 0.18,
          }}
        >
          {z.label && (
            <Tooltip permanent direction="center" className="zone-label">
              {z.label}
            </Tooltip>
          )}
        </Polygon>
      ))}
    </>
  );
}

/** Read-only map of tree pins, each with a popup linking to its tree page. */
export function TreePinsMap({
  pins,
  zones = [],
  className,
  satellite = false,
  scrollZoom = false,
}: {
  pins: TreePin[];
  zones?: MapZone[];
  className?: string;
  satellite?: boolean;
  scrollZoom?: boolean;
}) {
  // Frame the zones when there are any (the area is the story), else the pins.
  const frame: [number, number][] = zones.length
    ? zones.flatMap((z) => z.boundary)
    : pins.map((p) => [p.lat, p.lng]);
  return (
    <div className={`relative z-0 overflow-hidden ${className ?? ""}`}>
      <MapContainer
        center={pins[0] ? [pins[0].lat, pins[0].lng] : [0, 0]}
        zoom={pins[0] ? 15 : 2}
        scrollWheelZoom={scrollZoom}
        className="h-full w-full"
      >
        <BaseLayers defaultSatellite={satellite} />
        <FitTo points={frame} />
        <ZoneLayer zones={zones} />
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
                <p className="font-display text-base text-sand-900">{pin.title}</p>
                {pin.subtitle && <p className="text-xs text-sand-500">{pin.subtitle}</p>}
                <a href={pin.href} className="mt-1 inline-block text-xs text-brand-800">
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

const vertexIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:9999px;background:#fff;border:3px solid ${PIN_COLOR};box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function AddVertexOnClick({ onAdd }: { onAdd: (p: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onAdd([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

/**
 * Trace a planting zone on satellite imagery: tap to add corners, drag a
 * corner to move it. Other zones and the trees show faintly for reference.
 */
export function ZoneEditor({
  value,
  onChange,
  otherZones = [],
  pins = [],
  className,
}: {
  value: Ring;
  onChange: (ring: Ring) => void;
  otherZones?: MapZone[];
  pins?: TreePin[];
  className?: string;
}) {
  const frame: [number, number][] = value.length
    ? value
    : [...otherZones.flatMap((z) => z.boundary), ...pins.map((p) => [p.lat, p.lng] as [number, number])];

  return (
    <div className={`relative z-0 overflow-hidden ${className ?? ""}`}>
      <MapContainer center={[0, 0]} zoom={2} className="h-full w-full">
        <BaseLayers defaultSatellite />
        <FitOnce points={frame} />
        <ZoneLayer zones={otherZones} faded />
        {pins.map((pin) => (
          <CircleMarker
            key={pin.code}
            center={[pin.lat, pin.lng]}
            radius={4}
            pathOptions={{ color: "#fff", weight: 1, fillColor: PIN_COLOR, fillOpacity: 0.9 }}
          />
        ))}
        <AddVertexOnClick onAdd={(p) => onChange([...value, p])} />
        {value.length >= 3 ? (
          <Polygon
            positions={value}
            pathOptions={{ color: "#fff", weight: 2, fillColor: BRAND.map.zoneFill, fillOpacity: 0.3 }}
          />
        ) : value.length === 2 ? (
          <Polyline positions={value} pathOptions={{ color: "#fff", weight: 2 }} />
        ) : null}
        {value.map((p, i) => (
          <Marker
            key={i}
            position={p}
            icon={vertexIcon}
            draggable
            eventHandlers={{
              dragend(e) {
                const ll = (e.target as L.Marker).getLatLng();
                onChange(value.map((q, j) => (j === i ? [ll.lat, ll.lng] : q)));
              },
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}

/** Like FitTo, but only on first render — so editing doesn't keep re-zooming. */
function FitOnce({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 18 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}
