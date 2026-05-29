import { startOfMonth, endOfMonth, subDays, startOfDay } from "date-fns";

export function currentMonthRange(now = new Date()) {
  return { from: startOfMonth(now), to: endOfMonth(now) };
}

export function last30DaysRange(now = new Date()) {
  return { from: startOfDay(subDays(now, 29)), to: now };
}

export function formatCurrency(amount: number | string) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}
