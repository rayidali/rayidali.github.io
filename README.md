# rayidali.com

Personal site of Rayid Ali, AI engineer in New York. A Y2K desktop (boot screen, Win98 windows, typing terminal, word search) over a three.js wireframe New York, with a real analytics stack behind it. Live at https://www.rayidali.com.

## Stack
- **Next.js 15** (App Router) on **Vercel**, git-connected to `main`.
- **three.js**, loaded lazily after the boot screen; the whole city is merged into a few draw calls (`components/scene.ts`).
- **PostHog** (cookieless, proxied through `/ingest`), **Microsoft Clarity** (session replay, on by default with an opt-out), **Sentry** (errors only).
- **Supabase**: first-party event log, tracked links, résumé variants, admin auth.
- **Telegram** pings and a weekly AI report (Vercel Cron).

## Where things are
| Path | What |
|---|---|
| `lib/desktop.html` | The page. Server-rendered so crawlers get everything. |
| `components/Desktop.tsx` | Everything that moves: boot, terminal, reveals, draggable windows, puzzle, tracking hooks. Each block is guarded; a failure never blanks the page. |
| `components/scene.ts` | The three.js world (globe, New York, bridge, dust). |
| `components/Analytics.tsx` | PostHog (lazy), Clarity (with retries), ref-code capture, consent dialog. |
| `app/resume` | Web résumé. `app/resume/pdf` streams the PDF (inline, or `?dl=1` to download); both are logged. |
| `app/r/[code]` | Tracked entry links. `/r/me` marks a browser as the owner so its visits are never logged. |
| `app/api/track` | First-party event sink → Supabase `events`. |
| `app/api/digest` | Weekly report: Supabase + PostHog + Sentry → Claude (or Gemini) → Telegram / email. Cron in `vercel.json`. |
| `app/admin` | Dashboard: magic-link login (one allowed email), visit log, link generator, résumé uploads. |
| `supabase/schema.sql` | Tables, RLS, storage bucket. |
| `scripts/` | `setup-services.mjs` / `provision.mjs` (one-time provisioning), `env-push.mjs` (push `.env.local` to Vercel), `telegram-id.mjs`. |

## Run locally
```
npm install
cp .env.example .env.local   # fill in keys
npm run dev
```
`npm run build` must pass before pushing; Vercel deploys `main` automatically.

## Tracking model
- Every visit logs page view, section views, dwell per section, scroll depth, outbound clicks, mail clicks, résumé page view / PDF open / download, with city and country from Vercel headers and a hashed IP. No raw IP, no cookies for analytics.
- One opaque code per application (`/r/xxxxx`) tells you who came from where and which résumé variant they get. Codes never contain company names.
- Visit `/r/me` once on each of your own devices to be excluded.

## Rules for editing copy
No em dashes anywhere. Employer names stay vague on the site (the résumé is the résumé). One photo, no captions about it. Keep the "who" section of the weekly report honest when data is thin.
