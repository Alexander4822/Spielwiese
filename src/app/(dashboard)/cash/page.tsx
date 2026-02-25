import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { euro, portfolioSnapshot } from "@/lib/portfolio-data";

export default function CashPage() {
  const cash = portfolioSnapshot.assets.cash[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash</CardTitle>
        <CardDescription>Aggregierter Kassenbestand (Confidence: {cash.confidence}).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">{cash.label}</p>
        <p className="text-2xl font-semibold text-primary">{euro(cash.valueEur)}</p>
        <p className="text-xs text-muted-foreground">Stand: {cash.asOf}</p>
      </CardContent>
    </Card>
  );
}
