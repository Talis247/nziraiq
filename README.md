# NziraIQ

AI-powered tourism platform for Zimbabwe — Copilot, Marketplace, and Tourism Opportunity Intelligence.

## Accounts

| Account | Who | Access |
|---------|-----|--------|
| **Tourist** | Visitors planning trips | Home, Explore, Copilot, Bookings, Trips |
| **Operator** | Resorts, lodges, guides, transport, craft & community services | Listings, availability, booking inbox |
| **Admin** | Platform / tourism intelligence | Demand vs supply dashboard (invite-only) |

Public sign-up is Tourist or Operator only. Admin accounts are created by the team.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- PostgreSQL + Prisma
- Auth.js (email, Google, Facebook)
- Lucide icons, Poppins font, Zimbabwe flag accent colors

## Setup

1. Create a local Postgres database named `nziraiq`.
2. Copy `.env.example` → `.env` and set `DATABASE_URL` (and optionally `OPENAI_API_KEY`).
   For Google / Facebook login, add `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` and
   `AUTH_FACEBOOK_ID` / `AUTH_FACEBOOK_SECRET` from your developer consoles.
   Callback URLs: `http://localhost:3000/api/auth/callback/google` and
   `http://localhost:3000/api/auth/callback/facebook`.
3. Install and initialize:

```bash
cd web
npm install
npx prisma db push
npm run db:seed
npm run db:import
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

Password for all: `password123`

| Email | Role |
|-------|------|
| traveler@nziraiq.test | Tourist |
| operator@nziraiq.test | Operator (activities) |
| lodge@nziraiq.test | Operator (resort / lodge) |
| admin@nziraiq.test | Admin (intelligence) |

## Flows

1. **Onboarding** — three educational slides, then Welcome / Login / Sign Up.
2. **Tourist** — Explore listings, chat with Copilot, save trips, request bookings.
3. **Operator** — Publish stays and services, set availability, confirm/decline bookings.
4. **Admin** — Demand vs supply gaps and opportunity alerts.

Copilot works without an OpenAI key (rule-based itineraries from real listings). With `OPENAI_API_KEY`, it uses GPT for richer replies while still grounding stops in catalog data.
