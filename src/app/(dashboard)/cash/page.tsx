import { AssetTable } from "@/components/asset-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const cashRows = [
  { name: "Main Custody Account", value: "€1.1M", allocation: "11%", status: "stable" as const },
  { name: "Operating Buffer", value: "€650k", allocation: "6.5%", status: "stable" as const },
];

export default function CashPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash</CardTitle>
      </CardHeader>
      <CardContent>
        <AssetTable rows={cashRows} />
      </CardContent>
    </Card>
  );
}
