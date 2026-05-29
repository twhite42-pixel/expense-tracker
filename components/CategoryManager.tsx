"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { CategoryPill } from "./CategoryPill";
import { createCategory, updateCategory, deleteCategory } from "@/actions/categories";
import { toast } from "sonner";

type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

export function CategoryManager({ initial }: { initial: Category[] }) {
  const [items] = useState(initial);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#10b981");
  const [icon, setIcon] = useState("tag");
  const [isPending, startTransition] = useTransition();

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set("name", name);
    fd.set("color", color);
    fd.set("icon", icon);
    startTransition(async () => {
      try {
        await createCategory(fd);
        toast.success("Category added");
        setName("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add");
      }
    });
  };

  const onDelete = (id: string) => {
    if (!confirm("Delete this category? Existing expenses will be moved to 'Other'.")) return;
    startTransition(async () => {
      try {
        await deleteCategory(id);
        toast.success("Category deleted");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Add category</h2>
        <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3 items-end">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} />
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <Input id="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-16 h-10 p-1" />
          </div>
          <div>
            <Label htmlFor="icon">Icon (Lucide name)</Label>
            <Input id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="tag" className="w-40" />
          </div>
          <Button type="submit" disabled={isPending}>Add</Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Your categories</h2>
        <ul className="divide-y">
          {items.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-3">
              <CategoryPill {...c} />
              <Button variant="ghost" size="icon" onClick={() => onDelete(c.id)} aria-label={`Delete ${c.name}`}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
