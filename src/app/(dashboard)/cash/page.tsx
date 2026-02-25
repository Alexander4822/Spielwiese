import { SortableFilterableTable } from "@/components/sortable-filterable-table";
import { positions } from "@/lib/dashboard-data";

export default function CashPage() {
  const rows = positions
    .filter((item) => item.category === "Cash")
    .map((item) => ({
      name: item.name,
      valueEur: item.valueEur,
      updatedAt: item.updatedAt ?? "-",
    }));

  return (
    <SortableFilterableTable
      title="Cash"
      rows={rows}
      columns={[
        { key: "name", label: "Name" },
        { key: "valueEur", label: "Wert EUR", render: (value) => formatCurrency(Number(value)) },
        { key: "updatedAt", label: "Last Update" },
      ]}
    />
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}
