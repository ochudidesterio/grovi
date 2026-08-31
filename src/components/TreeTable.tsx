"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TreeStatusBadge } from "@/components/Badge";

export interface TreeRow {
  id: string;
  code: string;
  species: string;
  guest: string;
  plantingDate: string;
  status: "alive" | "dead";
  replantCount: number;
}

const PAGE_SIZE = 20;

export function TreeTable({ rows }: { rows: TreeRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "alive" | "dead">("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesQuery =
        !q ||
        r.code.toLowerCase().includes(q) ||
        r.species.toLowerCase().includes(q) ||
        r.guest.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [rows, query, statusFilter]);

  // Searching/filtering can easily land you past the last page of the new
  // result set — snap back to page 1 whenever the filters change.
  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by tag, species, or guest…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
        />
        <div className="flex gap-1 rounded-lg border border-stone-300 p-1">
          {(["all", "alive", "dead"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1 text-sm capitalize transition-colors ${
                statusFilter === s
                  ? "bg-emerald-800 text-white"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="ml-auto text-sm text-stone-400">
          {filtered.length} of {rows.length} trees
        </p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
              <th className="px-5 py-3 font-medium">Tag</th>
              <th className="px-5 py-3 font-medium">Species</th>
              <th className="px-5 py-3 font-medium">Planted by</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {pageRows.map((r) => (
              <tr
                key={r.id}
                onClick={() => router.push(`/admin/trees/${r.code}`)}
                className="cursor-pointer hover:bg-stone-50"
              >
                <td className="px-5 py-3 font-medium text-stone-800">{r.code}</td>
                <td className="px-5 py-3 text-stone-600">{r.species}</td>
                <td className="px-5 py-3 text-stone-600">{r.guest}</td>
                <td className="px-5 py-3 text-stone-500">{r.plantingDate}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <TreeStatusBadge status={r.status} />
                    {r.replantCount > 0 && (
                      <span className="text-xs text-stone-400">replanted ×{r.replantCount}</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/trees/${r.code}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-emerald-800 hover:underline"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-stone-400">
                  No trees match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-stone-100 px-5 py-3">
            <p className="text-sm text-stone-400">
              Page {currentPage} of {pageCount}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40"
              >
                ← Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
                className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
