import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ExpenseForm } from "@/components/ExpenseForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteExpense } from "@/actions/expenses";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  const { id } = await params;

  const [expense, categories] = await Promise.all([
    db.expense.findUnique({ where: { id } }),
    db.category.findMany({
      where: { clerkUserId: userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!expense || expense.clerkUserId !== userId) notFound();

  async function handleDelete() {
    "use server";
    await deleteExpense(id);
    redirect("/expenses");
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit expense</h1>
      <Card className="p-6">
        <ExpenseForm
          categories={categories}
          expenseId={expense.id}
          initial={{
            amount: Number(expense.amount.toString()),
            categoryId: expense.categoryId,
            date: expense.date,
            note: expense.note,
          }}
        />
      </Card>
      <form action={handleDelete}>
        <Button type="submit" variant="destructive" className="w-full">Delete expense</Button>
      </form>
    </div>
  );
}
