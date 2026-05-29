"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { expenseSchema } from "@/lib/validators";

export async function createExpense(formData: FormData) {
  const userId = await requireUser();
  const parsed = expenseSchema.parse({
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId"),
    date: formData.get("date"),
    note: formData.get("note") || null,
  });

  await db.expense.create({
    data: {
      clerkUserId: userId,
      categoryId: parsed.categoryId,
      amount: parsed.amount,
      date: parsed.date,
      note: parsed.note,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
}

export async function updateExpense(id: string, formData: FormData) {
  const userId = await requireUser();
  const parsed = expenseSchema.parse({
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId"),
    date: formData.get("date"),
    note: formData.get("note") || null,
  });

  const existing = await db.expense.findUnique({ where: { id } });
  if (!existing || existing.clerkUserId !== userId) {
    throw new Error("Not found");
  }

  await db.expense.update({
    where: { id },
    data: {
      categoryId: parsed.categoryId,
      amount: parsed.amount,
      date: parsed.date,
      note: parsed.note,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath(`/expenses/${id}`);
}

export async function deleteExpense(id: string) {
  const userId = await requireUser();
  const existing = await db.expense.findUnique({ where: { id } });
  if (!existing || existing.clerkUserId !== userId) {
    throw new Error("Not found");
  }
  await db.expense.delete({ where: { id } });
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
}
