import { AssetTable } from "@/components/asset-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const realEstateRows = [
  { name: "Munich Residential", value: "€2.8M", allocation: "28%", status: "stable" as const },
  { name: "Berlin Office", value: "€1.4M", allocation: "14%", status: "watch" as const },
];

export default function RealEstatePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Real Estate</CardTitle>
      </CardHeader>
      <CardContent>
        <AssetTable rows={realEstateRows} />
      </CardContent>
    </Card>
  );
}
