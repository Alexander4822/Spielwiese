import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { portfolioSnapshot } from "@/lib/portfolio-data";

export default function CryptoPage() {
  const crypto = portfolioSnapshot.assets.crypto;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crypto</CardTitle>
        <CardDescription>Holdings mit noch offener EUR-Bewertung.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {crypto.holdings.map((holding) => (
            <Badge key={holding.asset} variant="secondary" className="rounded-md px-3 py-1">
              {holding.asset}: {holding.amount}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Stand: {crypto.asOf}</p>
        <p className="text-sm text-muted-foreground">{crypto.pricingNote}</p>
      </CardContent>
    </Card>
  );
}
