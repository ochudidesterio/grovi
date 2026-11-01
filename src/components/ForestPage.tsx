import { createPublicClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TreePinsMap } from "@/components/map";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { TreeIllustration } from "@/components/TreeIllustration";
import { BRAND } from "@/lib/brand";
import { formatHectares } from "@/lib/geo";
import { toMapZones, treesToPins, zoneStats, type ZoneRow } from "@/lib/zones";

function latestPhoto(entries: { photo_url: string | null; captured_at: string }[]) {
  return [...entries]
    .filter((e) => e.photo_url)
    .sort((a, b) => (a.captured_at < b.captured_at ? 1 : -1))[0]?.photo_url ?? null;
}

/**
 * The guest-facing forest: hero, impact numbers, the mapped planting
 * zones, what's growing, and the latest plantings. Rendered at `/` (for
 * BRAND.homePropertySlug) and at `/p/[slug]`.
 */
export async function ForestPage({ slug }: { slug: string }) {
  const supabase = createPublicClient();

  const { data: property } = await supabase
    .from("properties")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();
  if (!property) notFound();

  const [{ data: trees }, { count: lostCount }, { data: zoneRows }, { data: guestStats }] = await Promise.all([
    supabase
      .from("trees")
      .select("planting_date, gps_lat, gps_lng, tags(code), species(common_name), timeline_entries(photo_url, captured_at)")
      .eq("property_id", property.id)
      .eq("status", "alive")
      .order("planting_date", { ascending: false }),
    supabase
      .from("trees")
      .select("id", { count: "exact", head: true })
      .eq("property_id", property.id)
      .eq("status", "dead"),
    supabase
      .from("planting_zones")
      .select("id, name, description, boundary, area_m2")
      .eq("property_id", property.id)
      .order("created_at"),
    supabase.rpc("property_guest_stats", { p_slug: slug }).maybeSingle(),
  ]);

  const rows = (trees ?? []).map((t) => {
    const tag = Array.isArray(t.tags) ? t.tags[0] : t.tags;
    const species = Array.isArray(t.species) ? t.species[0] : t.species;
    const entries = Array.isArray(t.timeline_entries) ? t.timeline_entries : [];
    return {
      code: tag?.code ?? "",
      species: species?.common_name ?? null,
      plantingDate: t.planting_date as string,
      lat: t.gps_lat as number | null,
      lng: t.gps_lng as number | null,
      photo: latestPhoto(entries),
    };
  });

  const pins = treesToPins(
    rows.map((r) => ({
      code: r.code,
      lat: r.lat,
      lng: r.lng,
      title: r.species ?? "A tree",
      subtitle: `Planted ${r.plantingDate}`,
      photoUrl: r.photo,
    }))
  );
  const zones = zoneStats((zoneRows ?? []) as ZoneRow[], pins);

  const growing = rows.length;
  const total = growing + (lostCount ?? 0);
  const survivalRate = total > 0 ? Math.round((growing / total) * 100) : null;
  const totalArea = zones.reduce((s, z) => s + z.area_m2, 0);
  const stats = guestStats as { planter_count: number; country_count: number } | null;

  const speciesCounts = new Map<string, number>();
  for (const r of rows) speciesCounts.set(r.species ?? "Other", (speciesCounts.get(r.species ?? "Other") ?? 0) + 1);
  const speciesList = Array.from(speciesCounts.entries()).sort((a, b) => b[1] - a[1]);
  const topSpecies = speciesList.slice(0, 8);
  const otherCount = speciesList.slice(8).reduce((s, [, n]) => s + n, 0);
  if (otherCount > 0) topSpecies.push(["Other species", otherCount]);
  const maxSpecies = Math.max(1, ...topSpecies.map(([, n]) => n));

  const heroPhoto = BRAND.heroImage ?? rows.find((r) => r.photo)?.photo ?? null;
  const recent = rows.filter((r) => r.photo).slice(0, 6);

  const impact = [
    { value: growing.toLocaleString("en"), label: growing === 1 ? "tree growing" : "trees growing" },
    totalArea > 0 && { value: formatHectares(totalArea), label: "being reforested" },
    stats && stats.planter_count > 0 && {
      value: stats.planter_count.toLocaleString("en"),
      label: stats.country_count > 1 ? `guests from ${stats.country_count} countries` : "guests planting",
    },
    speciesList.length > 0 && { value: String(speciesList.length), label: "species" },
    survivalRate !== null && { value: `${survivalRate}%`, label: "survival rate" },
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <main className="min-h-screen bg-sand-50">
      {/* Hero — the brand's signature composition: a photo band, with a sage
          panel that overlaps down into the paper below it. */}
      <section className="relative h-[62vh] min-h-[420px] overflow-hidden bg-brand-950">
        <SiteHeader overlay />
        {heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroPhoto} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <TreeIllustration className="absolute -right-10 bottom-0 h-[90%] opacity-40" />
        )}
        <div className="absolute inset-0 bg-brand-950/20" />
        {/* Top scrim — keeps the overlay header legible on bright photos */}
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/55 to-transparent" />
      </section>

      <section className="relative px-4">
        <div className="relative mx-auto -mt-40 max-w-3xl bg-brand-800 px-7 py-12 text-center text-white shadow-lift sm:-mt-56 sm:px-14 sm:py-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND.emblemOnDark} alt="" className="mx-auto h-14 w-auto opacity-90" />
          <h1 className="mt-6 font-display text-5xl leading-[1.05] sm:text-7xl">{BRAND.headline}</h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-snug text-white/90 sm:text-xl">{BRAND.tagline}</p>
          <p className="mx-auto mt-7 max-w-2xl text-left text-sm leading-relaxed text-white/85 sm:text-base">
            {BRAND.intro}
          </p>
        </div>
      </section>

      {/* Impact */}
      {growing > 0 && (
        <section className="mx-auto max-w-5xl px-6 pt-16">
          <dl className="flex flex-wrap justify-center gap-x-14 gap-y-10 text-center">
            {impact.map((s) => (
              <div key={s.label} className="min-w-[120px]">
                <dd className="font-display text-5xl text-brand-800">{s.value}</dd>
                <dt className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-sand-500">{s.label}</dt>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Map */}
      <section className="mx-auto max-w-6xl px-6 pt-20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-800">The forest, mapped</p>
        <h2 className="mt-3 font-display text-3xl text-sand-900 sm:text-4xl">Where every tree is growing</h2>
        <p className="mt-3 max-w-2xl text-sand-600">
          Each point is a tree with its own page. Tap one to meet it
          {zones.length > 0 ? " — outlined areas are the zones our guests are restoring." : "."}
        </p>

        {pins.length > 0 || zones.length > 0 ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div
              className={`h-[460px] overflow-hidden rounded-2xl border border-sand-200 shadow-card lg:h-[560px] ${
                zones.length > 0 ? "lg:col-span-2" : "lg:col-span-3"
              }`}
            >
              <TreePinsMap satellite pins={pins} zones={toMapZones(zones)} className="h-full w-full" />
            </div>
            {zones.length > 0 && (
              <ul className="space-y-3">
                {zones.map((z) => (
                  <li key={z.id} className="rounded-2xl border border-sand-200 bg-white p-5 shadow-card">
                    <p className="font-display text-xl text-sand-900">{z.name}</p>
                    {z.description && <p className="mt-1 text-sm text-sand-500">{z.description}</p>}
                    <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <dd className="font-display text-lg text-brand-900">{formatHectares(z.area_m2)}</dd>
                        <dt className="text-xs text-sand-400">area</dt>
                      </div>
                      <div>
                        <dd className="font-display text-lg text-brand-900">{z.treeCount}</dd>
                        <dt className="text-xs text-sand-400">{z.treeCount === 1 ? "tree" : "trees"}</dt>
                      </div>
                      <div>
                        <dd className="font-display text-lg text-brand-900">
                          {z.perHectare !== null ? Math.round(z.perHectare) : "—"}
                        </dd>
                        <dt className="text-xs text-sand-400">per ha</dt>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-sand-300 px-6 py-12 text-center text-sand-500">
            The first trees are about to go in the ground.
          </p>
        )}
      </section>

      {/* Species */}
      {topSpecies.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pt-24">
          <div className="grid gap-10 lg:grid-cols-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-800">What&apos;s growing</p>
              <h2 className="mt-3 font-display text-3xl text-sand-900 sm:text-4xl">
                {speciesList.length} species, planted by hand
              </h2>
            </div>
            <ul className="space-y-4 lg:col-span-2">
              {topSpecies.map(([name, n]) => (
                <li key={name}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-sand-800">{name}</span>
                    <span className="tabular-nums text-sand-500">{n}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-sand-100">
                    <div className="h-full rounded-full bg-brand-700" style={{ width: `${(n / maxSpecies) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Recent */}
      {recent.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pt-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-800">Recently planted</p>
          <h2 className="mt-3 font-display text-3xl text-sand-900 sm:text-4xl">The newest members of the forest</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((r) => (
              <Link
                key={r.code}
                href={`/t/${r.code}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-brand-900 shadow-card"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.photo as string}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-display text-xl text-white">{r.species ?? "A tree"}</p>
                  <p className="mt-0.5 text-xs uppercase tracking-wide text-white/70">
                    {r.code} · {r.plantingDate}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Invitation */}
      <section className="mx-auto max-w-6xl px-6 pt-24">
        <div className="rounded-3xl bg-brand-900 px-8 py-14 text-center text-white sm:px-16">
          <h2 className="font-display text-3xl sm:text-4xl">Planted a tree with us?</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/75">
            Scan the tag beside it, or open the link in your email — your tree&apos;s page grows with new
            photos every season, long after you&apos;ve gone home.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
