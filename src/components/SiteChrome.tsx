import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { BRAND } from "@/lib/brand";

/** Guest-facing header. `overlay` floats it over a full-bleed hero photo. */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header
      className={
        overlay
          ? "absolute inset-x-0 top-0 z-10 px-6 py-5"
          : "border-b border-sand-200 bg-sand-50 px-6 py-4"
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/" className="text-[12px] sm:text-[14px]">
          <BrandMark onDark={overlay} />
        </Link>
        <Link
          href="/"
          className={`text-xs font-medium uppercase tracking-[0.18em] ${
            overlay ? "text-white/80 hover:text-white" : "text-sand-500 hover:text-sand-900"
          }`}
        >
          The forest
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-sand-200 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-xs text-sand-400">
        <BrandMark stacked className="h-14" />
        <p>{BRAND.tagline}</p>
        <Link href="/admin/login" className="hover:text-sand-700">
          Staff sign in
        </Link>
      </div>
    </footer>
  );
}
