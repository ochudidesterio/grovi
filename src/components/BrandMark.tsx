import { BRAND } from "@/lib/brand";

/**
 * The brand's logo.
 *
 * - Inline (default) — for headers/nav: the square emblem beside the name
 *   set in light, widely tracked capitals (echoing the stacked lockup's
 *   type). Sized by the text size in `className` (e.g. "text-xl").
 * - `stacked` — the full official lockup image. Sized by a height class
 *   in `className` (e.g. "h-24").
 *
 * `onDark` switches to the white artwork for dark/photo backgrounds.
 */
export function BrandMark({
  className = "",
  onDark = false,
  stacked = false,
}: {
  className?: string;
  onDark?: boolean;
  stacked?: boolean;
}) {
  if (stacked) {
    const src = onDark ? BRAND.logoOnDark : BRAND.logo;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={BRAND.name} className={`w-auto ${className}`} />;
  }

  const emblem = onDark ? BRAND.emblemOnDark : BRAND.emblem;
  return (
    <span
      className={`inline-flex items-center gap-[0.6em] font-sans font-light uppercase leading-none tracking-[0.2em] ${
        onDark ? "text-white" : "text-brand-800"
      } ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={emblem} alt="" className="h-[1.7em] w-auto" />
      {BRAND.name}
    </span>
  );
}
