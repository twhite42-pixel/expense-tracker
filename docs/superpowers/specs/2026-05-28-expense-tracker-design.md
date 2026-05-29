# Expense Tracker — Design Spec

**Date:** 2026-05-28
**Owner:** Torie White
**Project path:** `~/Documents/expense-tracker`
**Repo:** `twhite42-pixel/expense-tracker` (public)
**Status:** Approved design, ready for implementation plan

---

## Goal

A multi-user expense-tracking SaaS that demonstrates Torie can ship a full-stack production application end-to-end: real authentication, real database, real deployment. Anyone can sign up; each user's data is private and isolated. Lives on her portfolio as the "full-stack proof" project alongside the editorial portfolio site.

## Non-goals (v1)

These features are explicitly deferred to keep the scope shippable:

- Bank account integration (Plaid).
- Multi-currency support — USD only for v1.
- Receipt OCR / photo upload.
- Native mobile app — responsive web only.
- Shared / split expenses (Splitwise-style).
- Income tracking — expenses only.
- Recurring expenses.
- Budget targets and alerts.
- CSV export.

All of the above are trivially additive to the v1 foundation and will be tracked in a `v2-ideas.md` file at the end of v1.

## Audience and outcome

- **Audience:** recruiters and hiring managers evaluating Torie for front-end, full-stack, or product roles. The app itself is usable by anyone.
- **Primary outcome:** a recruiter visiting `expense-tracker.vercel.app`, signing up with a Google account, logging two expenses, and seeing the dashboard chart populate — in under 60 seconds total.
- **Secondary outcome:** recruiter clicks through to the GitHub repo and finds a clean README, sensible commits, and modern code.

## Aesthetic direction

Modern SaaS — Linear / Vercel-inspired. Clean, minimal, trustworthy.

- **Background:** white in light mode, near-black (`#0a0a0a`) in dark mode.
- **Text:** near-black / near-white, with one neutral gray tier for secondary text.
- **Accent:** emerald (`#10b981`). Single accent — used for primary buttons, links, active states, the chart positive-direction color. No second accent.
- **Typography:** Geist Sans for UI, Geist Mono for numerical amounts and tabular figures.
- **Spacing:** generous whitespace, 8-point grid.
- **Surfaces:** subtle 1px borders (`#e5e7eb` light, `#27272a` dark), soft shadows on hover only.
- **Radius:** 8px on cards, 6px on buttons and inputs.
- **Motion:** restrained. Fades and small slides for entrance. No bouncy spring eases.
- **Dark mode:** toggle in the user menu. System preference detected on first visit (via `next-themes`).

## Routes

| Path | Purpose | Auth |
|---|---|---|
| `/` | Landing page — hero, three feature points, sign-up CTA. | Public |
| `/sign-in` | Clerk sign-in page. | Public |
| `/sign-up` | Clerk sign-up page. | Public |
| `/dashboard` | Default authenticated landing — month total, breakdown by category (donut), spending over last 30 days (bar/line), 5 most recent expenses. | Protected |
| `/expenses` | Full expense list. Filters: date range, category, search by note. Sortable columns. | Protected |
| `/expenses/new` | Modal dialog (not a real route — opened from `/expenses` and `/dashboard`). Form: amount, category, date, note. | Protected |
| `/expenses/[id]` | View / edit / delete one expense. Reuses the same form as `/expenses/new`. | Protected |
| `/categories` | List of user's categories. Add, rename, change color, delete (with confirmation if any expenses use it — reassigns to "Other"). | Protected |
| `/settings` | Account info — mostly delegated to Clerk's `<UserProfile />` component. Dark mode toggle lives here AND in the user menu. | Protected |

Protected routes are gated by Clerk middleware (`middleware.ts`). Unauthenticated users are redirected to `/sign-in?redirect=<original>`.

## Data model

Three tables. User identity is owned by Clerk — we store only the Clerk user ID as a foreign key, never email or name directly.

```prisma
model Category {
  id          String   @id @default(cuid())
  clerkUserId String   // Clerk user, indexed
  name        String
  color       String   // hex, e.g. "#10b981"
  icon        String   // Lucide icon name, e.g. "utensils"
  createdAt   DateTime @default(now())
  expenses    Expense[]

  @@index([clerkUserId])
  @@unique([clerkUserId, name]) // per-user unique category names
}

model Expense {
  id          String   @id @default(cuid())
  clerkUserId String   // Clerk user, indexed
  categoryId  String
  amount      Decimal  @db.Decimal(10, 2) // USD, two decimal places
  date        DateTime @db.Date           // date of purchase (no time)
  note        String?  @db.VarChar(255)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  category    Category @relation(fields: [categoryId], references: [id])

  @@index([clerkUserId])
  @@index([clerkUserId, date])
  @@index([categoryId])
}
```

### Seeded default categories

When a new user signs up, a Clerk webhook handler (`app/api/webhooks/clerk/route.ts`) creates these seven categories for them:

| Name | Color | Icon (Lucide) |
|---|---|---|
| Food | `#f97316` | `utensils` |
| Transport | `#3b82f6` | `car` |
| Housing | `#8b5cf6` | `home` |
| Entertainment | `#ec4899` | `film` |
| Health | `#ef4444` | `heart-pulse` |
| Shopping | `#eab308` | `shopping-bag` |
| Other | `#6b7280` | `more-horizontal` |

Users can rename, recolor, or delete any of these.

## Auth flow

