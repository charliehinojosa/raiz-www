# RAÍZ — Debut Album Website
## Functional Requirements Document (FRD) — v2

**Owner:** Charlie Hinojosa · Sightbox Records / Sightbox Studios
**Status:** Design approved in the Claude Design canvas "RAÍZ Band Website" (prototype v27). Ready to build.
**Release target:** Live before the public release, **Sept 26, 2026**
**Last updated:** Sept 24, 2026

> The canvas prototype is included as `design/prototype-Main.dc.html`. It is the visual and behavioral source of truth, including exact colors, sizes and timings. It uses a proprietary template runtime (`{{holes}}`, `<sc-for>`, `<sc-if>`, `class Component extends DCLogic`), so read it as a spec. **Do not port it literally.**

---

## 1. Purpose

A single-page site for RAÍZ ("Christian alt-rock with Latin roots"). The page has four jobs:

1. Introduce a band no one has heard of yet.
2. Announce the self-titled debut album.
3. Send visitors to streaming platforms.
4. Let visitors preview songs (RAÍZ Radio) and watch the trailer.

---

## 2. Page structure (top to bottom)

| # | Section | Anchor | Summary |
|---|---|---|---|
| 1 | Header / nav | — | Full logo on the left; Album · Listen · Trailer · Instagram on the right |
| 2 | Hero | `#top` | Fixed 16:9 looping video with a VHS overlay, logo whose roots grow on scroll, date, two CTAs |
| 3 | Streaming ticker | — | Thin orange strip: "The debut album streaming on …" |
| 4 | Meet RAÍZ | `#album` | Album cover, band intro copy, fact row, "Tune in to RAÍZ Radio" button |
| 5 | Listen | `#listen` | Logo wall of streaming platforms (live or Coming Soon) |
| 6 | Footer | — | Logo, Instagram and YouTube links, copyright |
| — | Trailer modal | — | YouTube trailer in an overlay |
| — | RAÍZ Radio | — | Floating preview player, bottom-right |

---

## 3. Functional requirements

### 3.1 Header / nav
- **FR-1.1** The header sits over the hero video. It is not sticky. Height is `clamp(64px, 6.5vw, 96px)`.
- **FR-1.2** Left side: the full logo (`raiz-logo-full.png`), linking to `#top`. Height is `clamp(34px, 3.6vw, 52px)`.
- **FR-1.3** Right side, in order:
  - **Album** → `#album`
  - **Listen** → `#listen`
  - **Trailer** → a `<button>` that opens the trailer modal (§3.7)
  - **Instagram icon + "@raizbandmusic"** → `https://instagram.com/raizbandmusic`, opens in a new tab
- **FR-1.4** At ≤760px, hide Album, Trailer and the "@raizbandmusic" text. Keep Listen and the Instagram icon.

### 3.2 Hero — video background
- **FR-2.1** Video: `assets/video/hero-loop.mp4` (12s, 1920×1080, 24fps, H.264, silent, faststart), with poster `hero-poster.jpg`. Attributes: `autoplay muted loop playsinline preload="auto"`. Also set `el.muted = true` in JS and call `play()`, because React-style renderers don't always reflect the `muted` attribute, and without it iOS blocks autoplay.
- **FR-2.2** The background layer is `position: fixed; top: 0; left: 0; width: 100vw; height: 56.25vw`. It is **always 16:9 at full width**, never cropped to viewport height. Every section after the hero has a solid background and scrolls up over the video.
- **FR-2.3** The hero section is `height: 56.25vw`. It is transparent, so the video shows through.
- **FR-2.4** Two scrims sit over the video:
  - left gradient: `linear-gradient(90deg, rgba(20,14,11,.9) 0%, rgba(20,14,11,.7) 32%, rgba(20,14,11,.1) 60%, transparent 100%)`
  - top/bottom gradient: `linear-gradient(180deg, rgba(20,14,11,.6) 0%, transparent 22%, transparent 80%, rgba(20,14,11,.55) 100%)`
