"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const search = useSearchParams();

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const csrfResponse = await fetch("/api/auth/csrf", { method: "GET" });
      const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password, csrfToken }),
      });

      if (!loginResponse.ok) {
        setError("Login fehlgeschlagen.");
        return;
      }

      const next = search.get("next") || "/dashboard";
      router.replace(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <h1>Login</h1>
      <form onSubmit={onSubmit}>
        <label htmlFor="password">Passwort</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button type="submit" disabled={busy}>
          {busy ? "Bitte warten..." : "Anmelden"}
        </button>
      </form>
      {error ? <p role="alert">{error}</p> : null}
    </main>
  );
}
