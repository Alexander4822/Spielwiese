# Sicherheits-Baseline (Single User)

Diese Beispiel-Implementierung setzt ein credentials-basiertes Login mit serverseitigem Session-Guard um.

## ENV-only Secrets

Folgende Variablen sind zwingend:

- `AUTH_SECRET` für das Signieren der Session-Cookies.
- `APP_PASSWORD_HASH` im Format `scrypt:<saltHex>:<digestHex>`.

Ein Hash kann lokal erzeugt werden:

```bash
node scripts/generate-password-hash.mjs "mein-passwort"
```

## Login-Flow

1. Client holt CSRF-Token über `GET /api/auth/csrf`.
2. Client sendet `POST /api/auth/login` mit Passwort + CSRF-Token.
3. Server verifiziert Passwort anhand `APP_PASSWORD_HASH`.
4. Bei Erfolg wird ein signiertes, `httpOnly` Session-Cookie gesetzt.

## Geschützte Routen

- `middleware.ts` schützt `/dashboard/**` und `/api/dashboard/**`.
- Nicht authentifizierte Benutzer werden nach `/login` umgeleitet.
- API-Aufrufe erhalten `401`.

## Logging-Hygiene

- Clientseitig werden keine Positionsdaten, Passwörter oder Nutzdaten geloggt.
- Serverseitig nur strukturierte, minimale Audit-Events (`event`, `route`, `status`, optional `sessionId`).

## Security Header + CSRF

- Security Header via `middleware.ts` (u. a. CSP, HSTS, X-Frame-Options).
- CSRF Double-Submit-Check für Login (`csrf_token` Cookie + Payload Token).

## Risiko / Alternative

Für rein lokale Nutzung ist dieses Single-User-Passwort-Modell ausreichend.
Für Multi-User-Betrieb sollte auf User-Tabelle + Rollenmodell (RBAC/ABAC) umgestellt werden,
inklusive Passwort-Policy, Rotation, MFA und dedizierten Audit-Streams.