- **FR-2.5 VHS overlay** (locked). It sits between the video and the scrims, and the whole group is at `opacity: .7`.
  - **Grain:** an inline SVG with `<feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch">` + `<feColorMatrix type="saturate" values="0">` filling a rect. The SVG is 200% × 200% offset by −50%, with `mix-blend-mode: overlay` and opacity .35. It is jittered with `@keyframes` translate in `steps(6)` over .6s.
  - **Scanlines:** `repeating-linear-gradient(180deg, rgba(0,0,0,.45) 0 1px, transparent 1px 3px)` at opacity .55.
  - **Rolling band:** 22% tall, starting at `top: -24%`, a faint cream gradient (peak alpha .09) moving `translateY(0 → 580%)` over 6.5s, linear, infinite.
  - **Video filter:** `saturate(1.3) contrast(1.06) blur(.6px)`.
- **FR-2.6** Hero content is left-aligned and vertically centered:
  1. `<h1>`: the logo with growing roots (§3.3)
  2. "THE DEBUT ALBUM" (cream, 14px, tracked caps) + **"SEPT 26"** (accent, 900 weight, `clamp(28px, 2.8vw, 40px)`)
  3. Primary CTA **LISTEN SEPT 26** (accent background, dark text) → `#listen`
  4. Secondary CTA **WATCH THE TRAILER** (outlined, play icon) → opens the trailer modal
- **FR-2.7** Hero sizes use `clamp()` so the content fits inside the 16:9 hero down to ~900px wide. At ≤760px, see §4.

### 3.3 Logo — growing roots
- **FR-3.1** The hero logo is two stacked PNGs of the same size (760×844). Wrapper: `aspect-ratio: 760/844; width: clamp(160px, 24vw, 360px)`; 200px wide on mobile.
  - `raiz-logo-wordmark.png`: letters only. The bottom of the A is hand-cleaned so it sits on the same baseline as the Í.
  - `raiz-logo-roots.png`: the roots. It **overlaps a few pixels up under the letters' lower edge** on purpose, to avoid a see-through seam. Do not "fix" that overlap.
- **FR-3.2** **At rest (scrollY = 0) no part of the roots is visible.** Initial CSS: `clip-path: circle(0% at 50% 59.5%); visibility: hidden`.
- **FR-3.3** On scroll:
  - `t = clamp(scrollY / max(240, innerWidth × 0.5625 × 0.55), 0, 1)`
  - `e = 1 − (1 − t)²` (ease-out quad)
  - `clip-path: circle(e × 50% at 50% 59.5%)`
  - `visibility` is `visible` when `t > 0.005`, otherwise `hidden`
  - It reverses when scrolling back up. Use a passive scroll listener plus `requestAnimationFrame`, and recompute on resize.
- **FR-3.4** With `prefers-reduced-motion: reduce`, the roots are shown fully grown and static.
- **FR-3.5** The header and footer use `raiz-logo-full.png` (static, roots included).

### 3.4 Streaming ticker
- **FR-4.1** A full-width strip between the hero and Meet RAÍZ.
  - **Background and borders:** accent `#FF4A1C` background, with a 2px `#1A1411` rule above and below.
  - **Height:** about **40px** on desktop. Vertical padding is `clamp(7px, .6vw, 9px)` and line-height is 1.
- **FR-4.2** Content:
  - **Lead:** **"The debut album streaming on"** in Rubik Dirt, uppercase, `clamp(14px, 1.15vw, 17px)`.
  - **Platforms:** every platform name from `data/platforms.json` in Montserrat 900, uppercase, `clamp(11px, .9vw, 13px)`, with .06em tracking.
  - **Separators:** 5px dark dots between the names.
- **FR-4.3** Seamless right-to-left loop: the track holds the same group twice and animates `translateX(0 → −50%)` over 38s, linear, infinite. It pauses on hover.
- **FR-4.4** It is static with reduced motion. The moving track is `aria-hidden`. The strip itself has `role="marquee"` and an `aria-label` listing every platform.