1. Unauthenticated visitor lands on `/`. Sees marketing copy + "Sign in" and "Get started" buttons.
2. Clicks "Get started" → `/sign-up` (Clerk-hosted UI).
3. Clerk creates the user → fires a `user.created` webhook to `/api/webhooks/clerk` → handler seeds default categories.
4. Clerk redirects to `/dashboard`. First-time experience: empty state with a single "Add your first expense" CTA.
5. Returning users go straight to `/dashboard`.
6. Sign-out via user menu (Clerk `<UserButton />`) → back to `/`.

Webhook is verified via `CLERK_WEBHOOK_SECRET` using `svix`. Webhook secret is set in both Clerk dashboard and Vercel env vars.

## Architecture

Single Next.js 15 (App Router) application. No separate backend service.

```
Browser ──> Next.js (Vercel)
              │
              ├─ middleware.ts (Clerk gate)
              ├─ Server Components (reads via Prisma)
              ├─ Server Actions (writes via Prisma)
              └─ Route Handlers (Clerk webhook only)
                        │
                     Neon Postgres
```

- **Reads:** server components import a `lib/db.ts` Prisma singleton and query directly. Data is fetched server-side and streamed to the client.
- **Writes:** server actions (`"use server"`) handle create/update/delete. All actions verify the current Clerk user matches the resource's `clerkUserId` before mutating.
- **Forms:** React Hook Form on the client, validated with Zod, submitted via server actions.
- **Charts:** Recharts components run client-side; data is passed as serialized props from the server.

## Tech stack

| Layer | Library | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | Vercel-native, server actions remove the need for a separate API. |
| Styling | Tailwind CSS v4 | Zero-config in Next.js, matches shadcn requirements. |
| UI primitives | shadcn/ui | Copy-paste accessible components built on Radix. |
| Auth | `@clerk/nextjs` | Drop-in middleware + UI components. |
| Database | Neon Postgres | Serverless, free tier, branching for preview deploys. |
| ORM | Prisma | Type-safe queries, easy migrations, good Neon support. |
| Charts | Recharts | React-native, simple API, themeable. |
| Forms | React Hook Form + Zod | Industry standard, type-safe validation. |
| Icons | Lucide | Matches shadcn's default icon set. |
| Dates | date-fns | Lightweight, tree-shakeable. |
| Theme toggle | `next-themes` | Standard dark-mode helper. |

No additional dependencies beyond these will be added in v1 without justification in the implementation plan.

## Deployment

- **Vercel project** connected to `twhite42-pixel/expense-tracker`.
- Push to `main` → preview deploy first (auto), then promoted to production on merge.
- **Neon:** one database, separate branches per Vercel preview deploy (Neon's Vercel integration handles this automatically).
- **Clerk:** one application, development instance for previews, production instance for the live URL.
- **Domain:** `expense-tracker.vercel.app` for v1. Custom domain deferred.

## Environment variables

| Var | Where | Notes |
|---|---|---|
| `DATABASE_URL` | Vercel + local | Pooled Neon connection string. |
| `DIRECT_URL` | Vercel + local | Direct Neon connection for Prisma migrations. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Vercel + local | Public. |
| `CLERK_SECRET_KEY` | Vercel + local | Server-only. |
| `CLERK_WEBHOOK_SECRET` | Vercel + local | Generated when wiring the webhook in Clerk dashboard. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Vercel + local | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Vercel + local | `/sign-up` |

A `.env.example` will be committed to the repo with placeholder values and instructions for getting each one.

## Accessibility & responsiveness

- WCAG AA color contrast on both light and dark modes.
- All interactive elements reachable by keyboard, with visible focus states.
- shadcn/ui components are built on Radix, which provides accessible primitives out of the box.
- Responsive breakpoints: mobile (sm), tablet (md), desktop (lg). Tables collapse to stacked cards on mobile.

## Testing strategy

For a v1 portfolio piece, exhaustive automated tests are not required. The implementation plan will include:

- Manual verification at each task (visual + interactive).
- Zod schemas as the source of truth for input validation — used both client-side (RHF resolver) and server-side (re-validated in server actions).
- A `pnpm typecheck` script that runs `tsc --noEmit` — must stay green.
- A production build (`pnpm build`) — must succeed before each merge.
- Optional: a single Playwright smoke test that signs up a test user, adds an expense, and verifies it appears on the dashboard. Decision deferred to the implementation plan.

## Success criteria

- Anyone can sign up at the live URL and log an expense within 60 seconds.
- Dashboard renders all three visualizations correctly with sample data.
- Lighthouse Performance ≥ 85, Accessibility ≥ 95 on the dashboard route.
- No TypeScript errors, no console errors after first paint.
- Repo README is publishable — explains stack, includes setup instructions, links to live URL.

## v2 ideas (not building now)

Tracked here so they don't get lost; not part of this spec's implementation scope.

- Budgets per category with progress bars and over-budget alerts.
- Recurring expenses (rent, subscriptions).
- CSV import + export.
- Income tracking and net-flow view.
- Multi-currency with exchange rates.
- Receipt photo upload + OCR (Tesseract.js or external API).
- Shared expenses / split bills (Splitwise-style).
- Native mobile (React Native or Capacitor wrap).
- Custom domain.

## Open questions

None that block the implementation plan. The accent color (`emerald #10b981`), default categories, route names, data model, and stack are all locked. The Playwright smoke test is the only deferred decision and gets resolved in the plan.
