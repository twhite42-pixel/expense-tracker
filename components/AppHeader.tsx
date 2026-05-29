import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/expenses", label: "Expenses" },
  { href: "/categories", label: "Categories" },
  { href: "/settings", label: "Settings" },
];

export function AppHeader() {
  return (
    <header className="border-b sticky top-0 bg-background/80 backdrop-blur z-10">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            Expense Tracker
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-1.5 rounded-md hover:bg-muted hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton />
        </div>
      </div>
    </header>
  );
}
