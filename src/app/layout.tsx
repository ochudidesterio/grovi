import type { Metadata } from "next";
// Bundled locally (not next/font/google) — the build environment can't
// reliably reach fonts.gstatic.com, which made `next build` flaky/failing.
// Fontsource ships the actual font files as npm-installed static assets,
// so the build never depends on network access. Same reasoning as the
// capture app's local font assets.
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces/opsz.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grovi",
  description: "A tree planted, and a record that lasts.",
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
