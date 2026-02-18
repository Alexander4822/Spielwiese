import { SortableFilterableTable } from "@/components/sortable-filterable-table";
import { positions } from "@/lib/dashboard-data";

export default function CryptoPage() {
  const rows = positions
    .filter((item) => item.category === "Crypto")
    .map((item) => ({
      name: item.name,
      valueEur: item.valueEur,
      change24h: item.change24h ?? 0,
      updatedAt: item.updatedAt ?? "-",
    }));

  return (
    <SortableFilterableTable
      title="Crypto"
      rows={rows}
      columns={[
        { key: "name", label: "Name" },
        { key: "valueEur", label: "Wert EUR", render: (value) => formatCurrency(Number(value)) },
        { key: "change24h", label: "24h %", render: (value) => `${Number(value).toFixed(2)}%` },
        { key: "updatedAt", label: "Last Update" },
      ]}
    />
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}
