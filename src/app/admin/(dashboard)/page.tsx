import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/StatCard";
import { TreeStatusBadge } from "@/components/Badge";
import { BarChart, type BarDatum } from "@/components/BarChart";
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

  // Trees vs. people. A "planter" is a guest with at least one tree — a
  // returning guest (same email) is one guest row, so they count once.
  const { data: plantings } = await supabase
    .from("trees")
    .select("guest_id, planting_date, gps_lat, tags(code), species(common_name), guests(display_name, full_name)");

  const treesByGuest = new Map<string, { name: string; count: number; firstPlanted: string }>();
  for (const t of plantings ?? []) {
    if (!t.guest_id) continue;
    const guest = Array.isArray(t.guests) ? t.guests[0] : t.guests;
    const entry = treesByGuest.get(t.guest_id) ?? {
      name: guest?.full_name ?? guest?.display_name ?? "A guest",
      count: 0,
      firstPlanted: t.planting_date,
    };
    entry.count += 1;
    if (t.planting_date < entry.firstPlanted) entry.firstPlanted = t.planting_date;
    treesByGuest.set(t.guest_id, entry);
  }
  const planterCount = treesByGuest.size;
  const treesPerPlanter = planterCount > 0 ? ((plantings?.length ?? 0) / planterCount).toFixed(1) : "—";
  const returningCount = Array.from(treesByGuest.values()).filter((g) => g.count > 1).length;

  const BUCKETS = ["1", "2", "3", "4", "5+"];
  const distribution: BarDatum[] = BUCKETS.map((label, i) => {
    const value = Array.from(treesByGuest.values()).filter((g) =>
      i === BUCKETS.length - 1 ? g.count >= i + 1 : g.count === i + 1
    ).length;
    return { label: `${label} ${label === "1" ? "tree" : "trees"}`, value };
  });

  // Last 12 months, oldest first — trees planted, with how many distinct
  // people planted them and how many of those were first-timers.
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en", { month: "short" }),
      year: d.getFullYear(),
    };
  });
  const monthly: BarDatum[] = months.map((m) => {
    const inMonth = (plantings ?? []).filter((t) => t.planting_date.startsWith(m.key));
    const people = new Set(inMonth.map((t) => t.guest_id).filter(Boolean)).size;
    const newPeople = Array.from(treesByGuest.values()).filter((g) => g.firstPlanted.startsWith(m.key)).length;
    return {
      label: m.label,
      value: inMonth.length,
      detail: `${people} ${people === 1 ? "person" : "people"} · ${newPeople} new · ${m.label} ${m.year}`,
    };
  });

  const topPlanters = Array.from(treesByGuest.values())
    .filter((g) => g.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const missingGps = (plantings ?? [])
    .filter((t) => t.gps_lat == null)
    .map((t) => {
      const tag = Array.isArray(t.tags) ? t.tags[0] : t.tags;
      const species = Array.isArray(t.species) ? t.species[0] : t.species;
      return { code: tag?.code, species: species?.common_name };
    });

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
        <StatCard label="Planters" value={planterCount} hint={`${treesPerPlanter} trees each on average`} />
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
        <h2 className="font-display text-xl text-stone-900">Trees &amp; planters</h2>
        <p className="mt-1 text-sm text-stone-500">
          {plantings?.length ?? 0} trees planted by {planterCount}{" "}
          {planterCount === 1 ? "person" : "people"}
          {returningCount > 0 ? ` — ${returningCount} came back to plant more than one` : ""}.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card lg:col-span-3">
            <h3 className="text-sm font-medium text-stone-700">Trees planted per month</h3>
            <p className="text-xs text-stone-400">Last 12 months · hover for people</p>
            <div className="mt-4">
              <BarChart data={monthly} valueLabel="trees" />
            </div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card lg:col-span-2">
            <h3 className="text-sm font-medium text-stone-700">Planters by trees planted</h3>
            <p className="text-xs text-stone-400">How many people planted 1, 2, 3… trees</p>
            <div className="mt-4">
              <BarChart data={distribution} valueLabel="planters" showValues />
            </div>
          </div>
        </div>
        {topPlanters.length > 0 && (
          <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-card">
            <h3 className="text-sm font-medium text-stone-700">Returning planters</h3>
            <ul className="mt-3 divide-y divide-stone-100">
              {topPlanters.map((g, i) => (
                <li key={i} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-stone-800">{g.name}</span>
                  <span className="tabular-nums text-stone-500">{g.count} trees</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {missingGps.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl text-stone-900">Missing a location</h2>
          <p className="mt-1 text-sm text-stone-500">
            {missingGps.length} {missingGps.length === 1 ? "tree has" : "trees have"} no GPS yet — they
            won&apos;t show on any map until one is set.
          </p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card">
            <ul className="divide-y divide-stone-100">
              {missingGps.slice(0, 6).map((t) => (
                <li key={t.code}>
                  <Link
                    href={`/admin/trees/${t.code}/location`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-stone-50"
                  >
                    <p className="text-sm font-medium text-stone-800">
                      {t.code} · {t.species ?? "Unknown species"}
                    </p>
                    <span className="text-sm text-emerald-800">Set location →</span>
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
