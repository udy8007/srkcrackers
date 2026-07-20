# SRK Crackers — Online Crackers Store 1

A full-stack, business-grade crackers e-commerce web app for **SRK Crackers**, a licensed
fireworks dealer in Mogai, Avadi, Tiruvallur. Customers browse the catalog, build a cart, place an
order with a GPay/UPI payment screenshot, and track order status. Admins manage orders and products
from a secure dashboard.

## Tech Stack

| Layer            | Technology                                   |
| ---------------- | -------------------------------------------- |
| Framework        | Next.js 15 (App Router)                       |
| Language         | TypeScript                                    |
| Styling          | Tailwind CSS v4                               |
| ORM              | Prisma 6                                      |
| Database         | PostgreSQL (Supabase) + Firebase FCM only     |
| Auth             | NextAuth / Auth.js v5 (credentials, JWT)      |
| State            | Zustand (cart + UI, localStorage persistence) |
| Hosting          | Vercel (free tier + free SSL)                 |

## Features

### Storefront (`/`)
- Category accordions with 30 seeded products across 8 categories, live search
- Product detail modal, cart with persistent quantities
- 4-step checkout: customer details → GPay/UPI QR → payment screenshot upload → confirmation
- Order tracking by Order ID + mobile number with a status timeline
- Marquee offer banners, license info, embedded map, WhatsApp deep-links, and a demo chatbot

### Admin dashboard (`/admin`)
- Secure credentials login (bcrypt-hashed passwords, JWT sessions)
- Dashboard with order stats and revenue
- Orders list with status filters + search; order detail with payment screenshot and status updates
- Product management: edit price/MRP and toggle visibility

## Project Structure

```
srkcrackers/
├── prisma/
│   ├── schema.prisma          # DB models (Category, Product, Order, OrderItem, StatusHistory, AdminUser)
│   ├── seed.ts                # Seeds categories, products, admin user
│   └── seed-data.ts           # Catalog source data
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── products/route.ts
│   │   │   ├── orders/route.ts            # create order
│   │   │   ├── orders/track/route.ts      # track order
│   │   │   └── admin/                      # protected admin APIs
│   │   ├── admin/
│   │   │   ├── login/                      # login page + form
│   │   │   └── (dashboard)/                # protected dashboard (layout guards auth)
│   │   ├── layout.tsx, page.tsx, globals.css
│   ├── components/
│   │   ├── storefront/                     # all public UI + shared catalog context
│   │   ├── admin/                          # admin UI primitives
│   │   └── SafeImage.tsx
│   ├── lib/                                # prisma, auth, constants, utils, catalog
│   ├── store/                              # zustand stores (cart, ui, toast)
│   └── types/                              # shared DTOs + next-auth augmentation
└── .env.example
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in Supabase Postgres + auth values (see [docs/supabase.md](docs/supabase.md)):

```bash
cp .env.example .env
```

| Variable         | Purpose                                                      |
| ---------------- | ----------------------------------------------------------- |
| `DATABASE_URL`   | Supabase **pooled** URL (runtime, port `6543` / pgbouncer)  |
| `DIRECT_URL`     | Supabase **direct** URL (schema push, port `5432`)          |
| `AUTH_SECRET`    | NextAuth secret — generate with `openssl rand -base64 32`   |
| `NEXTAUTH_SECRET`| Same value as `AUTH_SECRET` (compatibility)                 |
| `ADMIN_EMAIL`    | Seed admin email                                            |
| `ADMIN_PASSWORD` | Seed admin password                                         |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Optional — FCM push only (or upload in Admin Settings) |

### 3. Set up the database

```bash
npm run db:push        # sync schema to Supabase
npm run db:seed        # create-only: categories, products, admin (safe re-run)
```

### 4. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000 for the storefront and http://localhost:3000/admin for the dashboard.

## Default Admin Login

```
Email:    admin@srkcrackers.com
Password: Srk@Admin2026
```

> Change these in `.env` and re-run `npm run db:seed`, or update the record directly, before going
> to production.

## NPM Scripts

| Script             | Description                              |
| ------------------ | ---------------------------------------- |
| `npm run dev`      | Start the dev server                     |
| `npm run build`    | `prisma generate` + production build     |
| `npm run start`    | Start the production server              |
| `npm run lint`     | Run ESLint                               |
| `npm run db:push`    | Sync Prisma schema to Supabase          |
| `npm run db:seed`    | Create-only seed (no product overwrite) |
| `npm run db:studio`  | Open Prisma Studio                      |

## Deploying to Vercel (free + free SSL)

1. Push this repo to GitHub.
2. Import the project on [vercel.com](https://vercel.com).
3. Add env vars: `DATABASE_URL`, `DIRECT_URL` (or `srk_POSTGRES_*`), `AUTH_SECRET`, `NEXTAUTH_SECRET`, and optionally `FIREBASE_SERVICE_ACCOUNT_JSON` for FCM.
   Set `NEXTAUTH_URL`/`AUTH_URL` to your Vercel domain (or rely on `AUTH_TRUST_HOST=true`).
4. Build command uses `scripts/vercel-build.mjs` (`prisma generate` + `db push` + `next build`). **No seed on deploy.**
5. After the first deploy, run create-only seed once against production:
   ```bash
   npm run db:seed
   ```
6. Vercel provisions HTTPS with a free, auto-renewing SSL certificate.


## Notes & Production Hardening

- **Payment screenshots** are currently stored as base64 in Postgres for simplicity. For scale, swap
  to object storage (Vercel Blob / Cloudinary / S3) and store the URL instead — see the
  `paymentScreenshot` field in `prisma/schema.prisma`.
- Order pricing is always recomputed from the database on the server; client-submitted amounts are
  never trusted.
- Admin routes are protected both at the layout level (`auth()` redirect) and inside every admin API
  handler (401 on missing session).
