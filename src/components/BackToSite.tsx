import Link from "next/link";

/** Top-left "back to the public site" link for the standalone auth pages. */
export function BackToSite({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link
      href="/"
      className={`absolute left-5 top-5 z-10 text-[11px] font-semibold uppercase tracking-[0.2em] ${
        onDark ? "text-white/80 hover:text-white" : "text-sand-500 hover:text-sand-900"
      }`}
    >
      ← Back to site
    </Link>
  );
}
