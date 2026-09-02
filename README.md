# rayidali.com

Personal site. Next.js App Router on Vercel, a Y2K desktop over a three.js New York.

## Run
```
npm install
cp .env.example .env.local   # fill in keys
npm run dev
```

## Where things are
- `lib/desktop.html` is the page. `components/Desktop.tsx` makes it move (boot, terminal, drag, three.js, tracking).
- `components/Analytics.tsx`: PostHog (cookieless, proxied at `/ingest`), Microsoft Clarity behind consent, ref-code capture.
- `app/api/track`: first-party events to Supabase. `app/r/[code]`: tracked entry links. `app/resume`: tracked résumé with per-ref variants.
- `app/admin`: magic-link login (ADMIN_EMAIL only), visit log, ref codes, résumé variants.
- `supabase/schema.sql`: run once in the Supabase SQL editor.

## Rules
No em dashes. Employer names stay vague. One photo. Companies are labeled by opaque ref codes, never in URLs.
