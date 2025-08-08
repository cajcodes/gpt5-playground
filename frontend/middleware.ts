import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isLoggedIn = request.cookies.get("auth")?.value === "1";

  // If already logged in and visiting /login, send to /chat
  if (pathname.startsWith("/login")) {
    if (isLoggedIn) {
      const url = new URL("/chat", request.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Protect chat page and its API route
  const protectedPrefixes = ["/chat", "/api/chat"] as const;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    // Preserve where the user was going
    loginUrl.searchParams.set("from", `${pathname}${search || ""}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Run on all routes; we gate inside by path so we don't miss routes in dev
export const config = {
  matcher: ["/:path*"],
};


