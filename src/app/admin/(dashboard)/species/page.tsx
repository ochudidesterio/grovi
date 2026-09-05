import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { NewSpeciesForm } from "./NewSpeciesForm";

export default async function SpeciesPage() {
  const profile = await getCurrentProfile();
  if (!profile?.property_id) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
        <p className="text-sm text-stone-600">Your account isn&apos;t linked to a property yet.</p>
      </div>
    );
  }

  const supabase = createClient();
  const { data: species } = await supabase
    .from("species")
    .select("id, common_name, local_name, significance, property_id")
    .or(`property_id.eq.${profile.property_id},property_id.is.null`)
    .order("common_name");

  return (
    <div>
      <h1 className="font-display text-3xl text-stone-900">Species</h1>
      <p className="mt-1 text-stone-500">
        The species library staff choose from when planting a tree.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-card">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                <th className="px-5 py-3 font-medium">Common name</th>
                <th className="px-5 py-3 font-medium">Local name</th>
                <th className="px-5 py-3 font-medium">Shared</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {species?.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-3 font-medium text-stone-800">{s.common_name}</td>
                  <td className="px-5 py-3 text-stone-600">{s.local_name ?? "—"}</td>
                  <td className="px-5 py-3 text-stone-400">
                    {s.property_id === null ? "Yes" : ""}
                  </td>
                </tr>
              ))}
              {(!species || species.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-stone-400">
                    No species yet — add the first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <NewSpeciesForm />
      </div>
    </div>
  );
}
