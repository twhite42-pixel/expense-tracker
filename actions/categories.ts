"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { categorySchema } from "@/lib/validators";

const OTHER_DEFAULTS = { name: "Other", color: "#6b7280", icon: "more-horizontal" };

async function ensureOther(clerkUserId: string) {
  return (
    (await db.category.findFirst({ where: { clerkUserId, name: "Other" } })) ??
    db.category.create({ data: { ...OTHER_DEFAULTS, clerkUserId } })
  );
}

export async function createCategory(formData: FormData) {
  const userId = await requireUser();
  const parsed = categorySchema.parse({
    name: formData.get("name"),
    color: formData.get("color"),
    icon: formData.get("icon"),
  });

  await db.category.create({
    data: { ...parsed, clerkUserId: userId },
  });

  revalidatePath("/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  const userId = await requireUser();
  const existing = await db.category.findUnique({ where: { id } });
  if (!existing || existing.clerkUserId !== userId) throw new Error("Not found");

  const parsed = categorySchema.parse({
    name: formData.get("name"),
    color: formData.get("color"),
    icon: formData.get("icon"),
  });

  await db.category.update({ where: { id }, data: parsed });
  revalidatePath("/categories");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function deleteCategory(id: string) {
  const userId = await requireUser();
  const existing = await db.category.findUnique({ where: { id } });
  if (!existing || existing.clerkUserId !== userId) throw new Error("Not found");

  const other = await ensureOther(userId);
  if (other.id === id) throw new Error("Cannot delete the Other category");

  await db.$transaction([
    db.expense.updateMany({
      where: { clerkUserId: userId, categoryId: id },
      data: { categoryId: other.id },
    }),
    db.category.delete({ where: { id } }),
  ]);

  revalidatePath("/categories");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}
