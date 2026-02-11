# UX-Umsetzung

## Modalbasierte Bearbeitung

- Jede Entität wird in einem separaten Modal erstellt/bearbeitet.
- Formulare nutzen bewusst `mode: "onSubmit"` für klassische, stabile Full-Submit-Flows.
- Optimistic updates sind optional: Nach erfolgreichem Submit kann der Eintrag lokal vorab aktualisiert werden.

## Risiko / Alternative

- Für höhere Stabilität startet der Flow mit klassischen Full-Submit-Forms.
- Inline-Editing bleibt als spätere Ausbaustufe vorgesehen, sobald Validierung + Fehlerbehandlung robust sind.

## RealEstate-Details

- Pflichtfelder: `segment`, `baselineValue`, `baselineMonth`.
- `loans` ist eine verschachtelte Liste für mehrere Darlehen pro Immobilie.
