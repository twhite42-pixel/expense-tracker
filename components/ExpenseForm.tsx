"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { expenseSchema, type ExpenseInput } from "@/lib/validators";
import { createExpense, updateExpense } from "@/actions/expenses";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

type Category = { id: string; name: string };

export function ExpenseForm({
  categories,
  initial,
  expenseId,
  onDone,
}: {
  categories: Category[];
  initial?: Partial<ExpenseInput> & { id?: string };
  expenseId?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      amount: initial?.amount ?? 0,
      categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
      date: initial?.date ?? new Date(),
      note: initial?.note ?? "",
    },
  });

  const onSubmit = (data: ExpenseInput) => {
    const fd = new FormData();
    fd.set("amount", String(data.amount));
    fd.set("categoryId", data.categoryId);
    fd.set("date", new Date(data.date).toISOString().slice(0, 10));
    if (data.note) fd.set("note", data.note);

    startTransition(async () => {
      try {
        if (expenseId) {
          await updateExpense(expenseId, fd);
          toast.success("Expense updated");
        } else {
          await createExpense(fd);
          toast.success("Expense added");
        }
        onDone?.();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="amount">Amount (USD)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          {...register("amount")}
          autoFocus
        />
        {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>}
      </div>

      <div>
        <Label htmlFor="categoryId">Category</Label>
        <Select
          value={watch("categoryId")}
          onValueChange={(v) => setValue("categoryId", v as string, { shouldValidate: true })}
        >
          <SelectTrigger id="categoryId"><SelectValue placeholder="Pick a category" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && <p className="text-sm text-destructive mt-1">{errors.categoryId.message}</p>}
      </div>

      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          defaultValue={format(initial?.date ?? new Date(), "yyyy-MM-dd")}
          {...register("date")}
        />
        {errors.date && <p className="text-sm text-destructive mt-1">{errors.date.message}</p>}
      </div>

      <div>
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" {...register("note")} maxLength={255} placeholder="What was it for?" />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {expenseId ? "Save changes" : "Add expense"}
      </Button>
    </form>
  );
}
