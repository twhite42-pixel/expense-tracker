import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { seedDefaultCategories } from "@/lib/seed-defaults";

export async function requireUser() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  await seedDefaultCategories(userId); // idempotent
  return userId;
}
