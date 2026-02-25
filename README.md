# Spielwiese Portfolio Refresh Konzept

Dieses Repository enthält eine kompakte Referenz-Implementierung für EPX-Refresh, tägliche Net-Worth-Snapshots und Fallback-Verhalten ohne Dauerprozess.

## Scheduler-Konzept

Geplante Reihenfolge:

1. **Beim Start**: einmaliger `EPX-Update` (`epx_startup_update`).
2. **Danach täglich**: `EPX-Refresh` (`epx_daily_refresh`).
3. **Täglich**: `NetWorthSnapshot` (`networth_daily_snapshot`).

Die zentrale Definition liegt in `scheduler_concept()`.

## Fallback ohne Dauerprozess

Wenn in der Zielplattform kein langlebiger Prozess läuft:

- Strategie `on_demand_with_ttl_cache` verwenden.
- Bei Page-Load (oder API-Request) refreshen.
- Daten per TTL-Cache puffern, um Provider-Aufrufe zu begrenzen.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -U pip pytest
```

## ENV-Konfiguration

Siehe `.env.example` für alle relevanten Variablen:

- Datenbank (`DATABASE_URL`)
- Auth (`AUTH_SECRET`, optional OAuth)
- Optionale Provider/API-Keys (`EPX_API_KEY`)

## Lokale Entwicklung

```bash
pytest
```

Optional manuelle Prüfung per Python REPL mit `portfolio.scheduler.scheduler_concept()` und `portfolio.epx.parse_epx_html()`.

## Refresh-Verhalten

- Mit Dauerprozess: scheduler-gesteuerte tägliche Jobs.
- Ohne Dauerprozess: on-demand + TTL-Cache.
- Für unzuverlässige Scheduler-Umgebungen: Jobs extern per Host-Cron triggern (`curl` auf Job-Endpoint oder CLI-Task).

## Bekannte Provider-Limits

- EPX-Quellen können HTML-Strukturänderungen haben.
- Rate Limits oder Captcha können Abrufe blockieren.
- Daher: defensive Parser-Tests mit Fixtures + strukturabweichenden Varianten.

## Optional Docker (Self-Hosting Schnellstart)

```bash
docker compose up --build
```

Container startet standardmäßig den Testlauf (Referenz-Setup).
