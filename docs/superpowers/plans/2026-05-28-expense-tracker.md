# Expense Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a multi-user expense-tracking SaaS at `~/Documents/expense-tracker` — Next.js 15 frontend + server actions, Clerk auth, Neon Postgres via Prisma, deployed to Vercel.

**Architecture:** Single Next.js App Router application. Server components do reads, server actions do writes, no separate API. Clerk middleware gates authenticated routes. A `user.created` webhook seeds default categories per user. UI built from shadcn/ui primitives. Charts from Recharts.

**Tech Stack:** Next.js 15 · TypeScript · Tailwind v4 · shadcn/ui · Clerk · Neon Postgres · Prisma · Recharts · React Hook Form · Zod · Lucide · date-fns · next-themes · pnpm.

**Visual verification:** This is a real-time multi-user app. There are no automated unit tests in v1 (per the spec). Each task ends with manual verification in the running dev server (http://localhost:3000) and a git commit. TypeScript and the production build are the safety net — they must stay green.

**Working directory:** `/Users/toriewhite/Documents/expense-tracker`. The folder currently contains only the `docs/` directory with the spec inside it. The Next.js scaffold lands in Task 1.

**User actions outside the editor:** Three external services need accounts. The plan flags these clearly so the implementer (or Torie) can do them at the right moment:
- **Clerk** account + app (Task 4) — gives `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`.
- **Neon** account + database (Task 6) — gives `DATABASE_URL` and `DIRECT_URL`.
- **Vercel** account + project (Task 17) — connects the GitHub repo and ingests env vars.

All three have free tiers; no card required for v1.

---

## File Structure

| File | Status after plan | Responsibility |
|---|---|---|
| `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs` | scaffolded | Standard Next.js + TS config. |
| `tailwind.config.ts`, `app/globals.css` | scaffolded + tuned | Tailwind v4 + theme tokens. |
| `components.json` | new | shadcn/ui config. |
| `middleware.ts` | new | Clerk auth gate for `/dashboard`, `/expenses`, `/categories`, `/settings`. |
| `app/layout.tsx` | new | Root layout — `ClerkProvider`, `ThemeProvider`, fonts, metadata. |
| `app/page.tsx` | new | Marketing landing page. |
| `app/sign-in/[[...sign-in]]/page.tsx` | new | Clerk sign-in mount. |
| `app/sign-up/[[...sign-up]]/page.tsx` | new | Clerk sign-up mount. |
| `app/(app)/layout.tsx` | new | Authenticated app shell — header with `UserButton`, nav, theme toggle. |
| `app/(app)/dashboard/page.tsx` | new | Dashboard — month total, charts, recent expenses. |
| `app/(app)/expenses/page.tsx` | new | Expense list with filters. |
| `app/(app)/expenses/[id]/page.tsx` | new | View / edit / delete one expense. |
| `app/(app)/categories/page.tsx` | new | Category CRUD. |
| `app/(app)/settings/page.tsx` | new | Clerk `<UserProfile />` + theme toggle. |
| `app/api/webhooks/clerk/route.ts` | new | `user.created` → seed default categories. |
| `lib/db.ts` | new | Prisma client singleton. |
| `lib/auth.ts` | new | `requireUser()` helper. |
| `lib/validators.ts` | new | Zod schemas for `Expense` and `Category`. |
| `lib/dates.ts` | new | Date range helpers (current month, last 30 days). |
| `lib/seed-defaults.ts` | new | Default-category seeding logic. |
| `actions/expenses.ts` | new | Server actions: create, update, delete expense. |
| `actions/categories.ts` | new | Server actions: create, rename, recolor, delete category. |
| `components/ExpenseForm.tsx` | new | Shared form for create + edit. |
| `components/ExpenseTable.tsx` | new | List rendering with sorting / responsive collapse. |
| `components/ExpenseFilters.tsx` | new | Date / category / search filter bar. |
| `components/CategoryPill.tsx` | new | Colored chip showing a category. |
| `components/CategoryManager.tsx` | new | Inline add / edit / delete UI for categories. |
| `components/charts/CategoryDonut.tsx` | new | Recharts donut — spending by category this month. |
| `components/charts/DailyBars.tsx` | new | Recharts bar chart — last 30 days. |
| `components/AppHeader.tsx` | new | Header with logo, nav, `UserButton`, theme toggle. |
| `components/ThemeToggle.tsx` | new | Light/dark toggle button. |
| `components/Providers.tsx` | new | `next-themes` provider wrapper. |
| `components/EmptyState.tsx` | new | Reusable empty-state placeholder. |
| `components/ui/*` | new (via shadcn CLI) | Button, Card, Dialog, Input, Select, Label, Table, DropdownMenu, Toast, etc. |
| `prisma/schema.prisma` | new | Datasource + Category + Expense models. |
| `prisma/seed.ts` | new | (optional dev helper for local seeding). |
| `.env.example` | new | Env var placeholders + comments. |
| `.env.local` | new (gitignored) | Real env values for local dev. |
| `.gitignore` | scaffolded + extended | Standard Next.js ignore + `.env.local`. |
| `README.md` | rewritten | Stack, setup, deploy, screenshots. |
| `.github/workflows/...` | not needed | Vercel handles CI/CD; no GitHub Actions in v1. |

---

## Task 1: Scaffold Next.js + initial commit

**Files:**
- Create: project scaffold under `/Users/toriewhite/Documents/expense-tracker/`

- [ ] **Step 1: Scaffold**

```bash
cd /Users/toriewhite/Documents && pnpm create next-app@latest expense-tracker --typescript --tailwind --eslint --app --src-dir=false --import-alias='@/*' --turbopack --use-pnpm
```

If `pnpm` is not installed: run `corepack enable && corepack prepare pnpm@latest --activate` first.

When the wizard runs, accept all defaults shown above. If it prompts to overwrite the existing folder, choose **No** and instead run the scaffold inside an empty `tmp/` subfolder and then move files up — but normally with only `docs/` present it accepts the folder fine.

- [ ] **Step 2: Verify dev server starts**

```bash
cd /Users/toriewhite/Documents/expense-tracker && pnpm dev
```

Expected: `Ready in <Xms>` and `Local: http://localhost:3000`. Open the URL — default Next.js welcome page renders. Kill the server with Ctrl-C.

- [ ] **Step 3: Initialize git and commit**

The Next.js scaffold creates its own git repo. Verify and add the spec:

```bash
cd /Users/toriewhite/Documents/expense-tracker && git log --oneline 2>&1 | head -3
```

If git isn't initialized, run `git init -b main`. Then:

```bash
cd /Users/toriewhite/Documents/expense-tracker && git config user.name "twhite42-pixel" && git config user.email "twhite42@leomail.tamuc.edu" && git add -A && git commit -m "chore: scaffold Next.js project with design spec"
```

- [ ] **Step 4: Push to GitHub**

```bash
cd /Users/toriewhite/Documents/expense-tracker && gh repo create twhite42-pixel/expense-tracker --public --description "Multi-user expense tracker — Next.js, Clerk, Neon, Prisma" --source=. --remote=origin --push
```

Expected: `Created repository twhite42-pixel/expense-tracker on github.com` and `branch 'main' set up to track 'origin/main'`.

---

## Task 2: Add core dependencies

**Files:**
- Modify: `package.json` (via pnpm add)

- [ ] **Step 1: Add runtime dependencies**

```bash
cd /Users/toriewhite/Documents/expense-tracker && pnpm add @clerk/nextjs @prisma/client recharts react-hook-form @hookform/resolvers zod date-fns lucide-react next-themes svix decimal.js class-variance-authority clsx tailwind-merge
```

- [ ] **Step 2: Add dev dependencies**

```bash
cd /Users/toriewhite/Documents/expense-tracker && pnpm add -D prisma tsx
```

- [ ] **Step 3: Verify build still works**

```bash
cd /Users/toriewhite/Documents/expense-tracker && pnpm build 2>&1 | tail -10
```

Expected: build completes successfully (default scaffolded `app/page.tsx`).

- [ ] **Step 4: Commit**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git add package.json pnpm-lock.yaml && git commit -m "chore: add core dependencies"
```

---

## Task 3: Initialize shadcn/ui

**Files:**
- Create: `components.json`
- Create: `components/ui/button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`, `label.tsx`, `select.tsx`, `table.tsx`, `dropdown-menu.tsx`, `sonner.tsx`, `form.tsx`
- Create: `lib/utils.ts` (created by shadcn CLI)

- [ ] **Step 1: Run init**

```bash
cd /Users/toriewhite/Documents/expense-tracker && pnpm dlx shadcn@latest init
```

When prompted:
- Style: `New York`
- Base color: `Neutral`
- CSS variables: `Yes`

This writes `components.json`, updates `app/globals.css`, and creates `lib/utils.ts`.

- [ ] **Step 2: Add the primitives we'll need**

```bash
cd /Users/toriewhite/Documents/expense-tracker && pnpm dlx shadcn@latest add button card dialog input label select table dropdown-menu sonner form popover calendar
```

This creates files under `components/ui/`.

- [ ] **Step 3: Verify build**

```bash
cd /Users/toriewhite/Documents/expense-tracker && pnpm build 2>&1 | tail -10
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git add -A && git commit -m "chore: init shadcn/ui with core primitives"
```

---

## Task 4: USER ACTION — Set up Clerk

This task is mostly external work. The implementer's job is to relay instructions and verify the result.

- [ ] **Step 1: Direct Torie to create the Clerk app**

She needs to:
1. Sign up at https://clerk.com (Google sign-in is fastest).
2. Click "Create application" — name it `expense-tracker`.
3. Enable sign-in methods: **Email** and **Google** (sufficient for v1).
4. Skip the framework-specific quickstart — we have our own setup below.
5. Open the **API Keys** section and copy:
   - `Publishable key` (starts with `pk_test_`)
   - `Secret key` (starts with `sk_test_`)

- [ ] **Step 2: Write `.env.local`**

In the project root, create `.env.local` with:

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<paste-from-clerk>
CLERK_SECRET_KEY=<paste-from-clerk>
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# Database — filled in Task 6
DATABASE_URL=
DIRECT_URL=

# Clerk webhook — filled in Task 12
CLERK_WEBHOOK_SECRET=
```

- [ ] **Step 3: Write `.env.example`** (the committed template)

```
# Get Clerk keys at https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# Get Neon connection strings at https://console.neon.tech
# DATABASE_URL is the POOLED connection (for app queries)
# DIRECT_URL is the DIRECT connection (for Prisma migrations)
DATABASE_URL=postgresql://user:password@host/db?sslmode=require&pgbouncer=true
DIRECT_URL=postgresql://user:password@host/db?sslmode=require

# Clerk webhook secret — generated when you add the webhook endpoint in Clerk dashboard
CLERK_WEBHOOK_SECRET=whsec_xxx
```

- [ ] **Step 4: Verify `.env.local` is gitignored**

```bash
cd /Users/toriewhite/Documents/expense-tracker && grep -E "^\.env" .gitignore
```

The default Next.js `.gitignore` already includes `.env*` patterns. If `.env.local` is not covered, add `.env*.local` to `.gitignore`.

- [ ] **Step 5: Commit the example**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git add .env.example .gitignore && git commit -m "chore: add .env.example with Clerk and Neon placeholders"
```

---

## Task 5: Wire Clerk middleware + provider

**Files:**
- Create: `middleware.ts`
- Modify: `app/layout.tsx`
- Create: `app/sign-in/[[...sign-in]]/page.tsx`
- Create: `app/sign-up/[[...sign-up]]/page.tsx`

- [ ] **Step 1: Create `middleware.ts` at the project root**

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/expenses(.*)",
  "/categories(.*)",
  "/settings(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- [ ] **Step 2: Replace `app/layout.tsx`**

The scaffolded file looks like the default Next.js one. Replace with:

```tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Expense Tracker — by Torie White",
  description: "A simple multi-user expense tracker.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <body className="min-h-screen bg-background font-sans antialiased">
          <Providers>{children}</Providers>
          <Toaster richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
```

The `geist` font package is not yet installed — add it:

```bash
cd /Users/toriewhite/Documents/expense-tracker && pnpm add geist
```

- [ ] **Step 3: Create `components/Providers.tsx`**

```tsx
"use client";

import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
```

- [ ] **Step 4: Create `app/sign-in/[[...sign-in]]/page.tsx`**

```tsx
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <SignIn />
    </div>
  );
}
```

- [ ] **Step 5: Create `app/sign-up/[[...sign-up]]/page.tsx`**

```tsx
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <SignUp />
    </div>
  );
}
```

- [ ] **Step 6: Verify**

```bash
cd /Users/toriewhite/Documents/expense-tracker && pnpm dev
```

In the browser:
- `/` still shows the default Next.js page (no protection).
- `/sign-in` shows the Clerk sign-in widget.
- `/sign-up` shows the Clerk sign-up widget.
- `/dashboard` redirects to `/sign-in?redirect_url=...`.

Sign up with a test account. After sign-up, Clerk redirects to `/dashboard` which 404s (no page yet) — that's expected, we build it in Task 9.

- [ ] **Step 7: Commit**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git add -A && git commit -m "feat(auth): wire Clerk middleware, provider, and sign-in/up pages"
```

