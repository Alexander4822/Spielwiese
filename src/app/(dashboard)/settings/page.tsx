export default function SettingsPage() {
  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <h1 className="text-lg font-semibold">Settings</h1>
      <p className="mt-2 text-sm text-slate-700">
        Preisaktualisierungen können über den globalen "Refresh Prices" Button gestartet werden. Dieser ruft
        <code className="mx-1 rounded bg-slate-100 px-1 py-0.5">POST /api/prices/refresh</code>
        auf.
      </p>
    </section>
  );
}
