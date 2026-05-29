"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Category = { id: string; name: string };

export function ExpenseFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const sp = useSearchParams();

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(sp);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/expenses?${next.toString()}`);
  };

  const reset = () => router.replace("/expenses");

  return (
    <div className="flex flex-wrap items-end gap-3 border-b pb-4">
      <div>
        <Label htmlFor="from">From</Label>
        <Input id="from" type="date" defaultValue={sp.get("from") ?? ""} onBlur={(e) => update("from", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="to">To</Label>
        <Input id="to" type="date" defaultValue={sp.get("to") ?? ""} onBlur={(e) => update("to", e.target.value)} />
      </div>
      <div>
        <Label>Category</Label>
        <Select value={sp.get("category") ?? "all"} onValueChange={(v) => update("category", (v as string) === "all" ? "" : (v as string))}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="q">Search notes</Label>
        <Input id="q" defaultValue={sp.get("q") ?? ""} onBlur={(e) => update("q", e.target.value)} className="w-56" />
      </div>
      <Button variant="ghost" onClick={reset}>Reset</Button>
    </div>
  );
}
