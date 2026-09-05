import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ArtworkGrid } from "@/components/ArtworkGrid";
import Link from "next/link";

interface Props {
  params: { batchId: string };
}

export default async function BatchArtworkPage({ params }: Props) {
  const profile = await getCurrentProfile();
  if (!profile?.property_id) notFound();

  const supabase = createClient();

  const { data: batch } = await supabase
    .from("tag_batches")
    .select("id, prefix, quantity, property_id, properties(domain, slug)")
    .eq("id", params.batchId)
    .maybeSingle();
  if (!batch || batch.property_id !== profile.property_id) notFound();

  const { data: tags } = await supabase
    .from("tags")
    .select("code")
    .eq("batch_id", batch.id)
    .order("code");

  const property = Array.isArray(batch.properties) ? batch.properties[0] : batch.properties;
  const baseUrl = property?.domain
    ? `https://${property.domain}`
    : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return (
    <div>
      <Link href="/admin/tags" className="text-sm text-stone-500 hover:text-stone-800 print:hidden">
        ← Back to tags
      </Link>
      <h1 className="mt-2 font-display text-3xl text-stone-900 print:mt-0">
        Batch {batch.prefix} — {batch.quantity} tags
      </h1>

      <div className="mt-6">
        <ArtworkGrid tags={tags ?? []} baseUrl={baseUrl} />
      </div>
    </div>
  );
}