### 3.5 Meet RAÍZ (`#album`)
- **FR-5.1** Solid `#1A1411` background. The album cover (square, 6px radius, large soft shadow) sits beside the copy on desktop. At ≤760px it stacks, with the cover at full width.
- **FR-5.2** Copy, verbatim:
  - **Eyebrow** (accent, tracked caps): `MEET RAÍZ`
  - **Tagline** (Rubik Dirt, uppercase, `clamp(28px, 3vw, 44px)`): `Where it all started. Donde todo empieza.`
  - **Body** (18px, line-height 1.6, cream at 82%; 16px on mobile):
    1. **RAÍZ is Christian alt-rock with Latin roots.** Overdriven electric guitar carries the hook, congas and timbales drive the groove, and one voice sings it all in two languages. Think Santana and Maná colliding with ’90s alt-rock.
    2. The songs switch between English and <span lang="es">español</span> the way bilingual families actually talk, mid-sentence and without translating.
    3. <span lang="es">Raíz</span> means *root*. The self-titled debut goes back to where faith starts, and it’s out everywhere **September 26**.
  - **Fact row** (a hairline on top, key/value pairs): `SOUND` Latin alt-rock · `LANGUAGE` English + Español
  - **Button:** outlined **TUNE IN TO RAÍZ RADIO** with a radio icon. It opens RAÍZ Radio and starts playback (§3.8).

### 3.6 Listen (`#listen`) — logo wall
- **FR-6.1** Cream `#F5EFE3` background.
  - **Eyebrow:** `AVAILABLE EVERYWHERE · SEPT 26` (`#B8330F`)
  - **Heading:** `Listen to RAÍZ` (Montserrat 900)
  - **Side note:** `Pick your platform. Escúchalo donde quieras.` (Rubik Dirt, `#4A3F37`)
- **FR-6.2** Logo wall. Grid with 1px hairlines (`rgba(26,20,17,.16)`) between the cells and no card boxes:
  - **Columns:** 4 on desktop, 2 at ≤1000px.
  - **Cells:** min-height 150px (112px on mobile).
  - **Content:** each cell shows the platform's **mono icon (30px, ink color) + name** (Montserrat 800, 20px), with a status tag underneath.
- **FR-6.3** The wall is driven by `data/platforms.json`:
  - **`url` set → live cell.** The whole cell is an `<a target="_blank" rel="noopener">` with `aria-label="Listen to RAÍZ on {name}"` and the tag **LISTEN →** in `#B8330F`. On hover the cell turns white and the icon scales to 1.08.
  - **`url: null` → Coming Soon cell.** A non-interactive `<div>`, logo at 40% opacity, tag **COMING SOON** in `#6B5F55`.
  - **No `icon`** (Amazon Music) → the name only.
- **FR-6.4** Only Spotify is live right now. Charlie will send the other links as they go live, and adding one should only mean editing the JSON.

### 3.7 Trailer modal
- **FR-7.1** It opens from the hero **WATCH THE TRAILER** button and the nav **Trailer** button. Both are real `<button>` elements. Opening it **pauses RAÍZ Radio**.
- **FR-7.2** Layout and style:
  - **Backdrop:** covers the whole viewport, `rgba(10,7,5,.88)`, and closes the modal on click.
  - **Box:** centered, up to 1120px wide.
  - **Header row:** `OFFICIAL TRAILER · SEPT 26` (the date in accent) and a round 44px close button (×, `aria-label="Close trailer"`).
  - **Video frame:** 16:9, 8px radius.
  - **Opening animation:** scale in over .25s, skipped with reduced motion.
- **FR-7.3** **Embed the YouTube player** (the prototype could only show a poster, because the canvas blocks iframes). Create the iframe when the modal opens:

```html
<iframe src="https://www.youtube-nocookie.com/embed/RUbaCzaXmBw?autoplay=1&rel=0&playsinline=1"
  title="RAÍZ — Official Trailer" allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
  allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>
```

