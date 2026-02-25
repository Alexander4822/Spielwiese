import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "../../../../../lib/auth";
import { logger } from "../../../../../lib/logger";

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });

  logger.info({ event: "auth.logout", route: "/api/auth/logout", status: 200 });

  return response;
}
