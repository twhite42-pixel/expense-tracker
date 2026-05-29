"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Day = { date: string; total: number };

export function DailyBars({ data }: { data: Day[] }) {
  if (data.every((d) => d.total === 0)) {
    return <p className="text-sm text-muted-foreground text-center py-12">No data yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `$${v}`} />
        <Tooltip
          formatter={(value) =>
            new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value))
          }
        />
        <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
