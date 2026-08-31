import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { InviteStaffForm } from "./InviteStaffForm";

export default async function StaffPage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "super_admin") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
        <p className="text-sm text-stone-600">Only super admins can manage staff.</p>
      </div>
    );
  }

  const supabase = createClient();
  const [{ data: staff }, { data: properties }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, role, full_name, properties(name)")
      .order("created_at", { ascending: false }),
    supabase.from("properties").select("id, name").order("name"),
  ]);

  // Emails live in auth.users, not profiles — only the admin client can see
  // them, which is fine since this whole page is already super_admin-gated.
  const admin = createAdminClient();
  const { data: authUsers } = await admin.auth.admin.listUsers();
  const emailById = new Map(authUsers?.users.map((u) => [u.id, u.email]));

  return (
    <div>
      <h1 className="font-display text-3xl text-stone-900">Staff</h1>
      <p className="mt-1 text-stone-500">Everyone with admin access, across every property.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-card">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Property</th>
                <th className="px-5 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {staff?.map((s) => {
                const property = Array.isArray(s.properties) ? s.properties[0] : s.properties;
                return (
                  <tr key={s.id}>
                    <td className="px-5 py-3 font-medium text-stone-800">{s.full_name ?? "—"}</td>
                    <td className="px-5 py-3 text-stone-600">{emailById.get(s.id) ?? "—"}</td>
                    <td className="px-5 py-3 text-stone-600">{property?.name ?? "All properties"}</td>
                    <td className="px-5 py-3 capitalize text-stone-600">{s.role.replace("_", " ")}</td>
                  </tr>
                );
              })}
              {(!staff || staff.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-stone-400">
                    No staff yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <InviteStaffForm properties={properties ?? []} />
      </div>
    </div>
  );
}
