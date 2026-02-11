"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Snapshot = { date: string; netWorth: number };

export function NetWorthChart({ snapshots }: { snapshots: Snapshot[] }) {
  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <h2 className="mb-3 text-lg font-semibold">Net-Worth-Zeitreihe</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={snapshots}>
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Line type="monotone" dataKey="netWorth" stroke="#0f172a" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}
