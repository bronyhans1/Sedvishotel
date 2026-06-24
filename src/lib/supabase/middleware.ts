import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { authDebug } from "@/lib/auth/debug-log";
import { isSupabaseConfigured, supabaseEnv } from "@/lib/supabase/config";
import { isSupabaseRequired } from "@/lib/supabase/production-guard";
import type { Database } from "@/lib/supabase/database.types";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/admin",
  "/book",
  "/booking",
  "/contact",
  "/about",
  "/gallery",
  "/reservation-lookup",
  "/rooms",
] as const;

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/dashboard")) {
    return false;
  }

  if (pathname === "/") {
    return true;
  }

  return PUBLIC_PATHS.some(
    (route) =>
      route !== "/" &&
      (pathname === route || pathname.startsWith(`${route}/`))
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  if (isSupabaseRequired() && pathname.startsWith("/dashboard")) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("error", "configuration");
    return NextResponse.redirect(loginUrl);
  }

  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient<Database>(
    supabaseEnv.url,
    supabaseEnv.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieNames = request.cookies.getAll().map((c) => c.name);

  authDebug("middleware.updateSession", {
    pathname,
    hasAuthUser: Boolean(user),
    authUserId: user?.id ?? null,
    authEmail: user?.email ?? null,
    supabaseCookies: cookieNames.filter((n) => n.includes("sb-")),
  });

  if (!user && !isPublicPath(pathname)) {
    authDebug("middleware.redirect", {
      reason: "no_auth_user_on_protected_path",
      from: pathname,
      to: "/login",
    });
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Do not auto-redirect /login → /dashboard here. signInAction redirects after a full
  // staff session is built; otherwise auth cookie + failed staff lookup causes a 307 loop
  // with the dashboard layout guard.

  return response;
}
