"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type Slice = { name: string; value: number; color: string };

export function CategoryDonut({ data }: { data: Slice[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-12">No data yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={90}
          strokeWidth={0}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) =>
            new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value))
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
