"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStaff } from "./actions";
import { PasswordInput } from "@/components/PasswordInput";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm placeholder:text-stone-400 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700";

export function InviteStaffForm({
  properties,
}: {
  properties: { id: string; name: string }[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm_password") as string;
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    startTransition(async () => {
      const result = await createStaff(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setDone(true);
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
      <h2 className="font-display text-lg text-stone-900">Create staff account</h2>
      <div className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-stone-700">Email</label>
          <input name="email" type="email" placeholder="staff@property.com" className={inputClass} required />
        </div>
        <div>
          <label className="text-sm font-medium text-stone-700">Full name</label>
          <input name="full_name" className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-medium text-stone-700">Property</label>
          <select name="property_id" className={inputClass} required defaultValue="">
            <option value="" disabled>
              Select a property
            </option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-stone-700">Role</label>
          <select name="role" className={inputClass} required defaultValue="staff">
            <option value="staff">Staff</option>
            <option value="property_admin">Property admin</option>
            <option value="super_admin">Super admin</option>
          </select>
        </div>
        <PasswordInput
          name="password"
          label="Password"
          placeholder="At least 8 characters"
          minLength={8}
          autoComplete="new-password"
          required
        />
        <PasswordInput
          name="confirm_password"
          label="Confirm password"
          minLength={8}
          autoComplete="new-password"
          required
        />
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {done && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Account created — share the password with them directly.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
