import { createClient, createPublicClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ZoomableImage } from "@/components/ZoomableImage";
import { TreePinsMap } from "@/components/map";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { TreeIllustration } from "@/components/TreeIllustration";
import { BRAND } from "@/lib/brand";
import { formatHectares, pointInRing, type Ring } from "@/lib/geo";

// Tree data changes constantly (new timeline entries, replacements) — never
// let Next cache the underlying Supabase fetch, or edits go invisible until
// a rebuild clears the cache.
export const dynamic = "force-dynamic";

interface Props {
  params: { code: string };
}

const TIMELINE_LABEL: Record<string, string> = {
  planting: "Planted",
  quarterly: "Growth update",
  replacement: "Replanted",
  note: "Note",
};

const TIMELINE_ICON: Record<string, string> = {
  planting: "🌱",
  quarterly: "📷",
  replacement: "🔁",
  note: "📝",
};

type TreeLookup =
  | { kind: "not_found" }
  | { kind: "unassigned" }
  | {
      kind: "tree";
      code: string;
      propertyName: string | null;
      propertySlug: string | null;
      speciesName: string | null;
      speciesSignificance: string | null;
      planterName: string | null;
      planterCountry: string | null;
      dedication: string | null;
      plantingDate: string;
      status: "alive" | "dead";
      replantCount: number;
      lat: number | null;
      lng: number | null;
      zone: { id: string; name: string; boundary: Ring; area_m2: number } | null;
      timeline: { id: string; type: string; photo_url: string | null; note: string | null; captured_at: string }[];
    };

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
}

/** "3 months", "1 year, 2 months" — how long the tree has been growing. */
function growingFor(iso: string) {
  const start = new Date(`${iso}T00:00:00`);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
  if (months < 1) {
    const days = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86_400_000));
    return days === 1 ? "1 day" : `${days} days`;
  }
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (rest) parts.push(`${rest} ${rest === 1 ? "month" : "months"}`);
  return parts.join(", ");
}

