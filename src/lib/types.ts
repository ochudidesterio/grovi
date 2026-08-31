export type StaffRole = "super_admin" | "property_admin" | "staff";
export type TreeStatus = "alive" | "dead";
export type TimelineType = "planting" | "quarterly" | "replacement" | "note";

export interface Property {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  brand_color: string | null;
}

export interface Species {
  id: string;
  property_id: string | null;
  common_name: string;
  local_name: string | null;
  significance: string | null;
}

export interface Guest {
  id: string;
  property_id: string;
  display_name: string | null;
  country: string | null;
  consent_full_name: boolean;
  consent_photo: boolean;
  consent_dedication: boolean;
  full_name?: string | null; // only present in admin queries, never public
}

export interface Tag {
  id: string;
  property_id: string;
  code: string;
  status: "unassigned" | "assigned";
}

export interface Tree {
  id: string;
  property_id: string;
  tag_id: string;
  species_id: string | null;
  guest_id: string | null;
  dedication_message: string | null;
  planting_date: string;
  gps_lat: number | null;
  gps_lng: number | null;
  status: TreeStatus;
  replant_count: number;
}

export interface TimelineEntry {
  id: string;
  tree_id: string;
  type: TimelineType;
  photo_url: string | null;
  note: string | null;
  captured_at: string;
}

// Shape returned by the public tree page query — joins trees -> tag -> species
// -> guest, selecting only fields the guest has consented to show.
export interface PublicTreeView {
  code: string;
  species_common_name: string | null;
  species_significance: string | null;
  planter_display_name: string | null; // consented name, or null
  dedication_message: string | null;   // only if consent_dedication
  planting_date: string;
  gps_lat: number | null;
  gps_lng: number | null;
  status: TreeStatus;
  timeline: TimelineEntry[];
}
