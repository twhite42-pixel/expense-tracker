import { db } from "@/lib/db";

const DEFAULTS = [
  { name: "Food", color: "#f97316", icon: "utensils" },
  { name: "Transport", color: "#3b82f6", icon: "car" },
  { name: "Housing", color: "#8b5cf6", icon: "home" },
  { name: "Entertainment", color: "#ec4899", icon: "film" },
  { name: "Health", color: "#ef4444", icon: "heart-pulse" },
  { name: "Shopping", color: "#eab308", icon: "shopping-bag" },
  { name: "Other", color: "#6b7280", icon: "more-horizontal" },
];

export async function seedDefaultCategories(clerkUserId: string) {
  const existing = await db.category.findFirst({ where: { clerkUserId } });
  if (existing) return;

  await db.category.createMany({
    data: DEFAULTS.map((d) => ({ ...d, clerkUserId })),
    skipDuplicates: true,
  });
}
