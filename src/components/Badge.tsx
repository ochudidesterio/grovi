const variants = {
  emerald: "bg-emerald-100 text-emerald-800",
  stone: "bg-stone-100 text-stone-700",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
} as const;

export function Badge({
  children,
  variant = "stone",
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}

export function TreeStatusBadge({ status }: { status: "alive" | "dead" }) {
  return status === "alive" ? (
    <Badge variant="emerald">● Alive</Badge>
  ) : (
    <Badge variant="red">● Dead</Badge>
  );
}

export function TagStatusBadge({ status }: { status: "assigned" | "unassigned" }) {
  return status === "assigned" ? (
    <Badge variant="stone">Assigned</Badge>
  ) : (
    <Badge variant="amber">Unassigned</Badge>
  );
}
