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