---

## Task 6: USER ACTION — Set up Neon and Prisma

- [ ] **Step 1: Direct Torie to create the Neon database**

She needs to:
1. Sign up at https://neon.tech (GitHub sign-in is fine).
2. Create a project — name it `expense-tracker`.
3. Region: closest to her (US East / US West).
4. From the dashboard, copy two connection strings:
   - **Pooled** connection — goes in `DATABASE_URL`. Includes `?sslmode=require&pgbouncer=true`.
   - **Direct** connection — goes in `DIRECT_URL`. Includes `?sslmode=require` (no `pgbouncer=true`).

Paste both into `.env.local`.

- [ ] **Step 2: Initialize Prisma**

```bash
cd /Users/toriewhite/Documents/expense-tracker && pnpm dlx prisma init --datasource-provider postgresql
```

This creates `prisma/schema.prisma` and adds `DATABASE_URL` to `.env`. We don't want Prisma's auto-generated `.env`; the env values are in `.env.local`. Delete the auto-created `.env`:

```bash
cd /Users/toriewhite/Documents/expense-tracker && rm -f .env
```

- [ ] **Step 3: Replace `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Category {
  id          String    @id @default(cuid())
  clerkUserId String
  name        String
  color       String
  icon        String
  createdAt   DateTime  @default(now())
  expenses    Expense[]

  @@unique([clerkUserId, name])
  @@index([clerkUserId])
}

model Expense {
  id          String   @id @default(cuid())
  clerkUserId String
  categoryId  String
  amount      Decimal  @db.Decimal(10, 2)
  date        DateTime @db.Date
  note        String?  @db.VarChar(255)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  category    Category @relation(fields: [categoryId], references: [id])

  @@index([clerkUserId])
  @@index([clerkUserId, date])
  @@index([categoryId])
}
```