- **FR-7.4** It closes on the close button, a click on the backdrop, or **Esc**.
- **FR-7.5** Closing it **removes the iframe from the DOM** so audio stops.
- **FR-7.6** Dialog accessibility:
  - `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the header text.
  - Focus moves to the close button on open and is trapped inside the dialog.
  - Page scroll is locked while it's open.
  - Focus returns to the button that opened it when it closes.

  Using a native `<dialog>` with `showModal()` is fine.

### 3.8 RAÍZ Radio (preview player)
- **FR-8.1 Collapsed:**
  - **Pill:** fixed at **bottom-right** (16px; 12px on mobile), min-height 48px. It shows a radio icon, "RAÍZ RADIO" and an on-air dot. The dot is cream at 30% when stopped and accent with a pulsing ring (1.6s) when playing.
  - **Accessible name:** "Open RAÍZ Radio, preview tracks from the album".
- **FR-8.2 Open:** clicking the pill opens the tuner **and starts playing immediately**. The click itself satisfies the browser's autoplay rules. The tuner is a panel 360px wide, fixed bottom-right. On mobile it spans the bottom edge (`left/right/bottom: 8px`). Contents, top to bottom:
  1. **Top row:** on-air dot + "RAÍZ RADIO" + "ON AIR" or "OFF AIR", and a minimize chevron (44px, `aria-label="Minimize radio"`) that goes back to the pill **without stopping playback**.
  2. **Dial:** 58px tall.
     - **Tick marks:** minor every 8px, major every 40px.
     - **Stations:** one button per track, labelled with its frequency (e.g. `88.1`), spread from 8% to 92% across the dial. Clicking a station tunes to it.
     - **Needle:** a 2px accent line with a glow that moves to the active station with `transition: left .5s cubic-bezier(.3, 1.4, .5, 1)` (a slight overshoot).
  3. **Meta:** `TRACK 01 / 06 · 88.1 FM` above the title in Rubik Dirt, 28px, uppercase. This block is `aria-live="polite"`.
  4. **Progress:** a 3px bar showing `currentTime / duration`.
  5. **Controls:** Prev (44px) · Play/Pause (56px, accent) · Next (44px) · a **LISTEN** link that goes to `listenUrl` in `data/tracks.json`.
- **FR-8.3 Behavior:**
  - Use **one** `<audio>` element for the tracks and **one** for `assets/audio/static.mp3`, at volume .35.
  - **Tuning** (prev, next, station click, or a track ending): play the static burst, set the new `src`, call `load()`, then `play()` after about **280ms** so the static comes first. Tuning always plays.
  - The next track starts automatically when one ends, and after the last it loops back to the first.
  - Opening the trailer pauses the radio.
  - The radio stays mounted, and keeps playing, while the page scrolls.
- **FR-8.4 Data:** `data/tracks.json`. The current tracks are Vivo, I Speak Jesus, Abuela, Tres, 3:33 and La Lucha, and **the audio files are placeholders**. Real clips are **20–30s** from the hook or chorus, MP3 at 192kbps, loudness-normalized to about −14 LUFS, with 1s fades in and out.
- **FR-8.5 Nice to have:** set `navigator.mediaSession` metadata (title, artist "RAÍZ", album "RAÍZ", artwork = the album cover) with previoustrack/nexttrack/play/pause handlers, so lock-screen and keyboard media keys work.
- **FR-8.6** With reduced motion, turn off the needle transition, the dot pulse and the panel entrance animation.

### 3.9 Footer
- **FR-9.1** `#1A1411` background. From left to right: the full logo (64px tall), the links **INSTAGRAM** (`https://instagram.com/raizbandmusic`) and **YOUTUBE** (`https://www.youtube.com/@raizband`), both opening in a new tab, and **© 2026 Sightbox Records**.
- **FR-9.2** At ≤760px it stacks into one left-aligned column.

