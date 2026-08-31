import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/AdminNav";
import { SignOutButton } from "@/components/SignOutButton";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, properties(name)")
    .eq("id", user?.id)
    .maybeSingle();

  const property = Array.isArray(profile?.properties)
    ? profile?.properties[0]
    : profile?.properties;

  return (
    <div className="min-h-screen bg-stone-50 lg:flex">
      <aside className="border-b border-stone-200 bg-white px-4 py-5 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:px-5 lg:py-8">
        <div className="flex items-center justify-between lg:block">
          <Link href="/admin" className="font-display text-xl text-emerald-900">
            Grovi
          </Link>
          <p className="mt-1 hidden text-xs text-stone-400 lg:block">
            {property?.name ?? "Admin"}
          </p>
          <div className="lg:hidden">
            <SignOutButton />
          </div>
        </div>
        <div className="mt-6">
          <AdminNav isSuperAdmin={profile?.role === "super_admin"} />
        </div>
        <div className="mt-8 hidden border-t border-stone-100 pt-4 lg:block">
          <p className="text-sm font-medium text-stone-700">
            {profile?.full_name ?? user?.email}
          </p>
          <p className="text-xs capitalize text-stone-400">{profile?.role?.replace("_", " ")}</p>
          <div className="mt-2">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <main className="flex-1 px-4 py-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
