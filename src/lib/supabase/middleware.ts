import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

// "/" là landing page công khai — ai cũng xem được, không cần đăng nhập.
const PUBLIC_PREFIXES = ["/login", "/register", "/auth/callback"];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((path) => pathname.startsWith(path));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: avoid writing logic between createServerClient and
  // getUser(). A simple mistake could make it very hard to debug
  // session-related issues.
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const { pathname, searchParams } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    const next = searchParams.get("next");
    url.pathname = next && next.startsWith("/") ? next : "/chat";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: returning the supabaseResponse object as-is keeps the
  // refreshed auth cookies in sync between the request and the response.
  return supabaseResponse;
}
