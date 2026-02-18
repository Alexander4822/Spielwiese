import { SortableFilterableTable } from "@/components/sortable-filterable-table";
import { realEstatePositions } from "@/lib/dashboard-data";

export default function RealEstatePage() {
  const rows = realEstatePositions.map((item) => ({
    objectName: item.objectName,
    marketValueEur: item.marketValueEur,
    mortgageRemainingEur: item.mortgageRemainingEur,
    equityBoundEur: item.marketValueEur - item.mortgageRemainingEur,
  }));

  return (
    <SortableFilterableTable
      title="Real Estate"
      rows={rows}
      columns={[
        { key: "objectName", label: "Objekt" },
        { key: "marketValueEur", label: "Marktwert", render: (value) => formatCurrency(Number(value)) },
        { key: "mortgageRemainingEur", label: "Restschuld", render: (value) => formatCurrency(Number(value)) },
        { key: "equityBoundEur", label: "Gebundenes EK", render: (value) => formatCurrency(Number(value)) },
      ]}
    />
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}
