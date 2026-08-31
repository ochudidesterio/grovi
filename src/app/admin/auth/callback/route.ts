import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Landing point for password-reset and staff-invite email links.
//
// Self-service password resets (forgot-password/page.tsx calling
// resetPasswordForEmail from the browser) arrive with a PKCE `code` — that
// works because the requesting browser already stored a matching
// code_verifier cookie when it kicked off the flow.
//
// Staff invites (staff/actions.ts calling admin.inviteUserByEmail) are
// triggered server-side with no browser involved, so there is no
// code_verifier anywhere to match a `code` against — exchangeCodeForSession
// for those links will always fail. Those arrive instead as `token_hash` +
// `type`, verified via verifyOtp, which doesn't depend on any prior
// client-side state and works cross-device.
//
// Whichever flow runs, a failure must NOT fall through to `next` (typically
// /admin/reset-password) — that page blindly calls auth.updateUser() on
// whatever session cookie already exists, which would silently change the
// password of whoever is currently logged in in this browser (e.g. the
// super_admin who sent the invite) instead of failing visibly.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/admin";

  const supabase = createClient();
  let error = null;

  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "invite" | "recovery" | "email",
    }));
  } else {
    error = { message: "Missing verification parameters" };
  }

  if (error) {
    return NextResponse.redirect(
      `${origin}/admin/login?error=${encodeURIComponent(
        "That link is invalid or has expired. Please request a new one."
      )}`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
