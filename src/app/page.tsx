import Link from "next/link";

const STEPS = [
  {
    icon: "🌱",
    title: "Plant a tree, tag it",
    body: "A staff member scans or keys the tag, photographs the sapling, captures GPS, and links it to the guest.",
  },
  {
    icon: "📷",
    title: "Growth gets documented",
    body: "Quarterly visits add new photos to the same page — a timeline that keeps building long after checkout.",
  },
  {
    icon: "🌳",
    title: "Guests revisit it, anywhere",
    body: "A public page they can share — real proof the tree exists, still standing, still growing.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50">
      <section className="bg-emerald-900 px-6 py-24 text-center text-white">
        <p className="font-display text-5xl">Grovi</p>
        <p className="mx-auto mt-4 max-w-xl text-lg text-emerald-100">
          A tree planted, and a record that lasts — turn a guest&apos;s tree-planting
          moment into a page they can revisit for years.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/p/demo"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-emerald-900 shadow-card hover:bg-emerald-50"
          >
            See a live grove →
          </Link>
          <Link
            href="/admin/login"
            className="rounded-lg border border-white/30 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
          >
            Staff sign in
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-center font-display text-2xl text-stone-900">How it works</h2>
        <div className="mt-10 grid gap-10 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.title} className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
                {step.icon}
              </span>
              <p className="mt-4 font-medium text-stone-800">{step.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-stone-200 py-8 text-center text-xs text-stone-400">
        Grovi — Zafrionet Ltd
      </footer>
    </main>
  );
}
