import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CategoryManager } from "@/components/CategoryManager";

export default async function CategoriesPage() {
  const userId = await requireUser();
  const items = await db.category.findMany({
    where: { clerkUserId: userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true, icon: true },
  });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
      <CategoryManager initial={items} />
    </div>
  );
}
