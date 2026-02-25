import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "../../../../lib/auth";
import { logger } from "../../../../lib/logger";

export async function GET(): Promise<NextResponse> {
  const sessionToken = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(sessionToken);

  if (!session) {
    logger.warn({ event: "api.dashboard.unauthorized", route: "/api/dashboard", status: 401 });
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  logger.info({ event: "api.dashboard.access", route: "/api/dashboard", status: 200, sessionId: session.sid });
  return NextResponse.json({ ok: true });
}
