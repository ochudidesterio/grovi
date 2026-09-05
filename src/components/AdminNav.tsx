"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const baseLinks = [
  { href: "/admin", label: "Dashboard", icon: "◧" },
  { href: "/admin/trees", label: "Trees", icon: "🌳" },
  { href: "/admin/trees/new", label: "Plant a tree", icon: "＋" },
  { href: "/admin/species", label: "Species", icon: "🌿" },
  { href: "/admin/tags", label: "Tags", icon: "🏷️" },
];

const superAdminLinks = [
  { href: "/admin/properties", label: "Properties", icon: "🏨" },
  { href: "/admin/staff", label: "Staff", icon: "👤" },
];

export function AdminNav({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const pathname = usePathname();
  const links = isSuperAdmin ? [...baseLinks, ...superAdminLinks] : baseLinks;

  return (
    <nav className="space-y-1">
      {links.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-emerald-800 text-white"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            <span className="w-4 text-center">{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
