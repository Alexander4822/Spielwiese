import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Consolidated snapshot across asset classes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="allocation" className="w-full">
            <TabsList>
              <TabsTrigger value="allocation">Allocation</TabsTrigger>
              <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
            </TabsList>
            <TabsContent value="allocation" className="mt-4 text-sm text-muted-foreground">
              Equities 42%, Real Estate 28%, Cash 18%, Crypto 12%.
            </TabsContent>
            <TabsContent value="liquidity" className="mt-4 text-sm text-muted-foreground">
              24 months runway on current expense baseline.
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
