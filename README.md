# Kracked Devs Creative

> A full-stack creative studio for Sepang race weekends — built for the people who capture, shape, and keep the moment.

[![Live demo](https://img.shields.io/badge/Live%20demo-full--stack--f1--creative--studio--1.vercel.app-a3e635?style=flat-square&labelColor=060806)](https://full-stack-f1-creative-studio-1.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-strdst7%2FF1sepangv1-181717?style=flat-square&logo=github)](https://github.com/strdst7/F1sepangv1)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

**Live site:** https://full-stack-f1-creative-studio-1.vercel.app<br>
**App:** https://full-stack-f1-creative-studio-1.vercel.app/app<br>
**Free creator:** https://full-stack-f1-creative-studio-1.vercel.app/creator

---

## The idea

Kracked Devs Creative is a darkroom-style studio dashboard for F1 Sepang fans, visitors, ambassadors, and race-day crews. It combines an editorial landing page with a practical content workspace for managing events, photographs, videos, and AI-style creative scenes.

The visual language is deliberately fast and tactile: carbon black, acid lime, pit-lane typography, checkered accents, telemetry-style metadata, and a library that feels like a working race operation rather than a generic admin panel.

## What is inside

### Public studio site

- Editorial landing page for the Sepang creative studio
- Services for race-day production, photography, videography, and AI mockup scenes
- Live “wall” assembled from the gallery API
- Process section, race statistics, CTA, and responsive navigation

### Studio workspace

- Dashboard with counts, recent captures, event countdown, and media mix
- Race-event calendar with search, filters, status, booking capacity, and CRUD controls
- Photo library with masonry layout, categories, search, lightbox, likes, and CRUD controls
- Video library with thumbnails, filters, playback modal, and CRUD controls
- AI mockup queue with rendering states, presets, and output wall

### KD AI Creator

- Public, no-signup creator at `/creator`
- Racing suit, helmet, race car, and event poster formats
- Custom base/accent colors, name, race number, sponsor line, scene, style, and aspect ratio
- Client-side canvas compositing with local KD source imagery
- Downloadable JPEG output and local render history
- Offline vector fallback when a source image cannot be composed

### Demo-first resilience

The app is designed to remain presentable while a Postgres instance is being configured:

- Read endpoints fall back to a curated local demo catalog when Postgres is unavailable.
- Demo photos and mockups use committed files under `public/images/`.
- The documented demo crew pass can create a temporary demo session during a database outage.
- Create, edit, delete, like, seed, and persistent login operations still require a working database.

## Technology

- **Next.js 16** with the App Router
- **React 19** and TypeScript
- **Tailwind CSS v4** with a custom carbon / acid-lime theme
- **Drizzle ORM** and PostgreSQL via `pg`
- **Node.js** API routes for auth and studio CRUD
- **Canvas API** for client-side creator compositing
- **Vercel** deployment configuration included

## Repository layout

This repository contains the application in a nested Vercel-ready project directory:

```text
F1sepangv1/
├── full-stack-f1-creative-studio-1/
│   ├── public/images/       # Committed KD and Sepang image assets
│   ├── src/
│   │   ├── app/             # Pages, layouts, and API route handlers
│   │   ├── components/      # Auth, dashboard, creator, and UI components
│   │   ├── db/              # Drizzle client, schema, and seed script
│   │   └── lib/             # API helpers, auth, creator pipeline, demo data
│   ├── .env.example
│   ├── drizzle.config.ts
│   ├── next.config.ts
│   ├── package.json
│   ├── Scripts               # Optional image regeneration script
│   └── vercel.json
├── LICENSE
└── README.md
```

## Run locally

### 1. Clone and enter the app

```bash
git clone https://github.com/strdst7/F1sepangv1.git
cd F1sepangv1/full-stack-f1-creative-studio-1
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the environment

```bash
cp .env.example .env
```

Set `DATABASE_URL` in `.env` to a PostgreSQL connection string. A local example is:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
```

`DATABASE_URL` must be present for the Next.js build because the server database module is evaluated during build-time route collection.

### 4. Apply the schema and seed demo content

```bash
npx drizzle-kit push
npx tsx src/db/seed.ts
```

The seed is intentionally idempotent: it clears the demo tables and recreates the sample crew, events, photos, videos, and AI mockups.

### 5. Start the development server

```bash
npm run dev
```

Open http://localhost:3000.

## Demo access

The sign-in page includes a public demo pass:

```text
Email:    crew@krackeddevs.com
Password: kracked2026
```

The pass is for demonstration only. Replace it before using the project as a real authenticated product.

## Environment variables

| Variable | Required | Used by | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | Next.js, Drizzle, seed script | PostgreSQL connection string |

Never commit `.env`, production connection strings, API keys, or personal access tokens.

## Deploy to Vercel

Because the Next.js app lives one directory below the repository root, configure the Vercel project as follows:

1. Import `strdst7/F1sepangv1` into Vercel.
2. Set **Root Directory** to `full-stack-f1-creative-studio-1`.
3. Add `DATABASE_URL` to the Production, Preview, and Development environments as needed.
4. Deploy with the existing `vercel.json` settings.
5. Apply the production schema and seed once:

```bash
DATABASE_URL="your-production-url" npx drizzle-kit push
DATABASE_URL="your-production-url" npx tsx src/db/seed.ts
```

The Vercel build command is:

```bash
npm run build
```

The project serves committed static assets from `public/images/` at `/images/...`; no runtime image-generation step is required for a normal deployment.

### Vercel CLI alternative

```bash
cd full-stack-f1-creative-studio-1
npm install
npm i -g vercel
vercel link
vercel env add DATABASE_URL
vercel deploy --prod
```

## Useful scripts

Run these from `full-stack-f1-creative-studio-1/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build locally |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run lint` | Run ESLint |
| `npx drizzle-kit push` | Apply the Drizzle schema to PostgreSQL |
| `npx tsx src/db/seed.ts` | Reset and seed demo database content |
| `npx tsx Scripts` | Optional network-based KD asset regeneration |

The committed image files are the source of truth for deployment. The optional `Scripts` command is not part of the normal build and requires access to its remote image provider.

## API surface

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/auth/login` | `POST` | Sign in with crew credentials or demo pass |
| `/api/auth/me` | `GET` | Resolve the current session |
| `/api/auth/logout` | `POST` | End the current session |
| `/api/events` | `GET`, `POST` | List and create race events |
| `/api/events/[id]` | `PATCH`, `DELETE` | Update or delete an event |
| `/api/photos` | `GET`, `POST` | List and create photos |
| `/api/photos/[id]` | `PATCH`, `DELETE` | Update or delete a photo |
| `/api/photos/[id]/like` | `POST` | Toggle a photo like |
| `/api/videos` | `GET`, `POST` | List and create videos |
| `/api/videos/[id]` | `PATCH`, `DELETE` | Update or delete a video |
| `/api/mockups` | `GET`, `POST` | List and queue AI mockups |
| `/api/mockups/[id]` | `PATCH`, `DELETE` | Update or delete a mockup |
| `/api/gallery` | `GET` | Public mixed-media wall feed |
| `/api/stats` | `GET` | Dashboard counts and recent activity |
| `/api/health` | `GET` | PostgreSQL connectivity check |

## Image assets

All current studio imagery is committed to Git so Vercel deployments receive it reliably. The asset set includes:

- KD pit portraits and crew coverage
- Sepang race cars, wet-grid scenes, and aerial circuit views
- Hero, pit-lane, rain, sunset, suit, and grandstand visuals
- Local JPEG and WebP files used by the landing site, gallery, dashboard, and creator

To add new media:

1. Copy the file into `full-stack-f1-creative-studio-1/public/images/`.
2. Reference it with a root-relative path such as `/images/new-frame.jpeg`.
3. Add it to `src/lib/demo-data.ts` for database-free previews.
4. Add it to `src/db/seed.ts` if it should appear after reseeding PostgreSQL.
5. Commit the asset and code together.

## Design principles

- **Race-day clarity:** important actions and statuses should be legible at a glance.
- **Editorial energy:** imagery and typography should feel like a creative studio, not a generic admin template.
- **Open web by default:** visitors can browse the site and creator without an account.
- **Graceful degradation:** a missing database should not blank the public demo.
- **Local-first static media:** deployment-critical imagery belongs in Git or durable object storage, not on a developer machine.
- **Secure by default:** credentials belong in environment variables; public demo credentials must never be reused in production.

## Troubleshooting

### The dashboard says “Pit radio static”

Check that `DATABASE_URL` is present and points to a reachable PostgreSQL instance. For a newly created database, run:

```bash
npx drizzle-kit push
npx tsx src/db/seed.ts
```

The public read views and demo login can still operate in fallback mode, but persistent writes and normal crew accounts need Postgres.

### Images return 404 on Vercel

Confirm that:

- Vercel Root Directory is `full-stack-f1-creative-studio-1`.
- The file is committed under `public/images/`.
- The JSX path begins with `/images/` and matches filename case exactly.

### The creator shows an old render

The creator history is stored in browser `localStorage`. Use **Re-render** or clear the site storage to remove older saved output.

## License

MIT. See [LICENSE](./LICENSE).

---

Built at Sepang · 2.95° N, 101.70° E · Kracked Devs Creative
