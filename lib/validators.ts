import { z } from "zod";

export const expenseSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Amount must be greater than zero")
    .max(99999999.99, "Amount too large"),
  categoryId: z.string().min(1, "Pick a category"),
  date: z.coerce.date(),
  note: z.string().max(255, "Keep notes under 255 characters").optional().nullable(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(40, "Name too long"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #10b981"),
  icon: z.string().min(1).max(40),
});

export type CategoryInput = z.infer<typeof categorySchema>;
