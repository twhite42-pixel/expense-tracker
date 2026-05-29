import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/ExpenseForm";
import { CategoryDonut } from "@/components/charts/CategoryDonut";
import { DailyBars } from "@/components/charts/DailyBars";
import { CategoryPill } from "@/components/CategoryPill";
import { currentMonthRange, last30DaysRange, formatCurrency } from "@/lib/dates";
import { format, eachDayOfInterval } from "date-fns";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const userId = await requireUser();
  const monthRange = currentMonthRange();
  const thirtyRange = last30DaysRange();

  const [monthExpenses, recent, categories] = await Promise.all([
    db.expense.findMany({
      where: {
        clerkUserId: userId,
        date: { gte: monthRange.from, lte: monthRange.to },
      },
      include: { category: { select: { name: true, color: true, icon: true } } },
    }),
    db.expense.findMany({
      where: { clerkUserId: userId },
      orderBy: { date: "desc" },
      take: 5,
      include: { category: { select: { name: true, color: true, icon: true } } },
    }),
    db.category.findMany({
      where: { clerkUserId: userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const monthTotal = monthExpenses.reduce((acc, e) => acc + Number(e.amount), 0);

  // Donut data
  const byCat = new Map<string, { value: number; color: string }>();
  for (const e of monthExpenses) {
    const key = e.category.name;
    const prev = byCat.get(key);
    byCat.set(key, {
      value: (prev?.value ?? 0) + Number(e.amount),
      color: e.category.color,
    });
  }
  const donut = Array.from(byCat, ([name, v]) => ({ name, value: v.value, color: v.color }));

  // Daily bars (last 30 days)
  const dailyExpenses = await db.expense.findMany({
    where: {
      clerkUserId: userId,
      date: { gte: thirtyRange.from, lte: thirtyRange.to },
    },
    select: { date: true, amount: true },
  });
  const dayMap = new Map<string, number>();
  for (const e of dailyExpenses) {
    const key = format(e.date, "MMM d");
    dayMap.set(key, (dayMap.get(key) ?? 0) + Number(e.amount));
  }
  const daily = eachDayOfInterval({ start: thirtyRange.from, end: thirtyRange.to }).map((d) => {
    const key = format(d, "MMM d");
    return { date: key, total: dayMap.get(key) ?? 0 };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{format(monthRange.from, "MMMM yyyy")}</p>
          <h1 className="text-3xl font-semibold tracking-tight font-mono">{formatCurrency(monthTotal)}</h1>
        </div>
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

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">By category, this month</h2>
          <CategoryDonut data={donut} />
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Last 30 days</h2>
          <DailyBars data={daily} />
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent</h2>
          <Link href="/expenses" className="text-sm text-muted-foreground hover:text-foreground">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No expenses yet. Add your first one above.</p>
        ) : (
          <ul className="divide-y">
            {recent.map((r) => (
              <li key={r.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CategoryPill {...r.category} />
                  <span className="text-sm text-muted-foreground">{format(r.date, "MMM d")}</span>
                  {r.note && <span className="text-sm">{r.note}</span>}
                </div>
                <span className="font-mono">{formatCurrency(Number(r.amount))}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
