import { createPublicClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

// Same reasoning as /t/[code]: tree counts change as staff plant more, so
// this can't be cached or it'll show a stale snapshot.
export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export default async function GrovePage({ params }: Props) {
  const supabase = createPublicClient();

  const { data: property } = await supabase
    .from("properties")
    .select("id, name, brand_color")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!property) notFound();

  const { data: trees } = await supabase
    .from("trees")
    .select("planting_date, tags(code), species(common_name), timeline_entries(photo_url, type)")
    .eq("property_id", property.id)
    .eq("status", "alive")
    .order("planting_date", { ascending: false });

  const { count: lostCount } = await supabase
    .from("trees")
    .select("*", { count: "exact", head: true })
    .eq("property_id", property.id)
    .eq("status", "dead");

  const aliveCount = trees?.length ?? 0;
  const total = aliveCount + (lostCount ?? 0);
  const survivalRate = total > 0 ? Math.round((aliveCount / total) * 100) : null;

  return (
    <main className="min-h-screen bg-stone-50">
      <div
        className="px-6 py-14 text-center text-white"
        style={{ backgroundColor: property.brand_color ?? "#065f46" }}
      >
        <h1 className="font-display text-4xl">{property.name}</h1>
        <p className="mt-2 text-white/80">A living record of every tree our guests have planted.</p>

        <div className="mx-auto mt-8 flex max-w-md justify-center gap-8">
          <div>
            <p className="font-display text-3xl">{aliveCount}</p>
            <p className="text-sm text-white/70">trees growing</p>
          </div>
          {survivalRate !== null && (
            <div>
              <p className="font-display text-3xl">{survivalRate}%</p>
              <p className="text-sm text-white/70">survival rate</p>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {aliveCount === 0 ? (
          <p className="text-center text-stone-500">No trees planted here yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trees?.map((t, i) => {
              const tag = Array.isArray(t.tags) ? t.tags[0] : t.tags;
              const species = Array.isArray(t.species) ? t.species[0] : t.species;
              const entries = Array.isArray(t.timeline_entries) ? t.timeline_entries : [];
              const photo = entries.find((e) => e.photo_url)?.photo_url;

              return (
                <Link
                  key={i}
                  href={`/t/${tag?.code}`}
                  className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card transition-shadow hover:shadow-lift"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-emerald-900">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">🌳</div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-wide text-stone-400">{tag?.code}</p>
                    <p className="mt-0.5 font-display text-lg text-stone-900">
                      {species?.common_name ?? "A tree"}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">Planted {t.planting_date}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