// This is also the QR code's landing point (see the artwork generator in
// /admin/tags/[batchId]) — the same physical tag gets scanned both before
// and after planting, so this one route has to make the right call either
// way: an already-planted tag shows the public page; an unplanted one hands
// staff straight into the planting form instead of just 404ing.
async function getTree(code: string): Promise<TreeLookup> {
  const supabase = createPublicClient();

  // Guest fields never come from a direct `guests` join here — anon can't
  // (and mustn't) read that table. `tree_planter` returns only the
  // consented public fields, and nothing after a removal request.
  const { data: tag } = await supabase
    .from("tags")
    .select(
      `
      code, status,
      properties ( id, name, slug ),
      trees (
        id, planting_date, gps_lat, gps_lng, status, replant_count,
        species ( common_name, significance )
      )
    `
    )
    .eq("code", code)
    .maybeSingle();

  if (!tag) return { kind: "not_found" };
  if (!tag.trees || (Array.isArray(tag.trees) && tag.trees.length === 0)) {
    // An assigned tag with no visible tree is a dead one awaiting replanting
    // (public RLS hides dead trees) — not a blank tag to plant on.
    return tag.status === "assigned" ? { kind: "not_found" } : { kind: "unassigned" };
  }

  const tree = Array.isArray(tag.trees) ? tag.trees[0] : tag.trees;
  const species = Array.isArray(tree.species) ? tree.species[0] : tree.species;
  const property = Array.isArray(tag.properties) ? tag.properties[0] : tag.properties;

  const [{ data: planter }, { data: timeline }, { data: zones }] = await Promise.all([
    supabase.rpc("tree_planter", { p_code: code }).maybeSingle(),
    supabase
      .from("timeline_entries")
      .select("id, type, photo_url, note, captured_at")
      .eq("tree_id", tree.id)
      .order("captured_at", { ascending: true }),
    property?.id
      ? supabase.from("planting_zones").select("id, name, boundary, area_m2").eq("property_id", property.id)
      : Promise.resolve({ data: [] }),
  ]);
  const p = planter as { display_name: string | null; country: string | null; dedication: string | null } | null;

  const zone =
    tree.gps_lat != null && tree.gps_lng != null
      ? ((zones ?? []) as { id: string; name: string; boundary: Ring; area_m2: number }[]).find((z) =>
          pointInRing(tree.gps_lat, tree.gps_lng, z.boundary)
        ) ?? null
      : null;

  return {
    kind: "tree",
    code: tag.code,
    propertyName: property?.name ?? null,
    propertySlug: property?.slug ?? null,
    speciesName: species?.common_name ?? null,
    speciesSignificance: species?.significance ?? null,
    planterName: p?.display_name ?? null,
    planterCountry: p?.country ?? null,
    dedication: p?.dedication ?? null,
    plantingDate: tree.planting_date,
    status: tree.status,
    replantCount: tree.replant_count,
    lat: tree.gps_lat,
    lng: tree.gps_lng,
    zone,
    timeline: timeline ?? [],
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getTree(params.code);
  if (result.kind !== "tree") {
    return {
      title:
        result.kind === "unassigned" ? `Tag ${params.code} — ${BRAND.name}` : `Tree not found — ${BRAND.name}`,
    };
  }

  const title = result.planterName
    ? `${result.planterName}'s tree — ${BRAND.name}`
    : `Tree ${params.code} — ${BRAND.name}`;

  const heroPhoto = [...result.timeline].reverse().find((e) => e.photo_url)?.photo_url;

  return {
    title,
    description: result.speciesName
      ? `A ${result.speciesName}, planted ${result.plantingDate}. Follow its growth at ${BRAND.name}.`
      : BRAND.tagline,
    openGraph: {
      title,
      images: heroPhoto ? [heroPhoto] : [],
    },
  };
}

export default async function TreePage({ params }: Props) {
  const result = await getTree(params.code);

  if (result.kind === "not_found") notFound();

  if (result.kind === "unassigned") {
    // Only staff can actually plant — if this browser already has a staff
    // session, skip the prompt and go straight to the pre-filled form.
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const plantUrl = `/admin/trees/new?tag=${encodeURIComponent(params.code)}`;
    if (user) redirect(plantUrl);

    return (
      <main className="flex min-h-screen flex-col bg-sand-50">
        <SiteHeader />
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-sand-400">{params.code}</p>
          <h1 className="mt-3 font-display text-3xl text-sand-900 sm:text-4xl">
            This tree hasn&apos;t been planted yet
          </h1>
          <p className="mt-3 max-w-sm text-sand-500">
            Its page comes alive the moment it goes in the ground.
          </p>
          <Link
            href={`/admin/login?next=${encodeURIComponent(plantUrl)}`}
            className="mt-8 text-sm text-brand-800 hover:underline"
          >
            Staff? Sign in to plant this tree →
          </Link>
        </div>
      </main>
    );
  }

  const tree = result;
  // The newest photo leads — the tree as it looks now, not as a sapling.
  const heroPhoto = [...tree.timeline].reverse().find((e) => e.photo_url)?.photo_url;
  const photoCount = tree.timeline.filter((e) => e.photo_url).length;
  const hasGps = tree.lat != null && tree.lng != null;

  return (
    <main className="min-h-screen bg-sand-50">
      {/* Hero */}
      <section className="relative flex min-h-[72vh] items-end overflow-hidden bg-brand-950">
        <SiteHeader overlay />
        {heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroPhoto} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <TreeIllustration className="absolute -right-10 bottom-0 h-[90%] opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/40 to-brand-950/10" />
        {/* Top scrim — keeps the overlay header legible on bright photos */}
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/55 to-transparent" />
        <div className="relative mx-auto w-full max-w-3xl px-6 pb-12 pt-32">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/70">
            {tree.code}
            {tree.zone ? ` · ${tree.zone.name}` : ""}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-white sm:text-6xl">
            {tree.planterName ? `${tree.planterName}'s ${tree.speciesName ?? "tree"}` : tree.speciesName ?? "A tree"}
          </h1>
          <p className="mt-4 text-white/80">
            {tree.status === "dead"
              ? `Planted ${formatDate(tree.plantingDate)}`
              : `Growing for ${growingFor(tree.plantingDate)} · planted ${formatDate(tree.plantingDate)}`}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6">
        {tree.status === "dead" && (
          <p className="mt-8 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This tree did not survive. A replacement will be recorded on this same page.
          </p>
        )}

        {/* Facts */}
        <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-sand-200 bg-sand-200 sm:grid-cols-4">
          {[
            { label: "Planted by", value: tree.planterName ? `${tree.planterName}${tree.planterCountry ? `, ${tree.planterCountry}` : ""}` : "A guest" },
            { label: "Species", value: tree.speciesName ?? "—" },
            { label: "Photos", value: String(photoCount) },
            tree.replantCount > 0
              ? { label: "Replanted", value: `${tree.replantCount}×` }
              : { label: "Status", value: tree.status === "alive" ? "Growing" : "Lost" },
          ].map((f) => (
            <div key={f.label} className="bg-white px-4 py-4">
              <dt className="text-xs uppercase tracking-wide text-sand-400">{f.label}</dt>
              <dd className="mt-1 font-medium text-sand-900">{f.value}</dd>
            </div>
          ))}
        </dl>

        {tree.dedication && (
          // The brand's handwritten-note motif: a white card, slightly askew.
          <figure className="mx-auto mt-14 max-w-md -rotate-2 bg-white px-8 py-7 text-center shadow-lift">
            <blockquote className="font-hand text-3xl leading-tight text-sand-900 sm:text-4xl">
              {tree.dedication}
            </blockquote>
            {tree.planterName && (
              <figcaption className="mt-4 font-hand text-2xl text-sand-500">— {tree.planterName}</figcaption>
            )}
          </figure>
        )}

        {tree.speciesSignificance && (
          <section className="mt-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-800">About the {tree.speciesName ?? "species"}</p>
            <p className="mt-3 text-lg leading-relaxed text-sand-700">{tree.speciesSignificance}</p>
          </section>
        )}
      </div>

      {/* Where it grows */}
      {hasGps && (
        <section className="mx-auto mt-16 max-w-3xl px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-800">Where it grows</p>
          <h2 className="mt-3 font-display text-3xl text-sand-900">
            {tree.zone ? tree.zone.name : tree.propertyName ?? "In the forest"}
          </h2>
          {tree.zone && (
            <p className="mt-2 text-sand-600">
              One of the trees restoring {formatHectares(tree.zone.area_m2)} of forest.
            </p>
          )}
          <div className="mt-6 h-[320px] overflow-hidden rounded-2xl border border-sand-200 shadow-card sm:h-[380px]">
            <TreePinsMap
              satellite
              className="h-full w-full"
              zones={tree.zone ? [{ id: tree.zone.id, boundary: tree.zone.boundary }] : []}
              pins={[
                {
                  code: tree.code,
                  lat: tree.lat as number,
                  lng: tree.lng as number,
                  title: tree.speciesName ?? "This tree",
                  subtitle: tree.code,
                  href: `/t/${tree.code}`,
                },
              ]}
            />
          </div>
          {tree.propertySlug && (
            <Link
              href={tree.propertySlug === BRAND.homePropertySlug ? "/" : `/p/${tree.propertySlug}`}
              className="mt-4 inline-block text-sm font-medium text-brand-800 hover:underline"
            >
              See the whole forest →
            </Link>
          )}
        </section>
      )}

      {/* Timeline */}
      <section className="mx-auto mt-16 max-w-3xl px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-800">Its story so far</p>
        <h2 className="mt-3 font-display text-3xl text-sand-900">Growth timeline</h2>
        <ol className="relative mt-10 border-l border-brand-200 pl-8">
          {tree.timeline.map((entry) => {
            const isPlanting = entry.type === "planting";
            return (
              <li key={entry.id} className="relative pb-12 last:pb-0">
                <span
                  className={
                    isPlanting
                      ? "absolute -left-[50px] flex h-9 w-9 items-center justify-center rounded-full bg-brand-800 text-sm ring-4 ring-sand-50"
                      : "absolute -left-[46px] flex h-7 w-7 items-center justify-center rounded-full border border-brand-300 bg-white text-xs ring-4 ring-sand-50"
                  }
                >
                  {TIMELINE_ICON[entry.type] ?? "•"}
                </span>
                <p className="text-xs uppercase tracking-[0.15em] text-sand-400">
                  {TIMELINE_LABEL[entry.type] ?? entry.type} · {formatDate(entry.captured_at)}
                </p>
                {entry.note && <p className="mt-2 text-sand-700">{entry.note}</p>}
                {entry.photo_url && (
                  <ZoomableImage
                    src={entry.photo_url}
                    className="mt-4 aspect-[16/10] w-full rounded-2xl object-cover shadow-card"
                  />
                )}
              </li>
            );
          })}
        </ol>
        <p className="mt-10 rounded-2xl bg-brand-50 px-6 py-5 text-sm text-brand-900">
          Our team visits every season to photograph this tree — new chapters appear here as it grows.
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
