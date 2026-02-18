import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { euro, portfolioSnapshot } from "@/lib/portfolio-data";

export default function OverviewPage() {
  const totals = portfolioSnapshot.totals;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Snapshot per {portfolioSnapshot.meta.snapshotAsOf} (ohne Crypto-Bewertung).</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="balance" className="w-full">
            <TabsList>
              <TabsTrigger value="balance">Bilanz</TabsTrigger>
              <TabsTrigger value="quality">Datenqualität</TabsTrigger>
            </TabsList>
            <TabsContent value="balance" className="mt-4 grid gap-2 text-sm text-muted-foreground">
              <p>Assets ex Crypto: {euro(totals.assetsTotalEurExCrypto)}</p>
              <p>Verbindlichkeiten (bekannt): {euro(totals.liabilitiesTotalEurKnown)}</p>
              <p>Net Worth ex Crypto (geschätzt): {euro(totals.netWorthEurEstimatedExCrypto)}</p>
              <p>Merker (01.01.2026): {euro(totals.netWorthEurMarker)}</p>
            </TabsContent>
            <TabsContent value="quality" className="mt-4 grid gap-2 text-sm text-muted-foreground">
              <p>Equities/Cash totals: {portfolioSnapshot.meta.dataQuality.totalsForEquitiesCash}</p>
              <p>Crypto value: {portfolioSnapshot.meta.dataQuality.cryptoValueEur}</p>
              <p>Equities positions detail as of: {portfolioSnapshot.meta.dataQuality.equitiesPositionsDetailAsOf}</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
