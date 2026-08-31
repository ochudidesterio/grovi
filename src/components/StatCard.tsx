export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 font-display text-3xl text-stone-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-400">{hint}</p>}
    </div>
  );
}
