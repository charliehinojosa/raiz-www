# RAÍZ Site — Handoff for Claude Code

This is everything needed to build the RAÍZ debut-album site as production code. Read this file first, then read `docs/FRD.md`, which is the full spec.

## What's in the package

```
raiz-site-handoff/
├── README.md                     ← you are here (build guide + wiring notes)
├── docs/FRD.md                   ← functional requirements (source of truth for behavior)
├── design/prototype-Main.dc.html ← approved canvas prototype (visual spec, NOT production code)
├── data/
│   ├── site.json                 ← title, meta, links, copyright, trailer id
│   ├── platforms.json            ← logo wall + ticker (url:null = Coming Soon)
│   └── tracks.json               ← RAÍZ Radio stations (placeholder audio)
└── assets/
    ├── img/     raiz-logo-full.png · raiz-logo-wordmark.png · raiz-logo-roots.png (all 760×844)
    │            album-cover-1400.jpg · og-image-1200.jpg
    ├── video/   hero-loop.mp4 (12s, 1080p, silent) · hero-poster.jpg
    ├── audio/   static.mp3 (tuning burst) · placeholders/clip-01…06.mp3
    └── icons/   Simple Icons mono SVGs (CC0) for 7 platforms + license
```

## Recommended stack

The site is one static page with no backend. **Use Vite + vanilla TypeScript, plain CSS and no framework.** Every interaction is small DOM work (a scroll listener, one `<audio>`, one `<dialog>`), and a framework would only add weight to the page. If the repo already has a stack (Astro, Next, Framer export), use that stack instead. The requirements don't change.

- Load `data/*.json` at build time with Vite's JSON imports, so there are no runtime fetches.
- Put `assets/` under `public/` (or import it) so the paths in the JSON still resolve.
- Deploy target: any static host (Vercel, Netlify, Cloudflare Pages).

## Suggested build order

1. Page skeleton, tokens (FRD §5), fonts (Montserrat and Rubik Dirt from Google Fonts with `display=swap`), and the sections as static HTML.
2. The fixed 16:9 video background, with scrims and the VHS overlay (FR-2.x).
3. The roots-on-scroll logo (FR-3.x).
4. The ticker and logo wall, both generated from `platforms.json`.
5. The trailer modal (FR-7.x).
6. RAÍZ Radio (FR-8.x).
7. Responsive pass (FRD §4), reduced-motion pass, accessibility pass, meta/OG.

## Wiring notes & gotchas

### Porting the prototype
- `design/prototype-Main.dc.html` runs on a canvas runtime:
  - `{{hole}}` bindings, `<sc-for>` / `<sc-if>` blocks, and a `DCLogic` class whose `renderVals()` returns state.
  - Map each of those to plain DOM/TS. Don't copy the runtime tags.
- **Class names and CSS values in its `<helmet><style>` block can be reused as they are.**
- The prototype inlines the platform icon paths in JS. In production, read the `icon` path from `platforms.json` and inline the SVG file so it inherits `currentColor`.
- The prototype renders the radio pill and panel as two separate branches. One component with a `data-open` attribute is cleaner.

### Hero video (FR-2)
- **Autoplay on iOS:**
  - Needs `muted` + `playsinline` + `autoplay` in the HTML, **and** `video.muted = true` set in JS before calling `play()`.
  - Catch the `play()` promise rejection and fall back to showing the poster.
- The background is `position: fixed` and exactly `100vw × 56.25vw`.
  - Watch out for `100vw` including the scrollbar width on Windows. Either set `overflow-x: hidden` on `html`/`body`, or measure with `document.documentElement.clientWidth` in a CSS variable.
- The hero height matches (`56.25vw`) so content lines up with the video bottom.
- On mobile (≤760px) the hero becomes `height: auto`: a 56.25vw spacer, then a solid dark copy block.
- The VHS grain is an SVG `feTurbulence`. Render it once and animate only `transform` (it's composited, so it's cheap). **Don't animate `baseFrequency` or `seed`**, because that re-renders the filter every frame.

### Roots on scroll (FR-3)
- The `clip-path: circle()` origin is fixed at `50% 59.5%`, the trunk position in the 760×844 artwork. Keep the three logo PNGs exactly 760×844 or the origin drifts.
- Use a passive `scroll` listener that schedules one `requestAnimationFrame`, and write `style.clipPath` and `style.visibility` directly. Don't run layout reads in the loop.
- The roots layer overlaps the wordmark on purpose. **At rest it must be fully invisible** (`visibility: hidden`), not just clipped to 0.

