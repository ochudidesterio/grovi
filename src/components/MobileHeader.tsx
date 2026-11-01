"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AdminNav } from "./AdminNav";
import { SignOutButton } from "./SignOutButton";
import { BrandMark } from "@/components/BrandMark";

export function MobileHeader({
  isSuperAdmin,
  propertyName,
  displayName,
  role,
}: {
  isSuperAdmin: boolean;
  propertyName: string;
  displayName: string;
  role: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Layouts persist across client-side navigations in the App Router, so
  // this component's state doesn't reset on its own — without this, tapping
  // a nav link would change the page but leave the menu sitting open on top
  // of it.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent the page underneath from scrolling while the full-page menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="border-b border-sand-200 bg-white px-4 py-3 lg:hidden">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="text-[13px]">
          <BrandMark />
        </Link>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-sand-200 text-xl text-sand-600"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-sand-200 px-4 py-3">
            <Link
              href="/admin"
              className="text-[13px]"
              onClick={() => setOpen(false)}
            >
              <BrandMark />
            </Link>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-sand-200 text-xl text-sand-600"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-sand-400">{propertyName}</p>
            <div className="mt-3">
              <AdminNav isSuperAdmin={isSuperAdmin} />
            </div>
          </div>

          <div className="border-t border-sand-100 px-4 py-4">
            <p className="text-sm font-medium text-sand-700">{displayName}</p>
            <p className="text-xs capitalize text-sand-400">{role}</p>
            <div className="mt-3">
              <SignOutButton full />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
