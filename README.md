# Kracked Devs Creative — Sepang F1 Studio

A full-stack Next.js 16 creative studio for F1 Sepang fans and visitors. Produces the moments of race events — photography, videography and AI mockup scenes from Sepang International Circuit.

## Features

- **Open web** studio — no signup required; the dashboard, CRUD flows and free AI creator work for everyone
- **Free KD AI Creator** (`/creator`) — puts your name, number and sponsor on real KD imagery (racing suit, helmet, #39 car, Sepang grandstand poster) via client-side canvas compositing
- Full CRUD for events, photos, videos, and AI mockups (Postgres + Drizzle ORM)
- Scramble-effect landing page, live countdown, masonry wall, process, quote band and CTA
- Email/password auth (scrypt-hashed, httpOnly sessions), optional for visitors
- Brand system: carbon black + acid-lime, Chakra Petch / Inter / Plex Mono, Ken Burns hero, noise texture, checkered flag accents, race-day skeuomorphic UI

## Stack

- Next.js 16 (App Router)
- React 19
- Drizzle ORM + PostgreSQL (`pg` driver)
- Tailwind CSS v4
- TypeScript

## Local development

```bash
npm install
cp .env.example .env          # edit DATABASE_URL if needed
npx drizzle-kit push          # apply schema
npx tsx src/db/seed.ts        # seed demo data (2 crew, 7 events, 16 photos, 8 videos, 6 AI mockups)
npm run dev
```

Visit http://localhost:3000.

**Demo crew login** (optional, if you want a named session):

```
email    : crew@krackeddevs.com
password : kracked2026
```

## Deploy to Vercel

### Option 1 — One-click deploy (requires a Postgres)

1. Push this repository to GitHub.
2. On Vercel, import the repo.
3. Add `DATABASE_URL` as an environment variable (Neon, Supabase, Vercel Postgres, Railway, etc. — any Postgres works).
4. Deploy.
5. After the first deploy, run the seed once:

   ```bash
   DATABASE_URL="your-prod-db-url" npx drizzle-kit push
   DATABASE_URL="your-prod-db-url" npx tsx src/db/seed.ts
   ```

### Option 2 — Deploy via Vercel CLI

```bash
npm i -g vercel
vercel link
vercel env add DATABASE_URL
vercel deploy --prod
```

### Option 3 — Upload without Git

The project is fully self-contained. Archive this folder as `.zip` and upload it via Vercel's "Clone Template / Import Project → Upload ZIP" flow. Add `DATABASE_URL` in the Environment Variables step.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | **Yes** | Postgres connection string, e.g. `postgresql://user:pass@host:5432/db` |

## Project layout

```
src/
├── app/
│   ├── api/            # REST routes (auth, events, photos, videos, mockups, stats, gallery, health)
│   ├── app/            # dashboard (sidebar layout, overview, events, photos, videos, mockups)
│   ├── creator/        # free public KD AI creator page
│   ├── login/          # optional crew login
│   ├── layout.tsx      # root layout (fonts, noise layer, theme)
│   └── page.tsx        # public landing site
├── components/         # UI kit, auth shell, dash shell, creator tool
├── db/
│   ├── index.ts        # Drizzle client
│   ├── schema.ts       # Postgres tables
│   └── seed.ts         # demo data seeder
└── lib/                # auth helpers, types, utils, creator pipeline
public/images/          # KD brand imagery (suit, car, grandstand, mockup scenes)
```

## Seeding demo data

The seed script is idempotent (wipes existing data, inserts fresh demo rows). Re-run any time to reset to the demo state:

```bash
npx tsx src/db/seed.ts
```

## License
MIT
Kracked Devs Creative — studio demo for Sepang F1 fans.