### Ticker (FR-4)
- Render the platform group **twice** inside the track and animate `translateX(-50%)`. Each group must be wider than the widest viewport or a gap shows. At ~2,000px per group it's fine up to 4K. If platforms are ever removed, repeat the group 3–4× and use `-(100/n)%`.

### Trailer modal (FR-7)
- Use a native `<dialog>` with `showModal()`: it gives you the focus trap, Esc handling and inert background.
  - **Scroll lock:** add `overflow: hidden` on `<html>` while the dialog is open.
  - **Closing:** listen for `close` (Esc included) and `cancel`, then remove the iframe.
  - **Backdrop click:** detect it with `event.target === dialog` on `click`.
- **Create the iframe on open and remove it on close.** Never leave it in the DOM hidden, or the audio keeps playing.
- Use `youtube-nocookie.com` with `autoplay=1&rel=0&playsinline=1`. Autoplay works because the user just clicked.
- **Pause RAÍZ Radio** when the modal opens. Don't auto-resume it when the modal closes.

### RAÍZ Radio (FR-8)
- **One** `HTMLAudioElement` for tracks (`preload="none"`) and **one** for `static.mp3` (volume .35, `preload="auto"`).
- **Autoplay policy:** the first `play()` must happen inside the click handler that opens the pill. Later tunes (next/prev/station/`ended`) are fine because the element has already been activated by that gesture.
- **Tune sequence:**
  1. `static.currentTime = 0; static.play()`
  2. `audio.src = next.src; audio.load()`
  3. `setTimeout(() => audio.play(), 280)`
  4. On `ended`, tune to `(i + 1) % n`.
- **Don't** derive "is playing" from your own flag alone. Listen to the `play` and `pause` events, because a `pause` event also fires just before `ended`. The prototype hit this: auto-advance must call `tune(next)` without checking a "wasPlaying" flag.
- **Progress:** throttle `timeupdate` (it fires about 4×/s, which is fine), or use a rAF loop only while playing.
- **Needle position:** `8% + i × 84% / (n − 1)`.
- **Screen readers:** announce track changes through the `aria-live="polite"` meta block.
- **Nice to have:** Media Session API (FR-8.5).
- **Swapping in real clips:** drop the MP3s in `assets/audio/` and update the `src` values in `tracks.json`. Nothing else changes.

### Logo wall (FR-6)
- Branch on `url`: an `<a>` cell when it's set, a `<div>` "Coming Soon" cell when it's `null`. Adding a platform link should only mean editing the JSON.
- The icons come from **Simple Icons** (CC0), so brand guidelines still apply. They're mono and colored with `currentColor`. There is no Amazon Music icon, so that cell shows the name only.

## Acceptance checklist

- [ ] At scrollY = 0, no root pixels show under the wordmark, and the A's bottom is flush with the Í.
- [ ] Scrolling grows the roots smoothly with no seam where the roots meet the letters, and scrolling up reverses it.
- [ ] The video is 16:9 at every width, never cropped. Sections slide over it. It autoplays muted on iOS Safari.
- [ ] VHS overlay: grain, lines and rolling band are visible at 70% strength. With reduced motion, all of it is static.
- [ ] Ticker is about 40px tall, loops seamlessly with no jump, and pauses on hover.
- [ ] Logo wall: Spotify is live and opens the album in a new tab. The other seven show COMING SOON and aren't focusable.
- [ ] The trailer modal opens from both buttons. Esc, the × button and a backdrop click all close it. Audio stops on close. Focus returns to the button that opened it. RAÍZ Radio pauses when it opens.
- [ ] Radio: opening the pill plays Vivo, and next/prev/station click play static then the new track. The needle slides, tracks auto-advance and wrap, and minimizing keeps playing.
- [ ] Mobile at 390px: no horizontal scroll, hero copy below the video, full-width buttons, 2-column logo wall, full-width radio panel.
- [ ] Lighthouse: Accessibility ≥ 95, Performance ≥ 85 on mobile.

## Open items (need Charlie)

1. Streaming URLs for the other seven platforms.
2. The real radio clips (6 × 20–30s MP3).
3. Confirm the release date (Spotify shows Sept 23, the site says Sept 26) and the release-day copy switch.
4. The cleaned hero video without the painted wall logo. It drops in as the same file.
