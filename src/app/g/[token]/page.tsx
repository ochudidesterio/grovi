import { createPublicClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TreePinsMap, type TreePin } from "@/components/map";

// New plantings/photos show up immediately — same reasoning as /t/[code].
export const dynamic = "force-dynamic";

interface Props {
  params: { token: string };
}

interface ProfileTree {
  code: string;
  property_name: string;
  property_slug: string;
  species_name: string | null;
  planting_date: string;
  gps_lat: number | null;
  gps_lng: number | null;
  display_name: string | null;
  country: string | null;
  photo_url: string | null;
}

// One guest's trees across every property, keyed by an unguessable share
// token (sent in their planting email) rather than anything derived from
// the guest — so finding one tree page never lets you enumerate the rest.
// Reads through the `planter_profile` security definer function, which
// applies the same visibility rules as the public tree page.
async function getProfile(token: string) {
  if (!/^[0-9a-f]{32}$/.test(token)) return null;
  const supabase = createPublicClient();
  const { data } = await supabase.rpc("planter_profile", { p_token: token });
  const trees = (data ?? []) as ProfileTree[];
  if (trees.length === 0) return null;

  const latest = trees[trees.length - 1];
  return {
    name: latest.display_name,
    country: latest.country,
    trees,
    propertyCount: new Set(trees.map((t) => t.property_slug)).size,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getProfile(params.token);
  if (!profile) return { title: "Not found — Grovi" };
  const title = profile.name ? `${profile.name}'s trees — Grovi` : "A planter's trees — Grovi";
  return {
    title,
    description: `${profile.trees.length} ${profile.trees.length === 1 ? "tree" : "trees"} planted, and a record that lasts.`,
    // Personal page — shareable by link, but shouldn't turn up in search.
    robots: { index: false },
  };
}

export default async function PlanterProfilePage({ params }: Props) {
  const profile = await getProfile(params.token);
  if (!profile) notFound();

  const pins: TreePin[] = profile.trees
    .filter((t) => t.gps_lat != null && t.gps_lng != null)
    .map((t) => ({
      code: t.code,
      lat: t.gps_lat as number,
      lng: t.gps_lng as number,
      title: t.species_name ?? "A tree",
      subtitle: `${t.property_name} · ${t.planting_date}`,
      href: `/t/${t.code}`,
      photoUrl: t.photo_url,
    }));

  const byProperty = new Map<string, { name: string; slug: string; trees: ProfileTree[] }>();
  for (const t of profile.trees) {
    const group = byProperty.get(t.property_slug) ?? { name: t.property_name, slug: t.property_slug, trees: [] };
    group.trees.push(t);
    byProperty.set(t.property_slug, group);
  }

  const count = profile.trees.length;

  return (
    <main className="min-h-screen bg-stone-50 pb-20">
      <header className="bg-emerald-900 px-6 pb-10 pt-14 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs uppercase tracking-wide text-white/60">Grovi</p>
          <h1 className="mt-2 font-display text-4xl">
            {profile.name ? `${profile.name}'s trees` : "Trees planted"}
          </h1>
          <p className="mt-2 text-white/80">
            {count} {count === 1 ? "tree" : "trees"}
            {profile.propertyCount > 1 ? ` across ${profile.propertyCount} places` : ""}
            {profile.country ? ` · ${profile.country}` : ""}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6">
        {pins.length > 0 ? (
          <div className="-mt-6 h-[360px] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card sm:h-[440px]">
            <TreePinsMap pins={pins} className="h-full w-full" />
          </div>
        ) : (
          <p className="mt-6 rounded-xl bg-white px-4 py-3 text-sm text-stone-500 shadow-card">
            Map locations for these trees haven&apos;t been recorded yet.
          </p>
        )}
        {pins.length > 0 && pins.length < count && (
          <p className="mt-2 text-xs text-stone-400">
            {count - pins.length} of {count} trees don&apos;t have a map location yet.
          </p>
        )}

        {Array.from(byProperty.values()).map((group) => (
          <section key={group.slug} className="mt-12">
            <Link
              href={`/p/${group.slug}`}
              className="font-display text-2xl text-stone-900 hover:text-emerald-900"
            >
              {group.name}
            </Link>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.trees.map((t) => (
                <li key={t.code}>
                  <Link
                    href={`/t/${t.code}`}
                    className="block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card transition hover:shadow-lift"
                  >
                    <div className="aspect-[4/3] bg-emerald-50">
                      {t.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.photo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl">🌳</div>
                      )}
                    </div>
                    <div className="px-4 py-3">
                      <p className="font-medium text-stone-900">{t.species_name ?? "A tree"}</p>
                      <p className="text-xs text-stone-500">
                        {t.code} · planted {t.planting_date}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
