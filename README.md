# Family Office Dashboard Starter

Dieses Repository enthält ein Next.js-Projekt (TypeScript, App Router, `src/`-Struktur) mit Tailwind, shadcn/ui und Prisma + SQLite.

## Setup

```bash
npm install
npm run dev
```

Danach ist die Anwendung unter `http://localhost:3000` erreichbar.

## Prisma

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

`DATABASE_URL` ist standardmäßig auf SQLite gesetzt:

```env
DATABASE_URL="file:./dev.db"
```

## Enthaltene Grundstruktur

- Dashboard-Routen unter `src/app/(dashboard)/...`
- UI-Bausteine unter `src/components/ui`
- Utility-/Server-Layer unter `src/lib` und `src/server`
