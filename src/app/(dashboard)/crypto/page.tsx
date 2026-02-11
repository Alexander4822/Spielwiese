import { AssetTable } from "@/components/asset-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const cryptoRows = [
  { name: "Bitcoin", value: "€780k", allocation: "7.8%", status: "stable" as const },
  { name: "Ethereum", value: "€340k", allocation: "3.4%", status: "watch" as const },
];

export default function CryptoPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Crypto</CardTitle>
      </CardHeader>
      <CardContent>
        <AssetTable rows={cryptoRows} />
      </CardContent>
    </Card>
  );
}
