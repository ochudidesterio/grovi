import { ForestPage } from "@/components/ForestPage";

// Same reasoning as /t/[code]: tree counts change as staff plant more, so
// this can't be cached or it'll show a stale snapshot.
export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export default function GrovePage({ params }: Props) {
  return <ForestPage slug={params.slug} />;
}
