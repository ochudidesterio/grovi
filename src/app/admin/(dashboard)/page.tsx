import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/StatCard";
import { TreeStatusBadge } from "@/components/Badge";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, property_id, properties(name)")
    .eq("id", user?.id)
    .maybeSingle();

  const property = Array.isArray(profile?.properties)
    ? profile?.properties[0]
    : profile?.properties;

  const { count: aliveCount } = await supabase
    .from("trees")
    .select("*", { count: "exact", head: true })
    .eq("status", "alive");
  const { count: deadCount } = await supabase
    .from("trees")
    .select("*", { count: "exact", head: true })
    .eq("status", "dead");
  const { count: guestCount } = await supabase
    .from("guests")
    .select("*", { count: "exact", head: true });

  const total = (aliveCount ?? 0) + (deadCount ?? 0);
  const survivalRate = total > 0 ? Math.round(((aliveCount ?? 0) / total) * 100) : null;

  const { data: recentTrees } = await supabase
    .from("trees")
    .select("id, planting_date, status, tags(code), species(common_name), guests(display_name)")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-stone-900">
            {property?.name ?? "Dashboard"}
          </h1>
          <p className="mt-1 text-stone-500">A living record of every tree planted here.</p>
        </div>
        <Link
          href="/admin/trees/new"
          className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white shadow-card hover:bg-emerald-900"
        >
          + Plant a tree
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Trees alive" value={aliveCount ?? 0} />
        <StatCard label="Survival rate" value={survivalRate !== null ? `${survivalRate}%` : "—"} />
        <StatCard label="Guests" value={guestCount ?? 0} />
        <StatCard label="Trees lost" value={deadCount ?? 0} />
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-stone-900">Recently planted</h2>
          <Link href="/admin/trees" className="text-sm font-medium text-emerald-800 hover:underline">
            View all trees →
          </Link>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card">
          {!recentTrees || recentTrees.length === 0 ? (
            <p className="p-6 text-sm text-stone-500">
              No trees planted yet. Start with{" "}
              <Link href="/admin/trees/new" className="text-emerald-800 underline">
                planting your first one
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {recentTrees.map((t) => {
                const tag = Array.isArray(t.tags) ? t.tags[0] : t.tags;
                const species = Array.isArray(t.species) ? t.species[0] : t.species;
                const guest = Array.isArray(t.guests) ? t.guests[0] : t.guests;
                return (
                  <li key={t.id}>
                    <Link
                      href={`/t/${tag?.code}`}
                      className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-stone-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-stone-800">
                          {tag?.code} · {species?.common_name ?? "Unknown species"}
                        </p>
                        <p className="text-xs text-stone-500">
                          Planted by {guest?.display_name ?? "a guest"} on {t.planting_date}
                        </p>
                      </div>
                      <TreeStatusBadge status={t.status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