- [ ] **Step 4: Make the env file load Prisma**

The Next.js dev server reads `.env.local` automatically, but Prisma CLI does not — it reads `.env`. Add an `--env-file` pattern: edit `package.json` and add these scripts under `"scripts"`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "dotenv -e .env.local -- prisma db push",
    "db:migrate": "dotenv -e .env.local -- prisma migrate dev",
    "db:studio": "dotenv -e .env.local -- prisma studio"
  }
}
```

Install dotenv-cli:

```bash
cd /Users/toriewhite/Documents/expense-tracker && pnpm add -D dotenv-cli
```

- [ ] **Step 5: Push schema to Neon**

```bash
cd /Users/toriewhite/Documents/expense-tracker && pnpm db:push
```

Expected: `Your database is now in sync with your Prisma schema.`

If you get a connection error: re-check `DATABASE_URL` and `DIRECT_URL` in `.env.local`. The pooled URL must end with `&pgbouncer=true` AND `&connect_timeout=10` for serverless.

- [ ] **Step 6: Create `lib/db.ts`**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- [ ] **Step 7: Create `lib/auth.ts`**

```ts
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function requireUser() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}
```

- [ ] **Step 8: Verify build**

```bash
cd /Users/toriewhite/Documents/expense-tracker && pnpm build 2>&1 | tail -10
```

Expected: build succeeds. `prisma generate` runs as part of `build`.

- [ ] **Step 9: Commit**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git add -A && git commit -m "feat(db): add Prisma schema, db client, auth helper"
```

