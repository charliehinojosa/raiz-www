# raiz-www
Official website for RAÍZ — https://raizband.com

One static page built with Vite + vanilla TypeScript, deployed on Vercel.
The spec is [`docs/FRD.md`](docs/FRD.md); the design handoff notes are in
[`docs/HANDOFF.md`](docs/HANDOFF.md) and the approved prototype is
`design/prototype-Main.dc.html` (reference only, not served).

## Develop

```sh
npm install
npm run dev       # http://localhost:5173
npm run build     # typecheck + production build to dist/
npm run preview   # serve dist/
```

## Where things live

| Path | What |
|---|---|
| `index.html` | Page markup. `{{tokens}}` and `<!--@blocks-->` are filled from `data/*.json` at build time (see `vite.config.ts`). |
| `data/site.json` | Title, description, release date label, links, trailer ID, copyright |
| `data/platforms.json` | Ticker + logo wall. `url: null` = COMING SOON; paste the album URL to make a cell live. |
| `data/tracks.json` | RAÍZ Radio stations and the LISTEN link |
| `public/assets/` | Images, video, audio, icons, served as-is at `/assets/...` |
| `src/` | `styles.css`, `hero.ts` (video, roots on scroll), `trailer.ts` (modal), `radio.ts` (player) |

### Common edits
- **New streaming link:** set `url` for that platform in `data/platforms.json`.
- **Radio clips:** MP3s live in `public/assets/audio/radio/` (192 kbps, ~−14 LUFS, 1s fades); WAV masters in `media-src/radio/` (not deployed). Add or reorder stations in `data/tracks.json`.
- **Cleaned hero video:** replace `public/assets/video/hero-loop.mp4` (same name and specs).
- **Date label:** `releaseDateLabel` in `data/site.json` fills the hero date, the Listen eyebrow and the trailer header (now "OUT NOW").

Every push to `main` deploys to production; other branches get preview URLs.

## Hosting (Vercel)

`vercel.json` sets the Vite build (`dist/`), redirects `www.raizband.com` → `raizband.com`,
adds security headers and cache headers (hashed bundles in `/static/` are immutable;
`/assets/` caches for an hour so swapped media shows up quickly).

### DNS for raizband.com
Project → **Settings → Domains** lists `raizband.com` and `www.raizband.com`. At the registrar:

| Type  | Name  | Value                  |
|-------|-------|------------------------|
| A     | `@`   | `76.76.21.21`          |
| CNAME | `www` | `cname.vercel-dns.com` |

Use the project-specific values instead if Vercel shows them. Remove registrar parking
records on `@`/`www`, keep MX/TXT if the domain is used for email, and if there are CAA
records one must allow `letsencrypt.org`.
