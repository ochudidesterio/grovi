import type { Metadata } from "next";
// Bundled locally (not next/font/google) — the build environment can't
// reliably reach fonts.gstatic.com, which made `next build` flaky/failing.
// Fontsource ships the actual font files as npm-installed static assets,
// so the build never depends on network access. Same reasoning as the
// capture app's local font assets.
import "@fontsource-variable/inter";
import "@fontsource/italiana/400.css";
import "@fontsource/nanum-pen-script/400.css";
import "./globals.css";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: BRAND.name,
  description: BRAND.tagline,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
