import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { NewPropertyForm } from "./NewPropertyForm";
import Link from "next/link";

export default async function PropertiesPage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "super_admin") {
    return (
      <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-card">
        <p className="text-sm text-sand-600">Only super admins can manage properties.</p>
      </div>
    );
  }

  const supabase = createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, slug, brand_color, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-3xl text-sand-900">Properties</h1>
      <p className="mt-1 text-sand-500">Every property on the platform.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-card">
          <ul className="divide-y divide-sand-100">
            {properties?.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/p/${p.slug}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-sand-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-8 w-8 shrink-0 rounded-full"
                      style={{ backgroundColor: p.brand_color ?? "#065f46" }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-sand-800">{p.name}</p>
                      <p className="truncate text-xs text-sand-400">/{p.slug}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm text-brand-800">View grove →</span>
                </Link>
              </li>
            ))}
            {(!properties || properties.length === 0) && (
              <li className="px-5 py-8 text-center text-sm text-sand-400">No properties yet.</li>
            )}
          </ul>
        </div>

        <NewPropertyForm />
      </div>
    </div>
  );
}
