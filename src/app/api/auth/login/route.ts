import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  createSessionToken,
  CSRF_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  verifyPassword,
} from "../../../../../lib/auth";
import { logger } from "../../../../../lib/logger";

type LoginBody = {
  password?: string;
  csrfToken?: string;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as LoginBody;
  const csrfCookie = (await cookies()).get(CSRF_COOKIE_NAME)?.value;

  if (!body.csrfToken || !csrfCookie || body.csrfToken !== csrfCookie) {
    logger.warn({ event: "auth.login.rejected", route: "/api/auth/login", reason: "csrf_mismatch", status: 403 });
    return NextResponse.json({ error: "Ungültiger CSRF-Token." }, { status: 403 });
  }

  if (!body.password || !verifyPassword(body.password)) {
    logger.warn({ event: "auth.login.rejected", route: "/api/auth/login", reason: "invalid_credentials", status: 401 });
    return NextResponse.json({ error: "Anmeldung fehlgeschlagen." }, { status: 401 });
  }

  const token = createSessionToken();
  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  logger.info({ event: "auth.login.success", route: "/api/auth/login", status: 200 });
  return response;
}
