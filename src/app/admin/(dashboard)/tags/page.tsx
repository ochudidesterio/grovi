import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { NewBatchForm } from "./NewBatchForm";
import { StatCard } from "@/components/StatCard";
import Link from "next/link";

export default async function TagsPage() {
  const profile = await getCurrentProfile();
  if (!profile?.property_id) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
        <p className="text-sm text-stone-600">Your account isn&apos;t linked to a property yet.</p>
      </div>
    );
  }

  const supabase = createClient();

  const [{ count: unassignedCount }, { count: assignedCount }, { data: batches }] = await Promise.all([
    supabase
      .from("tags")
      .select("*", { count: "exact", head: true })
      .eq("property_id", profile.property_id)
      .eq("status", "unassigned"),
    supabase
      .from("tags")
      .select("*", { count: "exact", head: true })
      .eq("property_id", profile.property_id)
      .eq("status", "assigned"),
    supabase
      .from("tag_batches")
      .select("id, prefix, quantity, created_at, exported_at")
      .eq("property_id", profile.property_id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl text-stone-900">Tags</h1>
      <p className="mt-1 text-stone-500">
        Generate tag batches yourself — no more waiting on a manual SQL insert.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:max-w-md">
        <StatCard label="Unassigned tags" value={unassignedCount ?? 0} />
        <StatCard label="Assigned tags" value={assignedCount ?? 0} />
      </div>

      {(unassignedCount ?? 0) === 0 && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No unassigned tags left — generate a batch below before the next planting.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-card">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                <th className="px-5 py-3 font-medium">Prefix</th>
                <th className="px-5 py-3 font-medium">Quantity</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {batches?.map((b) => (
                <tr key={b.id}>
                  <td className="px-5 py-3 font-medium text-stone-800">{b.prefix}</td>
                  <td className="px-5 py-3 text-stone-600">{b.quantity}</td>
                  <td className="px-5 py-3 text-stone-500">
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/tags/${b.id}`} className="text-emerald-800 hover:underline">
                      View / print artwork →
                    </Link>
                  </td>
                </tr>
              ))}
              {(!batches || batches.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-stone-400">
                    No batches yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <NewBatchForm />
      </div>
    </div>
  );
}
