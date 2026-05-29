import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Show } from "@clerk/nextjs";
import { ArrowRight, Sparkles, ShieldCheck, LineChart } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <span className="font-semibold tracking-tight">Expense Tracker</span>
          <div className="flex items-center gap-2">
            <Show when="signed-out">
              <Link href="/sign-in"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link href="/sign-up"><Button size="sm">Get started</Button></Link>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard"><Button size="sm">Open app <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></Link>
            </Show>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-foreground">
          A clean, calm way to track <span className="text-emerald-600 dark:text-emerald-400">where your money goes</span>.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Log expenses, sort by category, see the picture. No ads, no upsells, no bank passwords — just you and your numbers.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Show when="signed-out">
            <Link href="/sign-up"><Button size="lg">Get started <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/sign-in"><Button size="lg" variant="ghost">Sign in</Button></Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard"><Button size="lg">Open dashboard <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </Show>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 grid md:grid-cols-3 gap-6">
        <Feature
          icon={<Sparkles className="h-5 w-5" />}
          title="Frictionless logging"
          body="Three taps, you're done. Amount, category, date. The rest is optional."
        />
        <Feature
          icon={<LineChart className="h-5 w-5" />}
          title="Honest summaries"
          body="Monthly total. Category breakdown. Daily trend. No vanity metrics."
        />
        <Feature
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Yours alone"
          body="Auth handled by Clerk. Data lives in your own row in Postgres."
        />
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-muted-foreground flex items-center justify-between">
          <span>© Torie White — MMXXVI</span>
          <a className="hover:text-foreground" href="https://github.com/twhite42-pixel/expense-tracker" target="_blank" rel="noopener noreferrer">Source on GitHub</a>
        </div>
      </footer>
    </main>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border p-6 bg-card">
      <div className="h-10 w-10 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">{icon}</div>
      <h3 className="mt-4 font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
