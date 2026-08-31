"use client";

import { QRCodeSVG } from "qrcode.react";

export function ArtworkGrid({
  tags,
  baseUrl,
}: {
  tags: { code: string }[];
  baseUrl: string;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-sm text-stone-500">
          {tags.length} tags — each QR encodes that tree&apos;s public page. Print this page
          (or save as PDF) to send to the engraving supplier.
        </p>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3 print:gap-6">
        {tags.map((t) => (
          <div
            key={t.code}
            className="flex flex-col items-center gap-2 rounded-xl border border-stone-200 p-4 print:break-inside-avoid print:border-stone-400"
          >
            <QRCodeSVG value={`${baseUrl}/t/${t.code}`} size={120} />
            <p className="font-mono text-sm font-medium text-stone-800">{t.code}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
