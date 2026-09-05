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

  // "Follow-up photography lapses" mitigation from the doc: surface trees
  // whose most recent timeline entry (or planting, if nothing since) is
  // more than a quarter old, instead of relying on staff to remember.
  const OVERDUE_DAYS = 90;
  const { data: aliveTrees } = await supabase
    .from("trees")
    .select("id, planting_date, tags(code), species(common_name)")
    .eq("status", "alive");

  const treeIds = (aliveTrees ?? []).map((t) => t.id);
  const { data: allEntries } = treeIds.length
    ? await supabase
        .from("timeline_entries")
        .select("tree_id, captured_at")
        .in("tree_id", treeIds)
    : { data: [] as { tree_id: string; captured_at: string }[] };

  const lastActivityByTree = new Map<string, string>();
  for (const entry of allEntries ?? []) {
    const current = lastActivityByTree.get(entry.tree_id);
    if (!current || entry.captured_at > current) {
      lastActivityByTree.set(entry.tree_id, entry.captured_at);
    }
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - OVERDUE_DAYS);
  const overdueTrees = (aliveTrees ?? [])
    .map((t) => {
      const tag = Array.isArray(t.tags) ? t.tags[0] : t.tags;
      const species = Array.isArray(t.species) ? t.species[0] : t.species;
      const lastActivity = lastActivityByTree.get(t.id) ?? t.planting_date;
      return { id: t.id, code: tag?.code, species: species?.common_name, lastActivity };
    })
    .filter((t) => t.lastActivity < cutoff.toISOString().slice(0, 10))
    .sort((a, b) => (a.lastActivity < b.lastActivity ? -1 : 1))
    .slice(0, 6);

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
          className="w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-center text-sm font-medium text-white shadow-card hover:bg-emerald-900 sm:w-auto"
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

      {overdueTrees.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl text-stone-900">Needs a follow-up</h2>
          <p className="mt-1 text-sm text-stone-500">
            No photo in over {OVERDUE_DAYS} days — due for a quarterly visit.
          </p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 shadow-card">
            <ul className="divide-y divide-amber-100">
              {overdueTrees.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/admin/trees/${t.code}/follow-up`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-amber-100/60"
                  >
                    <div>
                      <p className="text-sm font-medium text-stone-800">
                        {t.code} · {t.species ?? "Unknown species"}
                      </p>
                      <p className="text-xs text-stone-500">Last activity {t.lastActivity}</p>
                    </div>
                    <span className="text-sm text-amber-800">Log follow-up →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

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
                      href={`/admin/trees/${tag?.code}`}
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
