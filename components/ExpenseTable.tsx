import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoryPill } from "./CategoryPill";
import { formatCurrency } from "@/lib/dates";
import { format } from "date-fns";

type Row = {
  id: string;
  amount: string;
  date: Date;
  note: string | null;
  category: { name: string; color: string; icon: string };
};

export function ExpenseTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        No expenses match these filters.
      </p>
    );
  }
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} className="hover:bg-muted/50">
              <TableCell className="font-mono text-sm">
                <Link href={`/expenses/${r.id}`} className="hover:underline">
                  {format(r.date, "MMM d, yyyy")}
                </Link>
              </TableCell>
              <TableCell><CategoryPill {...r.category} /></TableCell>
              <TableCell className="text-muted-foreground truncate max-w-[24ch]">{r.note ?? "—"}</TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(r.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
