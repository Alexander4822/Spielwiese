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

export default function EquitiesPage() {
  const equities = portfolioSnapshot.assets.equitiesEtfs;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equities & ETFs</CardTitle>
        <CardDescription>
          Gesamt (approx): {euro(equities.totalValueEurApprox)} · Stand {equities.asOf}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Position</TableHead>
              <TableHead>Stück</TableHead>
              <TableHead>Marktwert</TableHead>
              <TableHead>Stand</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equities.positions.map((position) => (
              <TableRow key={position.symbolOrName}>
                <TableCell className="font-medium">{position.symbolOrName}</TableCell>
                <TableCell>{position.shares ?? "n/a"}</TableCell>
                <TableCell>{euro(position.marketValueEur)}</TableCell>
                <TableCell>{position.asOf}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground">
          Nicht attributierter Restwert: {euro(equities.otherUnattributedValueEur)}
        </p>
      </CardContent>
    </Card>
  );
}
