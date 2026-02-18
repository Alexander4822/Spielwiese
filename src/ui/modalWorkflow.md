# UX-Workflow (modalbasiert)

1. Benutzer öffnet pro Entität ein Modal (`Create`/`Edit`).
2. Formularvalidierung läuft beim Submit serverseitig (stabiler Full-Submit-Flow).
3. Optional kann später ein optimistisches Update ergänzt werden:
   - UI schreibt temporär in den Client-Store.
   - Server-Antwort bestätigt oder rollt zurück.
4. Für `RealEstate` wird ein dynamisches Nested-Formular für mehrere Darlehen genutzt (`loans[]`).

## Risiko/Alternative

Für Stabilität bleibt der Default zunächst bei klassischen Full-Submit-Forms. Inline-Editing ist als Folgeiteration vorgesehen, sobald die Validierung und Fehlerbehandlung produktiv stabil sind.
