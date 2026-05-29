import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ExpenseFilters } from "@/components/ExpenseFilters";
import { ExpenseTable } from "@/components/ExpenseTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/ExpenseForm";
import { Plus } from "lucide-react";

type SP = { from?: string; to?: string; category?: string; q?: string };

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const userId = await requireUser();
  const sp = await searchParams;

  const where: Record<string, unknown> = { clerkUserId: userId };
  if (sp.from || sp.to) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (sp.from) dateFilter.gte = new Date(sp.from);
    if (sp.to) dateFilter.lte = new Date(sp.to);
    where.date = dateFilter;
  }
  if (sp.category) where.categoryId = sp.category;
  if (sp.q) where.note = { contains: sp.q, mode: "insensitive" };

  const [rows, categories] = await Promise.all([
    db.expense.findMany({
      where,
      orderBy: { date: "desc" },
      include: { category: { select: { name: true, color: true, icon: true } } },
    }),
    db.category.findMany({
      where: { clerkUserId: userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const tableRows = rows.map((r) => ({
    id: r.id,
    amount: r.amount.toString(),
    date: r.date,
    note: r.note,
    category: r.category,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
        <Dialog>
          <DialogTrigger
            render={
              <Button>
                <Plus className="h-4 w-4 mr-1" /> New expense
              </Button>
            }
          />
          <DialogContent>
            <DialogTitle>Add expense</DialogTitle>
            <ExpenseForm categories={categories} />
          </DialogContent>
        </Dialog>
      </div>
      <ExpenseFilters categories={categories} />
      <ExpenseTable rows={tableRows} />
    </div>
  );
}
