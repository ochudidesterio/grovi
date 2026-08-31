import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Routes that must stay reachable without a session — the whole point of
  // most of these is to establish one. /admin/auth/callback in particular
  // must never be gated: it's what exchanges a reset/invite code for the
  // session in the first place, so gating it would make the link a dead end.
  const PUBLIC_ADMIN_PATHS = [
    "/admin/login",
    "/admin/forgot-password",
    "/admin/reset-password",
    "/admin/auth/callback",
  ];
  const isAdminRoute =
    request.nextUrl.pathname.startsWith("/admin") &&
    !PUBLIC_ADMIN_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isAdminRoute && !user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
