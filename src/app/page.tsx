import { ForestPage } from "@/components/ForestPage";
import { BRAND } from "@/lib/brand";

// White-label: the home page *is* the brand's forest.
export const dynamic = "force-dynamic";

export default function Home() {
  return <ForestPage slug={BRAND.homePropertySlug} />;
}
