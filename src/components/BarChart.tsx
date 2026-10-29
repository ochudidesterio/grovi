export interface BarDatum {
  label: string;
  value: number;
  /** Extra line in the hover tooltip, under the value. */
  detail?: string;
}

function niceMax(max: number) {
  if (max <= 4) return Math.max(max, 1);
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  return Math.ceil(max / step) * step;
}

/**
 * Single-series vertical bar chart in plain HTML/CSS — server-rendered, no
 * chart library. One hue (emerald), thin bars with rounded data-ends, a
 * recessive grid, and a hover tooltip per bar (the whole column is the hit
 * target, not just the bar). A visually hidden table carries the same data
 * for screen readers.
 */
export function BarChart({
  data,
  valueLabel,
  showValues = false,
  height = 180,
}: {
  data: BarDatum[];
  /** Unit for the tooltip and table, e.g. "trees" or "guests". */
  valueLabel: string;
  /** Print the value above each bar — only for a handful of bars. */
  showValues?: boolean;
  height?: number;
}) {
  const top = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const ticks = [top, top / 2, 0];

  return (
    <div>
      <div className="flex gap-2" aria-hidden="true">
        <div className="relative w-6 shrink-0 text-right text-[11px] tabular-nums text-stone-400" style={{ height }}>
          {ticks.map((t, i) => (
            <span
              key={i}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
            >
              {Number.isInteger(t) ? t : ""}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height }}>
            {ticks.map((_, i) => (
              <div
                key={i}
                className={`absolute inset-x-0 border-t ${i === ticks.length - 1 ? "border-stone-300" : "border-stone-100"}`}
                style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
              />
            ))}
            <div className="absolute inset-0 flex items-end gap-0.5">
              {data.map((d) => (
                <div key={d.label} className="group relative flex h-full flex-1 items-end justify-center">
                  <div
                    className="w-full max-w-[28px] rounded-t bg-emerald-700 transition-colors group-hover:bg-emerald-900"
                    style={{ height: `${top > 0 ? (d.value / top) * 100 : 0}%` }}
                  />
                  {showValues && d.value > 0 && (
                    <span
                      className="absolute text-[11px] font-medium tabular-nums text-stone-600"
                      style={{ bottom: `calc(${(d.value / top) * 100}% + 4px)` }}
                    >
                      {d.value}
                    </span>
                  )}
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-stone-900 px-2.5 py-1.5 text-xs text-white shadow-lift group-hover:block">
                    <p className="text-white/60">{d.label}</p>
                    <p className="font-medium tabular-nums">
                      {d.value} {valueLabel}
                    </p>
                    {d.detail && <p className="text-white/80">{d.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-1.5 flex gap-0.5">
            {data.map((d, i) => (
              <span
                key={d.label}
                className="flex-1 truncate text-center text-[11px] text-stone-500"
              >
                {/* Thin out labels on dense charts so they don't collide */}
                {data.length <= 8 || i % 2 === 0 ? d.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>
                {d.value} {valueLabel}
                {d.detail ? `, ${d.detail}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
