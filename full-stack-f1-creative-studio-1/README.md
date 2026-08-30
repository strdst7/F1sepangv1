# Kracked Devs Creative — Sepang F1 Studio

> A full-stack race-weekend creative studio for the people who capture, shape, and keep the moment.

[![Live demo](https://img.shields.io/badge/Live%20demo-full--stack--f1--creative--studio--1.vercel.app-a3e635?style=flat-square&labelColor=060806)](https://full-stack-f1-creative-studio-1.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle-336791?style=flat-square&logo=postgresql)](https://orm.drizzle.team/)

**Studio site:** https://full-stack-f1-creative-studio-1.vercel.app<br>
**Dashboard:** https://full-stack-f1-creative-studio-1.vercel.app/app<br>
**KD AI Creator:** https://full-stack-f1-creative-studio-1.vercel.app/creator

---

## Overview

Kracked Devs Creative is a darkroom-style studio for Sepang race weekends. It combines an editorial public site with an operational workspace for managing events, photographs, videos, and AI-style creative scenes.

The interface is built around a carbon-black and acid-lime visual system: pit-lane typography, checkered accents, telemetry metadata, live status pills, masonry media walls, and a creator tool that stamps a visitor’s identity onto KD imagery.

## Features

### Public experience

- Editorial landing page with services, process, statistics, CTA, and live gallery wall
- Open browsing without an account
- Committed local image assets served from `/images/...`
- Responsive layouts for desktop, tablet, and mobile

### Studio dashboard

- Dashboard with media counts, recent captures, event countdown, bookings, and photo mix
- Race events with search, filters, status, capacity, notes, and CRUD controls
- Photo library with masonry layout, categories, search, lightbox, likes, and CRUD controls
- Video library with thumbnails, filters, playback modal, and CRUD controls
- AI mockup queue with rendering states, presets, and output wall

### KD AI Creator

- Free, public creator at `/creator`
- Racing suit, helmet, race car, and event poster formats
- Custom name, race number, sponsor line, colors, scene, style, and aspect ratio
- Client-side canvas compositing with committed KD source images
- Clean lower-third creator plate instead of duplicated text over branded photography
- Downloadable JPEG output and browser-local render history
- Offline vector fallback if a source image cannot be composed

### Database-outage fallback

The public demo remains useful while PostgreSQL is being configured:

- Read endpoints fall back to local demo data when Postgres is unavailable.
- Gallery, photos, videos, events, mockups, and dashboard stats remain populated.
- The documented demo crew pass can create a temporary demo session during an outage.
- Persistent writes, likes, normal crew accounts, and database-backed sessions still require Postgres.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Drizzle ORM
- PostgreSQL via `pg`
- Node.js route handlers
- Canvas API for creator compositing
- Vercel deployment

## Getting started

From the repository root:

```bash
cd full-stack-f1-creative-studio-1
npm install
cp .env.example .env
```

Set a PostgreSQL connection string in `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
```

`DATABASE_URL` must be present for the Next.js build and for database commands.

Apply the schema and load the demo catalog:

```bash
npx drizzle-kit push
npx tsx src/db/seed.ts
```

Start the app:

```bash
npm run dev
```

Open http://localhost:3000.

## Demo credentials

The sign-in page includes a public demo pass:

```text
Email:    crew@krackeddevs.com
Password: kracked2026
```

This pass is intentionally public for demonstration and must be replaced before production use.

## Database workflow

The Drizzle configuration reads `DATABASE_URL` from `.env` or the shell environment:

```bash
# Apply schema changes
npx drizzle-kit push

# Reset and recreate the demo dataset
npx tsx src/db/seed.ts
```

The seed is idempotent and currently creates demo crew, events, photos, videos, and AI mockup records. It clears the demo tables before inserting fresh data, so do not run it against a database containing production content.

## Deploy to Vercel

The repository root contains the app in this directory. When importing the GitHub repository into Vercel:

1. Set **Root Directory** to `full-stack-f1-creative-studio-1`.
2. Add `DATABASE_URL` to the required Vercel environments.
3. Use the existing `vercel.json` configuration.
4. Deploy with:

```bash
npm run build
```

After the first deployment, initialize the production database from this directory:

```bash
DATABASE_URL="your-production-url" npx drizzle-kit push
DATABASE_URL="your-production-url" npx tsx src/db/seed.ts
```

### Vercel CLI

```bash
npm install
npm i -g vercel
vercel link
vercel env add DATABASE_URL
vercel deploy --prod
```

Deployment-critical imagery is already committed under `public/images/`, so a normal build does not depend on an image-generation service.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run lint` | Run ESLint |
| `npx drizzle-kit push` | Apply the database schema |
| `npx tsx src/db/seed.ts` | Reset and seed demo data |
| `npx tsx Scripts` | Optionally regenerate the original KD asset set |

The `Scripts` command is optional and network-dependent. The committed assets are the deployment source of truth.

## API routes

| Route | Methods | Description |
| --- | --- | --- |
| `/api/auth/login` | `POST` | Crew or demo sign-in |
| `/api/auth/me` | `GET` | Resolve current session |
| `/api/auth/logout` | `POST` | End current session |
| `/api/events` | `GET`, `POST` | List or create events |
| `/api/events/[id]` | `PATCH`, `DELETE` | Update or delete an event |
| `/api/photos` | `GET`, `POST` | List or create photos |
| `/api/photos/[id]` | `PATCH`, `DELETE` | Update or delete a photo |
| `/api/photos/[id]/like` | `POST` | Toggle a like |
| `/api/videos` | `GET`, `POST` | List or create videos |
| `/api/videos/[id]` | `PATCH`, `DELETE` | Update or delete a video |
| `/api/mockups` | `GET`, `POST` | List or queue mockups |
| `/api/mockups/[id]` | `PATCH`, `DELETE` | Update or delete a mockup |
| `/api/gallery` | `GET` | Public mixed-media wall |
| `/api/stats` | `GET` | Dashboard statistics |
| `/api/health` | `GET` | PostgreSQL health check |

## Project structure

```text
src/
├── app/
│   ├── api/                 # Auth, CRUD, gallery, stats, and health routes
│   ├── app/                 # Dashboard pages and dashboard layout
│   ├── creator/             # Public KD AI Creator page
│   ├── login/               # Crew sign-in page
│   ├── layout.tsx           # Root metadata and global shell
│   └── page.tsx             # Public landing page
├── components/
│   ├── creator-tool.tsx     # Creator controls, preview, and history
│   ├── auth-*.tsx           # Login shell and form
│   ├── dash-shell.tsx       # Dashboard navigation and topbar
│   └── ui.tsx               # Shared UI primitives
├── db/
│   ├── index.ts             # PostgreSQL / Drizzle client
│   ├── schema.ts            # Tables and relationships
│   └── seed.ts              # Idempotent demo seed
└── lib/
    ├── api.ts               # Client fetch helper
    ├── auth.ts              # Sessions and demo authentication
    ├── creator.ts            # Prompt, source, canvas, and fallback pipeline
    ├── demo-data.ts          # Database-free read catalog
    ├── types.ts              # Shared domain types and labels
    └── utils.ts              # Formatting and class helpers

public/images/                # Committed KD and Sepang assets
```

## Adding media

To add a new image to the deployed site:

1. Copy it to `public/images/`.
2. Reference it as `/images/filename.ext`.
3. Add a record to `src/lib/demo-data.ts` for database-free previews.
4. Add a record to `src/db/seed.ts` if it should appear after reseeding.
5. Commit the asset and code together.

Use lowercase, descriptive filenames and preserve exact filename casing in JSX and data records.

## Design principles

- **Race-day clarity:** state and actions should be readable at a glance.
- **Editorial energy:** the dashboard should still feel like a creative studio.
- **Open web by default:** browsing and creating are available without signup.
- **Graceful degradation:** an unavailable database should not blank the public demo.
- **Local-first static media:** deployment-critical assets belong in Git or durable object storage.
- **Secure configuration:** secrets belong in environment variables, never in source or README files.

## Troubleshooting

### “Pit radio static” or empty libraries

Check that `DATABASE_URL` points to a reachable PostgreSQL database, then run:

```bash
npx drizzle-kit push
npx tsx src/db/seed.ts
```

The read-only demo fallback should still populate the public catalog when the database is unavailable.

### Vercel image 404s

Confirm that:

- Vercel Root Directory is `full-stack-f1-creative-studio-1`.
- The asset is committed under `public/images/`.
- The path starts with `/images/`.
- Filename casing matches exactly.

### Creator history contains an old render

Creator history is browser-local. Use **Re-render** or clear the site’s local storage.

## Security

- Never commit `.env` or production database URLs.
- Rotate any credential that has been pasted into a chat, issue, log, or shell history.
- Treat the documented demo credentials as public.
- Use a separate production database and production crew credentials.

## License

MIT. See [LICENSE](../LICENSE).

---

Built at Sepang · 2.95° N, 101.70° E · Kracked Devs Creative