---

## Task 7: Default category seeder helper

**Files:**
- Create: `lib/seed-defaults.ts`

- [ ] **Step 1: Write `lib/seed-defaults.ts`**

```ts
import { db } from "@/lib/db";

const DEFAULTS = [
  { name: "Food", color: "#f97316", icon: "utensils" },
  { name: "Transport", color: "#3b82f6", icon: "car" },
  { name: "Housing", color: "#8b5cf6", icon: "home" },
  { name: "Entertainment", color: "#ec4899", icon: "film" },
  { name: "Health", color: "#ef4444", icon: "heart-pulse" },
  { name: "Shopping", color: "#eab308", icon: "shopping-bag" },
  { name: "Other", color: "#6b7280", icon: "more-horizontal" },
];

export async function seedDefaultCategories(clerkUserId: string) {
  const existing = await db.category.findFirst({ where: { clerkUserId } });
  if (existing) return;

  await db.category.createMany({
    data: DEFAULTS.map((d) => ({ ...d, clerkUserId })),
    skipDuplicates: true,
  });
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git add lib/seed-defaults.ts && git commit -m "feat(db): default-category seeder"
```

---

## Task 8: Zod schemas

**Files:**
- Create: `lib/validators.ts`

- [ ] **Step 1: Write `lib/validators.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git add lib/validators.ts && git commit -m "feat: Zod schemas for Expense and Category"
```

---

## Task 9: Date helpers

**Files:**
- Create: `lib/dates.ts`

- [ ] **Step 1: Write `lib/dates.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git add lib/dates.ts && git commit -m "feat: date range and currency helpers"
```

---

## Task 10: Landing page

**Files:**
- Modify (full rewrite): `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight, Sparkles, ShieldCheck, LineChart } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <span className="font-semibold tracking-tight">Expense Tracker</span>
          <div className="flex items-center gap-2">
            <SignedOut>
              <Link href="/sign-in"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link href="/sign-up"><Button size="sm">Get started</Button></Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard"><Button size="sm">Open app <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></Link>
            </SignedIn>
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
          <SignedOut>
            <Link href="/sign-up"><Button size="lg">Get started <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/sign-in"><Button size="lg" variant="ghost">Sign in</Button></Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard"><Button size="lg">Open dashboard <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </SignedIn>
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
```

- [ ] **Step 2: Verify**

`pnpm dev`, open http://localhost:3000/. The landing page renders. Signed-out users see "Sign in" / "Get started"; signed-in users see "Open dashboard". Sign in via Clerk and confirm the button changes.

- [ ] **Step 3: Commit**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git add app/page.tsx && git commit -m "feat: landing page"
```

---

## Task 11: App shell — header + theme toggle + authenticated layout

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `components/AppHeader.tsx`
- Create: `components/ThemeToggle.tsx`

- [ ] **Step 1: Create `components/ThemeToggle.tsx`**

```tsx
"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
```

- [ ] **Step 2: Create `components/AppHeader.tsx`**

```tsx
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
```

- [ ] **Step 3: Create `app/(app)/layout.tsx`**

```tsx
import { AppHeader } from "@/components/AppHeader";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

`pnpm dev`. Sign in, navigate to `/dashboard` — gets a 404 (no page yet) but the header renders above. Theme toggle works. UserButton menu opens.

- [ ] **Step 5: Commit**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git add -A && git commit -m "feat(shell): app layout with header, nav, theme toggle"
```

---

## Task 12: Clerk webhook for default-category seeding

**Files:**
- Create: `app/api/webhooks/clerk/route.ts`

- [ ] **Step 1: Tell Torie to set up the webhook in Clerk**

In the Clerk dashboard:
1. Sidebar → **Webhooks** → **+ Add Endpoint**.
2. URL: for local dev use `https://<your-ngrok-or-cloudflared>.ngrok.app/api/webhooks/clerk`. For now, leave URL placeholder — we'll set the real Vercel URL in Task 17 after deploy. Use ngrok locally if you want to test it before deploy.
3. Subscribe to **`user.created`** only.
4. Copy the **Signing Secret** (starts with `whsec_`) into `.env.local` as `CLERK_WEBHOOK_SECRET`.

For local dev: install ngrok (`brew install ngrok` then `ngrok config add-authtoken <token>`) and run `ngrok http 3000` to get a tunnel URL. Optional — fine to defer all webhook testing until after Vercel deploy.

- [ ] **Step 2: Write `app/api/webhooks/clerk/route.ts`**

```ts
import { Webhook } from "svix";
import { headers } from "next/headers";
import { seedDefaultCategories } from "@/lib/seed-defaults";

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(secret);

  let evt: { type: string; data: { id: string } };
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: { id: string } };
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Bad signature", { status: 400 });
  }

  if (evt.type === "user.created") {
    await seedDefaultCategories(evt.data.id);
  }

  return new Response("ok", { status: 200 });
}
```

- [ ] **Step 3: Add a fallback "seed on first read"**

The webhook may not fire in local dev (no public URL). Add a defensive seed inside `requireUser()` so the dashboard always works. Edit `lib/auth.ts`:

```ts
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { seedDefaultCategories } from "@/lib/seed-defaults";

export async function requireUser() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  await seedDefaultCategories(userId); // idempotent
  return userId;
}
```

`seedDefaultCategories` already short-circuits if any category exists for the user, so this costs one DB query per protected page load — acceptable for v1.

- [ ] **Step 4: Verify**

