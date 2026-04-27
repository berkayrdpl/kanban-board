import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieSet = { name: string; value: string; options: CookieOptions };

/**
 * Refreshes the user's session on every request and gates protected routes.
 *
 * Routes are split into:
 *   PUBLIC  — landing, auth screens, static assets
 *   PRIVATE — anything else (defaults to /boards…)
 *
 * If a logged-out user hits a private route, we redirect to /login.
 * If a logged-in user hits /login or /signup, we send them to /boards.
 */
const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/auth/",
  "/share/", // public read-only board view via token
  "/_next",
  "/favicon",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not put any logic between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic =
    pathname === "/" ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  // Logged-out user trying to access a protected route
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Logged-in user landing on auth pages — bounce to /boards
  if (user && (pathname === "/login" || pathname === "/signup" || pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/boards";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
