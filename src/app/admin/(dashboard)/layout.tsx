import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/AdminNav";
import { SignOutButton } from "@/components/SignOutButton";
import { MobileHeader } from "@/components/MobileHeader";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

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
  const isSuperAdmin = profile?.role === "super_admin";
  const displayName = profile?.full_name ?? user?.email ?? "";

  return (
    <div className="min-h-screen bg-sand-50 lg:flex">
      <MobileHeader
        isSuperAdmin={isSuperAdmin}
        propertyName={property?.name ?? "Admin"}
        displayName={displayName}
        role={profile?.role?.replace("_", " ") ?? "staff"}
      />

      <aside className="hidden border-sand-200 bg-white lg:block lg:w-64 lg:shrink-0 lg:border-r lg:px-5 lg:py-8">
        <Link href="/admin" className="text-[13px]">
          <BrandMark />
        </Link>
        <p className="mt-1 text-xs text-sand-400">{property?.name ?? "Admin"}</p>

        <div className="mt-6">
          <AdminNav isSuperAdmin={isSuperAdmin} />
        </div>

        <div className="mt-8 border-t border-sand-100 pt-4">
          <p className="text-sm font-medium text-sand-700">{displayName}</p>
          <p className="text-xs capitalize text-sand-400">{profile?.role?.replace("_", " ")}</p>
          <div className="mt-2">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <main className="flex-1 px-4 py-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
