"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#0f172a", "#334155", "#64748b", "#94a3b8"];

export type AllocationItem = {
  name: string;
  value: number;
  percentage: number;
};

export function OverviewAllocation({ data }: { data: AllocationItem[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-slate-200 p-4">
        <h2 className="mb-3 text-lg font-semibold">Asset Allocation</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="rounded-lg border border-slate-200 p-4">
        <h2 className="mb-3 text-lg font-semibold">Allocation Breakdown</h2>
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-2 py-2">Asset</th>
              <th className="px-2 py-2">Wert (EUR)</th>
              <th className="px-2 py-2">Anteil %</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.name} className="border-b border-slate-100">
                <td className="px-2 py-2">{item.name}</td>
                <td className="px-2 py-2">{formatCurrency(item.value)}</td>
                <td className="px-2 py-2">{item.percentage.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}
