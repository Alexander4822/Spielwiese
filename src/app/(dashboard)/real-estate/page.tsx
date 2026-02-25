import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { euro, portfolioSnapshot } from "@/lib/portfolio-data";

export default function RealEstatePage() {
  const realEstate = portfolioSnapshot.assets.realEstate;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Real Estate</CardTitle>
          <CardDescription>
            Marktwert: {euro(realEstate.portfolioMarketValueEur)} · Debt: {euro(realEstate.portfolioDebtEur)} · Equity: {euro(realEstate.portfolioEquityEur)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objekt</TableHead>
                <TableHead>Wert</TableHead>
                <TableHead>Debt</TableHead>
                <TableHead>Kaltmiete/Monat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {realEstate.properties.map((property) => (
                <TableRow key={property.propertyId}>
                  <TableCell className="font-medium">{property.label}</TableCell>
                  <TableCell>{euro(property.marketValueEur)}</TableCell>
                  <TableCell>{euro(property.debtBalanceEur)}</TableCell>
                  <TableCell>{euro(property.rentColdEurPerMonth)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Kaltmieten-Summe/Monat: {euro(portfolioSnapshot.cashflow.rentalIncomeColdEurPerMonthSum)}
      </p>
    </div>
  );
}
