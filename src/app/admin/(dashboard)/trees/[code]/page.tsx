import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TreeStatusBadge } from "@/components/Badge";
import { ZoomableImage } from "@/components/ZoomableImage";
import Link from "next/link";

interface Props {
  params: { code: string };
}

const TIMELINE_LABEL: Record<string, string> = {
  planting: "Planted",
  quarterly: "Growth update",
  replacement: "Replanted",
  note: "Note",
};

export default async function AdminTreePage({ params }: Props) {
  const profile = await getCurrentProfile();
  if (!profile?.property_id) notFound();

  const supabase = createClient();

  const { data: tag } = await supabase
    .from("tags")
    .select(
      `
      code, status,
      trees (
        id, planting_date, gps_lat, gps_lng, status, dedication_message, replant_count,
        species ( common_name ),
        guests ( display_name, full_name, email, country, consent_full_name, consent_dedication )
      )
    `
    )
    .eq("property_id", profile.property_id)
    .eq("code", params.code)
    .maybeSingle();
  if (!tag) notFound();

  const tree = Array.isArray(tag.trees) ? tag.trees[0] : tag.trees;

  if (!tree) {
    // Tag exists but nothing's been planted on it yet.
    return (
      <div className="lg:max-w-[1500px]">
        <Link href="/admin/trees" className="text-sm text-stone-500 hover:text-stone-800">
          ← Back to trees
        </Link>
        <h1 className="mt-2 font-display text-3xl text-stone-900">{tag.code}</h1>
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This tag hasn&apos;t been planted yet.{" "}
          <Link href="/admin/trees/new" className="underline">
            Plant a tree
          </Link>{" "}
          against it.
        </p>
      </div>
    );
  }

  const species = Array.isArray(tree.species) ? tree.species[0] : tree.species;
  const guest = Array.isArray(tree.guests) ? tree.guests[0] : tree.guests;

  const { data: timeline } = await supabase
    .from("timeline_entries")
    .select("id, type, photo_url, note, captured_at")
    .eq("tree_id", tree.id)
    .order("captured_at", { ascending: false });

  return (
    <div className="lg:max-w-[1500px]">
      <Link href="/admin/trees" className="text-sm text-stone-500 hover:text-stone-800">
        ← Back to trees
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-stone-400">{tag.code}</p>
          <h1 className="mt-1 font-display text-3xl text-stone-900">
            {species?.common_name ?? "A tree"}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <TreeStatusBadge status={tree.status} />
            {tree.replant_count > 0 && (
              <span className="text-xs text-stone-400">replanted ×{tree.replant_count}</span>
            )}
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Link
            href={`/admin/trees/${tag.code}/follow-up`}
            className="w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-center text-sm font-medium text-white shadow-card hover:bg-emerald-900 sm:w-auto"
          >
            Log follow-up
          </Link>
          <Link
            href={`/t/${tag.code}`}
            target="_blank"
            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-center text-sm font-medium text-stone-700 hover:bg-stone-50 sm:w-auto"
          >
            Public page ↗
          </Link>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl border border-stone-200 bg-white p-5 text-sm shadow-card sm:grid-cols-3">
        <div>
          <dt className="text-stone-400">Planted by</dt>
          <dd className="font-medium text-stone-800">{guest?.full_name ?? guest?.display_name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-stone-400">Guest email</dt>
          <dd className="font-medium text-stone-800">{guest?.email ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-stone-400">Country</dt>
          <dd className="font-medium text-stone-800">{guest?.country ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-stone-400">Planting date</dt>
          <dd className="font-medium text-stone-800">{tree.planting_date}</dd>
        </div>
        <div>
          <dt className="text-stone-400">GPS</dt>
          <dd className="font-medium text-stone-800">
            {tree.gps_lat && tree.gps_lng ? `${tree.gps_lat.toFixed(5)}, ${tree.gps_lng.toFixed(5)}` : "—"}
          </dd>
        </div>
      </dl>

      {tree.dedication_message && (
        <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-5 py-4 text-sm italic text-emerald-950">
          &ldquo;{tree.dedication_message}&rdquo;
          {!guest?.consent_dedication && (
            <span className="ml-2 not-italic text-emerald-700">(not shown publicly — no consent)</span>
          )}
        </p>
      )}

      <section className="mt-8">
        <h2 className="font-display text-xl text-stone-900">Timeline</h2>
        <ol className="mt-4 flex flex-wrap gap-4">
          {timeline?.map((entry) => (
            <li
              key={entry.id}
              className="w-full max-w-sm flex-1 rounded-xl border border-stone-200 bg-white p-4 shadow-card"
            >
              <p className="text-xs uppercase tracking-wide text-stone-400">
                {TIMELINE_LABEL[entry.type] ?? entry.type} · {entry.captured_at}
              </p>
              {entry.note && <p className="mt-1.5 text-sm text-stone-700">{entry.note}</p>}
              {entry.photo_url && (
                <ZoomableImage
                  src={entry.photo_url}
                  className="mt-3 aspect-[4/3] w-full rounded-lg object-cover"
                />
              )}
            </li>
          ))}
          {(!timeline || timeline.length === 0) && (
            <p className="text-sm text-stone-400">No timeline entries yet.</p>
          )}
        </ol>
      </section>
    </div>
  );
}
