import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6 text-center">
      <p className="font-display text-4xl text-emerald-900">Grovi</p>
      <p className="mt-3 max-w-sm text-stone-500">
        A tree planted, and a record that lasts.
      </p>
      <Link
        href="/admin/login"
        className="mt-8 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-medium text-white shadow-card hover:bg-emerald-900"
      >
        Staff login
      </Link>
    </main>
  );
}
