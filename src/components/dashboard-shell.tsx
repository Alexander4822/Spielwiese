"use client";

import Link from "next/link";
import { useState } from "react";
import { getNetWorth, getTotalAssets, getTotalLiabilities, LAST_PRICE_REFRESH } from "@/lib/dashboard-data";

const TABS = [
  { href: "/", label: "Overview" },
  { href: "/equities", label: "Equities" },
  { href: "/crypto", label: "Crypto" },
  { href: "/real-estate", label: "Real Estate" },
  { href: "/cash", label: "Cash" },
  { href: "/settings", label: "Settings" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<string>("");
  const lastUpdate = new Date(LAST_PRICE_REFRESH).toLocaleString("de-DE");

  const refreshPrices = async () => {
    setIsRefreshing(true);
    setRefreshStatus("");
    try {
      const response = await fetch("/api/prices/refresh", { method: "POST" });
      if (!response.ok) {
        throw new Error("Refresh request failed");
      }
      setRefreshStatus("Preise wurden aktualisiert.");
    } catch {
      setRefreshStatus("Kurse aktuell nicht verfügbar – letzte Aktualisierung: " + lastUpdate);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6">
      <header className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <KpiCard title="Assets" value={formatCurrency(getTotalAssets())} />
          <KpiCard title="Liabilities" value={formatCurrency(getTotalLiabilities())} />
          <KpiCard title="Net Worth" value={formatCurrency(getNetWorth())} />
          <KpiCard title="Last Price Refresh" value={lastUpdate} />
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Kurse aktuell nicht verfügbar – letzte Aktualisierung: {lastUpdate}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => (
            <Link key={tab.href} href={tab.href} className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
              {tab.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={refreshPrices}
            disabled={isRefreshing}
            className="ml-auto rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {isRefreshing ? "Refreshing..." : "Refresh Prices"}
          </button>
        </div>

        {refreshStatus ? <p className="text-sm text-slate-700">{refreshStatus}</p> : null}
      </header>
      <main>{children}</main>
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}
