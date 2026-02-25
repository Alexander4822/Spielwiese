import { NextResponse } from "next/server";

import { createCsrfToken, CSRF_COOKIE_NAME } from "../../../../../lib/auth";

export async function GET(): Promise<NextResponse> {
  const csrfToken = createCsrfToken();

  const response = NextResponse.json({ csrfToken });
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: csrfToken,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15,
  });

  return response;
}
