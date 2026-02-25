import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_NAME, verifySessionToken } from "../../../lib/auth";

export default async function DashboardPage() {
  const sessionToken = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(sessionToken);

  if (!session) {
    redirect("/login?next=/dashboard");
  }

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Session aktiv.</p>
    </main>
  );
}
