import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AssetRow = {
  name: string;
  value: string;
  allocation: string;
  status: "stable" | "watch";
};

export function AssetTable({ rows }: { rows: AssetRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Asset</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Allocation</TableHead>
          <TableHead>Signal</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.name}>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell>{row.value}</TableCell>
            <TableCell>{row.allocation}</TableCell>
            <TableCell>
              <Badge variant={row.status === "stable" ? "default" : "secondary"}>{row.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