`pnpm dev`. Sign in with a fresh Clerk account (delete the old test user in Clerk dashboard first if you reused it). Navigate to `/dashboard` (still 404s on the page itself, but the layout runs `requireUser` → which seeds categories). Open Prisma Studio (`pnpm db:studio`) and confirm 7 categories exist for your user.

- [ ] **Step 5: Commit**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git add -A && git commit -m "feat(webhook): Clerk user.created handler + defensive seed"
```

---

## Task 13: Server actions — expenses

**Files:**
- Create: `actions/expenses.ts`

- [ ] **Step 1: Write `actions/expenses.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { expenseSchema } from "@/lib/validators";

export async function createExpense(formData: FormData) {
  const userId = await requireUser();
  const parsed = expenseSchema.parse({
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId"),
    date: formData.get("date"),
    note: formData.get("note") || null,
  });

  await db.expense.create({
    data: {
      clerkUserId: userId,
      categoryId: parsed.categoryId,
      amount: parsed.amount,
      date: parsed.date,
      note: parsed.note,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
}

export async function updateExpense(id: string, formData: FormData) {
  const userId = await requireUser();
  const parsed = expenseSchema.parse({
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId"),
    date: formData.get("date"),
    note: formData.get("note") || null,
  });

  const existing = await db.expense.findUnique({ where: { id } });
  if (!existing || existing.clerkUserId !== userId) {
    throw new Error("Not found");
  }

  await db.expense.update({
    where: { id },
    data: {
      categoryId: parsed.categoryId,
      amount: parsed.amount,
      date: parsed.date,
      note: parsed.note,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath(`/expenses/${id}`);
}

export async function deleteExpense(id: string) {
  const userId = await requireUser();
  const existing = await db.expense.findUnique({ where: { id } });
  if (!existing || existing.clerkUserId !== userId) {
    throw new Error("Not found");
  }
  await db.expense.delete({ where: { id } });
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git add actions/expenses.ts && git commit -m "feat(actions): create / update / delete expense"
```

---

## Task 14: Server actions — categories

**Files:**
- Create: `actions/categories.ts`

- [ ] **Step 1: Write `actions/categories.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { categorySchema } from "@/lib/validators";

const OTHER_DEFAULTS = { name: "Other", color: "#6b7280", icon: "more-horizontal" };

async function ensureOther(clerkUserId: string) {
  return (
    (await db.category.findFirst({ where: { clerkUserId, name: "Other" } })) ??
    db.category.create({ data: { ...OTHER_DEFAULTS, clerkUserId } })
  );
}

export async function createCategory(formData: FormData) {
  const userId = await requireUser();
  const parsed = categorySchema.parse({
    name: formData.get("name"),
    color: formData.get("color"),
    icon: formData.get("icon"),
  });

  await db.category.create({
    data: { ...parsed, clerkUserId: userId },
  });

  revalidatePath("/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  const userId = await requireUser();
  const existing = await db.category.findUnique({ where: { id } });
  if (!existing || existing.clerkUserId !== userId) throw new Error("Not found");

  const parsed = categorySchema.parse({
    name: formData.get("name"),
    color: formData.get("color"),
    icon: formData.get("icon"),
  });

  await db.category.update({ where: { id }, data: parsed });
  revalidatePath("/categories");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function deleteCategory(id: string) {
  const userId = await requireUser();
  const existing = await db.category.findUnique({ where: { id } });
  if (!existing || existing.clerkUserId !== userId) throw new Error("Not found");

  const other = await ensureOther(userId);
  if (other.id === id) throw new Error("Cannot delete the Other category");

  await db.$transaction([
    db.expense.updateMany({
      where: { clerkUserId: userId, categoryId: id },
      data: { categoryId: other.id },
    }),
    db.category.delete({ where: { id } }),
  ]);

  revalidatePath("/categories");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git add actions/categories.ts && git commit -m "feat(actions): create / update / delete category with safe deletion"
```

---

## Task 15: Categories management page

**Files:**
- Create: `app/(app)/categories/page.tsx`
- Create: `components/CategoryManager.tsx`
- Create: `components/CategoryPill.tsx`

- [ ] **Step 1: Write `components/CategoryPill.tsx`**

```tsx
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
```

- [ ] **Step 2: Write `components/CategoryManager.tsx`** (client component)

```tsx
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
```

- [ ] **Step 3: Write `app/(app)/categories/page.tsx`**

```tsx
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CategoryManager } from "@/components/CategoryManager";

export default async function CategoriesPage() {
  const userId = await requireUser();
  const items = await db.category.findMany({
    where: { clerkUserId: userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true, icon: true },
  });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
      <CategoryManager initial={items} />
    </div>
  );
}
```

- [ ] **Step 4: Verify**

`pnpm dev` → `/categories`. The 7 default categories appear. Add a new one (e.g., "Coffee", color `#92400e`, icon `coffee`) — it appears in the list. Delete a non-Other category — confirmation prompt → it disappears. Toasts show success.

- [ ] **Step 5: Commit**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git add -A && git commit -m "feat(categories): management page with add and delete"
```

---

## Task 16: Expense form + list + new + edit pages

This task is larger — it covers the form component used by both new and edit, plus the list page and the per-expense view/edit page. Sub-steps are smaller.

**Files:**
- Create: `components/ExpenseForm.tsx`
- Create: `components/ExpenseFilters.tsx`
- Create: `components/ExpenseTable.tsx`
- Create: `app/(app)/expenses/page.tsx`
- Create: `app/(app)/expenses/[id]/page.tsx`

- [ ] **Step 1: `components/ExpenseForm.tsx`** (client, shared between new + edit)

```tsx
"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { expenseSchema, type ExpenseInput } from "@/lib/validators";
import { createExpense, updateExpense } from "@/actions/expenses";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

type Category = { id: string; name: string };

export function ExpenseForm({
  categories,
  initial,
  expenseId,
  onDone,
}: {
  categories: Category[];
  initial?: Partial<ExpenseInput> & { id?: string };
  expenseId?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: initial?.amount ?? 0,
      categoryId: initial?.categoryId ?? categories[0]?.id,
      date: initial?.date ?? new Date(),
      note: initial?.note ?? "",
    },
  });

  const onSubmit = (data: ExpenseInput) => {
    const fd = new FormData();
    fd.set("amount", String(data.amount));
    fd.set("categoryId", data.categoryId);
    fd.set("date", new Date(data.date).toISOString().slice(0, 10));
    if (data.note) fd.set("note", data.note);

    startTransition(async () => {
      try {
        if (expenseId) {
          await updateExpense(expenseId, fd);
          toast.success("Expense updated");
        } else {
          await createExpense(fd);
          toast.success("Expense added");
        }
        onDone?.();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="amount">Amount (USD)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          {...register("amount")}
          autoFocus
        />
        {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>}
      </div>

      <div>
        <Label htmlFor="categoryId">Category</Label>
        <Select
          value={watch("categoryId")}
          onValueChange={(v) => setValue("categoryId", v, { shouldValidate: true })}
        >
          <SelectTrigger id="categoryId"><SelectValue placeholder="Pick a category" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && <p className="text-sm text-destructive mt-1">{errors.categoryId.message}</p>}
      </div>

      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          defaultValue={format(initial?.date ?? new Date(), "yyyy-MM-dd")}
          {...register("date")}
        />
        {errors.date && <p className="text-sm text-destructive mt-1">{errors.date.message}</p>}
      </div>

      <div>
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" {...register("note")} maxLength={255} placeholder="What was it for?" />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {expenseId ? "Save changes" : "Add expense"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: `components/ExpenseFilters.tsx`** (client, URL-driven)

```tsx
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
        <Select value={sp.get("category") ?? "all"} onValueChange={(v) => update("category", v === "all" ? "" : v)}>
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
```

- [ ] **Step 3: `components/ExpenseTable.tsx`** (server-rendered)

```tsx
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoryPill } from "./CategoryPill";
import { formatCurrency } from "@/lib/dates";
import { format } from "date-fns";

type Row = {
  id: string;
  amount: string;
  date: Date;
  note: string | null;
  category: { name: string; color: string; icon: string };
};

export function ExpenseTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        No expenses match these filters.
      </p>
    );
  }
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} className="hover:bg-muted/50">
              <TableCell className="font-mono text-sm">
                <Link href={`/expenses/${r.id}`} className="hover:underline">
                  {format(r.date, "MMM d, yyyy")}
                </Link>
              </TableCell>
              <TableCell><CategoryPill {...r.category} /></TableCell>
              <TableCell className="text-muted-foreground truncate max-w-[24ch]">{r.note ?? "—"}</TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(r.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 4: `app/(app)/expenses/page.tsx`** (list + filters + add modal)

```tsx
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ExpenseFilters } from "@/components/ExpenseFilters";
import { ExpenseTable } from "@/components/ExpenseTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/ExpenseForm";
import { Plus } from "lucide-react";

type SP = { from?: string; to?: string; category?: string; q?: string };

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const userId = await requireUser();
  const sp = await searchParams;

  const where: Record<string, unknown> = { clerkUserId: userId };
  if (sp.from || sp.to) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (sp.from) dateFilter.gte = new Date(sp.from);
    if (sp.to) dateFilter.lte = new Date(sp.to);
    where.date = dateFilter;
  }
  if (sp.category) where.categoryId = sp.category;
  if (sp.q) where.note = { contains: sp.q, mode: "insensitive" };

  const [rows, categories] = await Promise.all([
    db.expense.findMany({
      where,
      orderBy: { date: "desc" },
      include: { category: { select: { name: true, color: true, icon: true } } },
    }),
    db.category.findMany({
      where: { clerkUserId: userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const tableRows = rows.map((r) => ({
    id: r.id,
    amount: r.amount.toString(),
    date: r.date,
    note: r.note,
    category: r.category,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Add expense</DialogTitle>
            <ExpenseForm categories={categories} />
          </DialogContent>
        </Dialog>
      </div>
      <ExpenseFilters categories={categories} />
      <ExpenseTable rows={tableRows} />
    </div>
  );
}
```

- [ ] **Step 5: `app/(app)/expenses/[id]/page.tsx`** (view / edit / delete)

```tsx
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ExpenseForm } from "@/components/ExpenseForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteExpense } from "@/actions/expenses";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  const { id } = await params;

  const [expense, categories] = await Promise.all([
    db.expense.findUnique({ where: { id } }),
    db.category.findMany({
      where: { clerkUserId: userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!expense || expense.clerkUserId !== userId) notFound();

  async function handleDelete() {
    "use server";
    await deleteExpense(id);
    redirect("/expenses");
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit expense</h1>
      <Card className="p-6">
        <ExpenseForm
          categories={categories}
          expenseId={expense.id}
          initial={{
            amount: Number(expense.amount.toString()),
            categoryId: expense.categoryId,
            date: expense.date,
            note: expense.note,
          }}
        />
      </Card>
      <form action={handleDelete}>
        <Button type="submit" variant="destructive" className="w-full">Delete expense</Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Verify**

`pnpm dev` → `/expenses`. Click "New expense", fill the form, submit. Row appears in the table. Click the date — opens the edit page. Edit the amount, save — list updates. Delete — back to list, row gone. Filter by date range — list narrows.

- [ ] **Step 7: Commit**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git add -A && git commit -m "feat(expenses): list, filters, new dialog, edit page"
```

---

## Task 17: Dashboard with charts

**Files:**
- Create: `components/charts/CategoryDonut.tsx`
- Create: `components/charts/DailyBars.tsx`
- Create: `app/(app)/dashboard/page.tsx`

- [ ] **Step 1: `components/charts/CategoryDonut.tsx`**

```tsx
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
          formatter={(value: number) =>
            new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: `components/charts/DailyBars.tsx`**

```tsx
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
          formatter={(value: number) =>
            new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
          }
        />
        <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 3: `app/(app)/dashboard/page.tsx`**

```tsx
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/ExpenseForm";
import { CategoryDonut } from "@/components/charts/CategoryDonut";
import { DailyBars } from "@/components/charts/DailyBars";
import { CategoryPill } from "@/components/CategoryPill";
import { currentMonthRange, last30DaysRange, formatCurrency } from "@/lib/dates";
import { format, eachDayOfInterval } from "date-fns";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const userId = await requireUser();
  const monthRange = currentMonthRange();
  const thirtyRange = last30DaysRange();

  const [monthExpenses, recent, categories] = await Promise.all([
    db.expense.findMany({
      where: {
        clerkUserId: userId,
        date: { gte: monthRange.from, lte: monthRange.to },
      },
      include: { category: { select: { name: true, color: true, icon: true } } },
    }),
    db.expense.findMany({
      where: { clerkUserId: userId },
      orderBy: { date: "desc" },
      take: 5,
      include: { category: { select: { name: true, color: true, icon: true } } },
    }),
    db.category.findMany({
      where: { clerkUserId: userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const monthTotal = monthExpenses.reduce((acc, e) => acc + Number(e.amount), 0);

  // Donut data
  const byCat = new Map<string, { value: number; color: string }>();
  for (const e of monthExpenses) {
    const key = e.category.name;
    const prev = byCat.get(key);
    byCat.set(key, {
      value: (prev?.value ?? 0) + Number(e.amount),
      color: e.category.color,
    });
  }
  const donut = Array.from(byCat, ([name, v]) => ({ name, value: v.value, color: v.color }));

  // Daily bars (last 30 days)
  const dailyExpenses = await db.expense.findMany({
    where: {
      clerkUserId: userId,
      date: { gte: thirtyRange.from, lte: thirtyRange.to },
    },
    select: { date: true, amount: true },
  });
  const dayMap = new Map<string, number>();
  for (const e of dailyExpenses) {
    const key = format(e.date, "MMM d");
    dayMap.set(key, (dayMap.get(key) ?? 0) + Number(e.amount));
  }
  const daily = eachDayOfInterval(thirtyRange).map((d) => {
    const key = format(d, "MMM d");
    return { date: key, total: dayMap.get(key) ?? 0 };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{format(monthRange.from, "MMMM yyyy")}</p>
          <h1 className="text-3xl font-semibold tracking-tight font-mono">{formatCurrency(monthTotal)}</h1>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Add expense</DialogTitle>
            <ExpenseForm categories={categories} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">By category, this month</h2>
          <CategoryDonut data={donut} />
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Last 30 days</h2>
          <DailyBars data={daily} />
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent</h2>
          <Link href="/expenses" className="text-sm text-muted-foreground hover:text-foreground">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No expenses yet. Add your first one above.</p>
        ) : (
          <ul className="divide-y">
            {recent.map((r) => (
              <li key={r.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CategoryPill {...r.category} />
                  <span className="text-sm text-muted-foreground">{format(r.date, "MMM d")}</span>
                  {r.note && <span className="text-sm">{r.note}</span>}
                </div>
                <span className="font-mono">{formatCurrency(Number(r.amount))}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

`pnpm dev` → `/dashboard`. Month total displays at the top. Both charts render with last month's data (or empty states). Recent list shows up to 5 expenses. Add new — total and charts update.

- [ ] **Step 5: Commit**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git add -A && git commit -m "feat(dashboard): month total, category donut, daily bars, recent list"
```

---

## Task 18: Settings page

**Files:**
- Create: `app/(app)/settings/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
import { UserProfile } from "@clerk/nextjs";

export default function SettingsPage() {
  return (
    <div className="flex justify-center">
      <UserProfile />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

`/settings` shows the Clerk UserProfile widget. Theme toggle in header still works.

- [ ] **Step 3: Commit**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git add app/\(app\)/settings/page.tsx && git commit -m "feat: settings page with Clerk UserProfile"
```

---

## Task 19: Production build verification

**Files:** none modified.

- [ ] **Step 1: Typecheck**

```bash
cd /Users/toriewhite/Documents/expense-tracker && pnpm exec tsc --noEmit
```

Expected: exits 0 with no output.

- [ ] **Step 2: Production build**

```bash
cd /Users/toriewhite/Documents/expense-tracker && pnpm build 2>&1 | tail -30
```

Expected: `✓ Compiled successfully`. Route table shows all expected paths (`/`, `/sign-in`, `/sign-up`, `/dashboard`, `/expenses`, `/expenses/[id]`, `/categories`, `/settings`, `/api/webhooks/clerk`).

If the build fails: read the error, fix the file, re-run. Do not commit broken builds.

- [ ] **Step 3: Local prod run**

```bash
cd /Users/toriewhite/Documents/expense-tracker && pnpm start
```

Open http://localhost:3000/. Walk through: landing → sign in → dashboard → add expense → list → edit → delete → categories → settings → sign out. Kill server with Ctrl-C.

---

## Task 20: USER ACTION — Deploy to Vercel

- [ ] **Step 1: Push latest to GitHub**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git push
```

- [ ] **Step 2: Direct Torie to import the project at Vercel**

She needs to:
1. Sign in at https://vercel.com (use GitHub).
2. Click **Add New** → **Project**.
3. Pick the `twhite42-pixel/expense-tracker` repo.
4. Framework Preset: **Next.js** (auto-detected).
5. Root directory: leave default.
6. **Environment Variables** — paste in:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` = `/dashboard`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` = `/dashboard`
   - `DATABASE_URL` (Neon pooled)
   - `DIRECT_URL` (Neon direct)
   - `CLERK_WEBHOOK_SECRET` (placeholder for now — set after Step 4)
7. Click **Deploy**. First deploy will run `prisma generate && next build`.
8. After deploy, copy the URL (e.g., `https://expense-tracker-xyz.vercel.app`).

- [ ] **Step 3: Add webhook in Clerk pointing to the live URL**

In Clerk dashboard → Webhooks → either edit the existing endpoint or add a new one:
- URL: `https://<vercel-url>/api/webhooks/clerk`
- Subscribe to: `user.created`
- Copy the **Signing Secret** → update `CLERK_WEBHOOK_SECRET` env var in Vercel → redeploy.

- [ ] **Step 4: Smoke test the live site**

Open the Vercel URL. Sign up with a fresh email. Land on dashboard. Add an expense. Verify it persists.

Confirm in the Clerk Webhooks tab that the `user.created` event delivered successfully.

- [ ] **Step 5: Commit any final tweaks**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git add -A && git commit -m "chore: deploy to Vercel" --allow-empty
```

---

## Task 21: README

**Files:**
- Modify (full rewrite): `README.md`

- [ ] **Step 1: Replace `README.md`**

```markdown
# Expense Tracker

A multi-user expense tracker. Sign up, log expenses, see them organized by category and time. Real auth, real database, real deploy.

**Live:** https://<vercel-url-here>

## Stack

- [Next.js 15](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Clerk](https://clerk.com) — auth (email + Google)
- [Neon Postgres](https://neon.tech) — serverless database
- [Prisma](https://www.prisma.io) — ORM and migrations
- [Recharts](https://recharts.org) — charts
- [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) — forms and validation

## Run locally

1. Clone:
   ```bash
   git clone https://github.com/twhite42-pixel/expense-tracker
   cd expense-tracker
   pnpm install
   ```
2. Copy `.env.example` to `.env.local` and fill in:
   - Clerk keys from https://dashboard.clerk.com
   - Neon connection strings from https://console.neon.tech
3. Push the schema:
   ```bash
   pnpm db:push
   ```
4. Run:
   ```bash
   pnpm dev
   ```

Open http://localhost:3000/.

## Architecture

Single Next.js App Router application. Server components do reads, server actions do writes — no separate API. Clerk middleware protects `/dashboard`, `/expenses`, `/categories`, `/settings`. A `user.created` Clerk webhook seeds default categories per user.

```
Browser ──> Next.js (Vercel)
              │
              ├─ Clerk middleware
              ├─ Server components (reads)
              ├─ Server actions (writes)
              └─ Route handler (Clerk webhook)
                        │
                     Neon Postgres
```

## Deploy

Pushes to `main` auto-deploy to Vercel. Database migrations are run manually via `pnpm db:push` against Neon.

## License

MIT
```

- [ ] **Step 2: Commit and push**

```bash
cd /Users/toriewhite/Documents/expense-tracker && git add README.md && git commit -m "docs: write README" && git push
```

---

## Self-review checklist

- Spec section 1 (Goal) → all tasks contribute to it.
- Spec section 4 (Routes) → Task 5 (auth), Task 10 (`/`), Task 11 (app shell), Task 15 (`/categories`), Task 16 (`/expenses`, `/expenses/[id]`), Task 17 (`/dashboard`), Task 18 (`/settings`).
- Spec section 5 (Data model) → Task 6 (Prisma schema with both models, indexes, unique constraint).
- Spec section 6 (Auth flow) → Task 5 (Clerk wiring), Task 12 (webhook + defensive seed).
- Spec section 7 (Architecture) → middleware (Task 5), server components throughout, server actions (Tasks 13–14), webhook (Task 12).
- Spec section 8 (Tech stack) → Tasks 1–3 install all named libs; no extras.
- Spec section 9 (Deployment) → Task 20.
- Spec section 10 (Env vars) → Task 4 (Clerk), Task 6 (Neon), Task 12 (webhook), Task 20 (Vercel).
- Spec section 11 (A11y) → shadcn/ui (Radix-based) used throughout, semantic landmarks in headers and footers, alt text not required (no decorative images).
- Spec section 12 (Testing) → manual verification at each task; typecheck and build in Task 19.
- Spec section 13 (Success criteria) → Task 19 (build), Task 20 (live smoke test).

- Type consistency: `clerkUserId` (camelCase) used in Prisma schema, validators, actions, and queries. `CategoryInput` / `ExpenseInput` defined in `lib/validators.ts` and imported wherever needed. Component prop types declared inline match the queries that feed them.

- No placeholders: every code block is complete, every command is exact, every URL is concrete. The three external-service signups (Clerk, Neon, Vercel) are flagged as explicit user-action steps with what to copy and where to paste.