---

## 4. Responsive behavior

| Breakpoint | Behavior |
|---|---|
| > 1000px | Desktop: 16:9 hero with content over the video, 4-column logo wall |
| ≤ 1000px | Logo wall drops to 2 columns |
| ≤ 760px | The video sits at the top as a 16:9 strip under the header. The hero copy (logo 200px, date, **full-width** buttons) moves **below** the video onto a dark `#1A1411` block with a shadow above it, and that block scrolls up over the video. The left scrim is hidden. Nav is reduced (FR-1.4). Meet RAÍZ stacks. The radio panel spans full width. The footer stacks. |

- No horizontal scroll at any width down to 320px. Touch targets are ≥44px.

---

## 5. Visual system

| Token | Value |
|---|---|
| Ink (background) | `#1A1411` |
| Ink (scrims) | `rgba(20,14,11,·)` |
| Cream (text / logo) | `#F5EFE3` |
| Accent | `#FF4A1C` |
| Accent text on cream | `#B8330F` |
| Muted text on cream | `#4A3F37`, `#6B5F55` |
| UI / display font | **Montserrat** 500/600/800/900 (Google Fonts) |
| Grit font | **Rubik Dirt** (Google Fonts), always uppercase |
| Buttons | Pill (999px radius), `clamp(48px, 3.9vw, 56px)` tall, 800 weight, .14em tracking |

---

## 6. Content & data

- **Album tracklist (final, per Spotify):** 1 Vivo · 2 I Speak Jesus · 3 Abuela · 4 Montaña · 5 Tres · 6 Amigo · 7 Begotten · 8 So Low · 9 3:33 · 10 Ama · 11 La Lucha
- **Spotify album:** https://open.spotify.com/album/6lm4CHNWQsehPuMMojewMa
- **Trailer:** YouTube `RUbaCzaXmBw`
- **YouTube channel:** https://www.youtube.com/@raizband
- **Instagram:** @raizbandmusic
- Everything editable lives in `data/site.json`, `data/platforms.json` and `data/tracks.json`.

---

## 7. Accessibility

- Every control is a real `<a href>` or `<button>`. Icon-only controls have an `aria-label`.
- Text contrast is ≥ 4.5:1, or 3:1 at 24px and above.
- The video, VHS overlay and moving ticker track are `aria-hidden`.
- All motion respects `prefers-reduced-motion`: roots growth, VHS overlay, ticker, modal, and the radio needle, dot and panel.
- The page is `lang="en"`. Spanish phrases are wrapped in `<span lang="es">`.

---

## 8. Non-functional

- **Performance:**
  - Hero LCP < 2.5s on 4G, with the poster showing immediately.
  - Lazy-load the album cover and platform icons.
  - Radio audio uses `preload="none"`; the static burst can preload.
- **SEO / social:**
  - `<title>` RAÍZ — The Debut Album, plus the meta description from `site.json`.
  - Open Graph and Twitter card using `assets/img/og-image-1200x630.jpg`.
  - Optional `MusicAlbum` JSON-LD.
- **Browsers:** the latest two versions of Chrome, Safari (macOS and iOS), Firefox and Edge.

---

## 9. Open items

1. **Streaming links:** only Spotify is live. The other seven show Coming Soon until their URLs are added to `platforms.json`.
2. **Radio clips:** replace the placeholder audio with the real 20–30s clips (see FR-8.4).
3. **Release date:** Spotify metadata shows **Sept 23, 2026** while the site says **Sept 26**. Confirm with Charlie. On the public release day, switch "LISTEN SEPT 26" and "AVAILABLE EVERYWHERE · SEPT 26" to "Out now" wording.
4. **Hero video:** the RAÍZ logo painted on the church wall still shows faintly behind the scrim. A cleaned video will replace `hero-loop.mp4` later, with the same filename and specs.
5. **Amazon Music icon:** no mono icon is available. The name shows alone unless Charlie provides an official asset.
