import { createClient, createPublicClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ZoomableImage } from "@/components/ZoomableImage";

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
      timeline: { id: string; type: string; photo_url: string | null; note: string | null; captured_at: string }[];
    };

// This is also the QR code's landing point (see the artwork generator in
// /admin/tags/[batchId]) — the same physical tag gets scanned both before
// and after planting, so this one route has to make the right call either
// way: an already-planted tag shows the public page; an unplanted one hands
// staff straight into the planting form instead of just 404ing.
async function getTree(code: string): Promise<TreeLookup> {
  const supabase = createPublicClient();

  const { data: tag } = await supabase
    .from("tags")
    .select(
      `
      code,
      properties ( name, slug ),
      trees (
        id, planting_date, gps_lat, gps_lng, status, dedication_message, replant_count,
        species ( common_name, significance ),
        guests ( display_name, country, consent_full_name, consent_dedication, removal_requested_at )
      )
    `
    )
    .eq("code", code)
    .maybeSingle();

  if (!tag) return { kind: "not_found" };
  if (!tag.trees) return { kind: "unassigned" };

  const tree = Array.isArray(tag.trees) ? tag.trees[0] : tag.trees;
  const guest = Array.isArray(tree.guests) ? tree.guests[0] : tree.guests;
  const species = Array.isArray(tree.species) ? tree.species[0] : tree.species;
  const property = Array.isArray(tag.properties) ? tag.properties[0] : tag.properties;

  // A guest who has requested removal is opting out of public identification —
  // the tree record itself (the property's planting) still stands, but
  // nothing that identifies them should render, regardless of the consent
  // flags they gave at planting time.
  const guestRemoved = Boolean(guest?.removal_requested_at);

  const { data: timeline } = await supabase
    .from("timeline_entries")
    .select("id, type, photo_url, note, captured_at")
    .eq("tree_id", tree.id)
    .order("captured_at", { ascending: true });

  return {
    kind: "tree",
    code: tag.code,
    propertyName: property?.name ?? null,
    propertySlug: property?.slug ?? null,
    speciesName: species?.common_name ?? null,
    speciesSignificance: species?.significance ?? null,
    planterName: guestRemoved ? null : guest?.display_name ?? null,
    planterCountry: guestRemoved ? null : guest?.country ?? null,
    dedication: !guestRemoved && guest?.consent_dedication ? tree.dedication_message : null,
    plantingDate: tree.planting_date,
    status: tree.status,
    replantCount: tree.replant_count,
    timeline: timeline ?? [],
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getTree(params.code);
  if (result.kind !== "tree") {
    return {
      title:
        result.kind === "unassigned" ? `Tag ${params.code} — Grovi` : "Tree not found — Grovi",
    };
  }

  const title = result.planterName
    ? `${result.planterName}'s tree — ${params.code}`
    : `Tree ${params.code} — Grovi`;

  const heroPhoto = result.timeline.find((e) => e.photo_url)?.photo_url;

  return {
    title,
    description: result.speciesName
      ? `A ${result.speciesName}, planted ${result.plantingDate}. Follow its growth on Grovi.`
      : "A tree planted, and a record that lasts.",
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6 text-center">
        <p className="text-sm uppercase tracking-wide text-stone-400">{params.code}</p>
        <h1 className="mt-2 font-display text-3xl text-stone-900">
          This tree hasn&apos;t been planted yet
        </h1>
        <p className="mt-2 max-w-sm text-stone-500">
          Check back once a guest has planted a tree against this tag.
        </p>
        <Link
          href={`/admin/login?next=${encodeURIComponent(plantUrl)}`}
          className="mt-6 text-sm text-emerald-800 hover:underline"
        >
          Staff? Sign in to plant this tree →
        </Link>
      </main>
    );
  }

  const tree = result;
  const heroPhoto = tree.timeline.find((e) => e.photo_url)?.photo_url;

  return (
    <main className="min-h-screen bg-stone-50 pb-20">
      <div className="relative h-[46vh] min-h-[280px] w-full overflow-hidden bg-emerald-900">
        {heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroPhoto} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-7xl">🌳</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-2xl px-6 pb-6">
          {tree.propertyName && (
            <Link
              href={tree.propertySlug ? `/p/${tree.propertySlug}` : "#"}
              className="text-xs font-medium uppercase tracking-wide text-white/70 hover:text-white"
            >
              {tree.propertyName}
            </Link>
          )}
          <p className="mt-1 text-xs uppercase tracking-wide text-white/70">{tree.code}</p>
          <h1 className="mt-1 font-display text-4xl text-white">
            {tree.speciesName ?? "A tree"}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6">
        {tree.status === "dead" && (
          <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This tree did not survive. A replacement will be recorded on this same page.
          </p>
        )}

        <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm text-stone-600">
          {tree.planterName && (
            <div>
              <dt className="text-stone-400">Planted by</dt>
              <dd className="font-medium text-stone-800">
                {tree.planterName}
                {tree.planterCountry ? `, ${tree.planterCountry}` : ""}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-stone-400">Planted on</dt>
            <dd className="font-medium text-stone-800">{tree.plantingDate}</dd>
          </div>
          {tree.replantCount > 0 && (
            <div>
              <dt className="text-stone-400">Replanted</dt>
              <dd className="font-medium text-stone-800">{tree.replantCount}×</dd>
            </div>
          )}
        </dl>

        {tree.dedication && (
          <blockquote className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-6 py-5 font-display text-lg italic text-emerald-950">
            &ldquo;{tree.dedication}&rdquo;
          </blockquote>
        )}

        {tree.speciesSignificance && (
          <p className="mt-8 leading-relaxed text-stone-600">{tree.speciesSignificance}</p>
        )}
      </div>

      <div className="mx-auto mt-14 px-6 lg:max-w-[1500px]">
        <h2 className="font-display text-2xl text-stone-900">Growth timeline</h2>
        <ol className="mt-6 flex flex-wrap gap-6">
          {tree.timeline.map((entry) => (
            <li
              key={entry.id}
              className="w-full max-w-sm flex-1 rounded-xl border border-stone-200 bg-white p-4 shadow-card"
            >
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-stone-400">
                <span>{TIMELINE_ICON[entry.type] ?? "•"}</span>
                {TIMELINE_LABEL[entry.type] ?? entry.type} · {entry.captured_at}
              </p>
              {entry.note && <p className="mt-1.5 text-stone-700">{entry.note}</p>}
              {entry.photo_url && (
                <ZoomableImage
                  src={entry.photo_url}
                  className="mt-3 aspect-[4/3] w-full rounded-xl object-cover"
                />
              )}
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
