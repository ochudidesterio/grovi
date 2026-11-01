export interface LatLng {
  lat: number;
  lng: number;
}

export interface TreePin extends LatLng {
  code: string;
  title: string;
  subtitle?: string;
  href: string;
  photoUrl?: string | null;
}

export interface MapZone {
  id: string;
  /** [[lat, lng], ...] */
  boundary: [number, number][];
  /** Permanent on-map label, e.g. "River Bend · 2.4 ha · 38 trees". */
  label?: string;
}
