import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

function toPascal(s: string) {
  return s
    .split("-")
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("");
}

export function CategoryPill({
  name,
  color,
  icon,
}: {
  name: string;
  color: string;
  icon: string;
}) {
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[toPascal(icon)] ?? Icons.Tag;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <Icon className="h-3 w-3" />
      {name}
    </span>
  );
}
