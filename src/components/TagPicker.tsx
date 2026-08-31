"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm placeholder:text-stone-400 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700";

/**
 * Same idea as the mobile app's TagPickerField: browse currently-unassigned
 * tags instead of hunting for a code by memory, while manual typing still
 * works as a fallback (no live list, or a code that isn't in it yet).
 */
export function TagPicker({ status = "unassigned" }: { status?: "unassigned" | "assigned" }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<string[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("tags")
      .select("code")
      .eq("status", status)
      .order("code")
      .limit(500)
      .then(({ data }) => {
        if (!cancelled) setTags((data ?? []).map((t) => t.code));
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const filtered =
    tags?.filter((code) => code.toLowerCase().includes(query.trim().toLowerCase())) ?? [];

  return (
    <div ref={containerRef} className="relative">
      <input
        name="tag_code"
        placeholder={tags === null ? "Loading available tags…" : "DEMO-0003 or browse below"}
        className={inputClass}
        required
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
      />

      {tags !== null && (
        <p className="mt-1 text-xs text-stone-400">
          {tags.length} unassigned tag{tags.length === 1 ? "" : "s"} available
          {tags.length === 0 && (
            <>
              {" — "}
              <a href="/admin/tags" className="text-emerald-800 underline">
                generate a batch
              </a>
            </>
          )}
        </p>
      )}

      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-stone-200 bg-white py-1 shadow-lift">
          {filtered.slice(0, 50).map((code) => (
            <li key={code}>
              <button
                type="button"
                onMouseDown={() => {
                  setQuery(code);
                  setOpen(false);
                }}
                className="block w-full px-3.5 py-2 text-left text-sm font-mono text-stone-700 hover:bg-emerald-50"
              >
                {code}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
