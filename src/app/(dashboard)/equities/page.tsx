import { AssetTable } from "@/components/asset-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const equityRows = [
  { name: "Global ETF", value: "€2.4M", allocation: "24%", status: "stable" as const },
  { name: "European Dividend", value: "€1.1M", allocation: "11%", status: "watch" as const },
];

export default function EquitiesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Equities</CardTitle>
      </CardHeader>
      <CardContent>
        <AssetTable rows={equityRows} />
      </CardContent>
    </Card>
  );
}
