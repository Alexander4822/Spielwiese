import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "./src/lib/auth";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

function applyHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export function middleware(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;
  const requiresAuth = pathname.startsWith("/dashboard") || pathname.startsWith("/api/dashboard");

  if (requiresAuth) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = verifySessionToken(token);

    if (!session) {
      if (pathname.startsWith("/api/")) {
        return applyHeaders(NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 }));
      }

      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return applyHeaders(NextResponse.redirect(loginUrl));
    }
  }

  return applyHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/dashboard/:path*"],
};
