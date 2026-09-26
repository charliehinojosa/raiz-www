import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const root = import.meta.dirname;
const readJson = (file: string) => JSON.parse(readFileSync(resolve(root, file), 'utf8'));

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The ticker track holds this many copies of the platform group and animates by
 * -(100 / TICKER_COPIES)% (see --tick-shift in styles.css), so there is never a
 * gap even on very wide screens.
 */
const TICKER_COPIES = 4;

interface Platform { id: string; name: string; icon: string | null; url: string | null }
interface Track { title: string; freq: string; src: string }

/** Read a Simple Icons SVG from public/ and re-emit it as a currentColor inline icon. */
function inlineIcon(iconPath: string, cls: string): string {
  const svg = readFileSync(resolve(root, 'public', iconPath), 'utf8');
  const paths = [...svg.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map((m) => `<path d="${m[1]}"/>`);
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">${paths.join('')}</svg>`;
}

/**
 * Renders the data-driven parts of index.html (ticker, logo wall, radio stations,
 * meta) from data/*.json at build time, so the page works without JS and editing
 * the JSON is all it takes to change them.
 */
function siteData(): Plugin {
  return {
    name: 'raiz-site-data',
    configureServer(server) {
      server.watcher.add(resolve(root, 'data'));
      server.watcher.on('change', (file) => {
        if (file.startsWith(resolve(root, 'data'))) server.ws.send({ type: 'full-reload' });
      });
    },
    transformIndexHtml: {
      // Run before Vite's own HTML processing so injected asset URLs are resolved normally.
      order: 'pre',
      handler(html) {
        const site = readJson('data/site.json');
        const { platforms } = readJson('data/platforms.json') as { platforms: Platform[] };
        const { tracks, listenUrl } = readJson('data/tracks.json') as { tracks: Track[]; listenUrl: string };

        const names = platforms.map((p) => p.name);
        const tickerLabel = `The debut album streaming on ${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
        const tickerGroup =
          `<div class="rz-ticker-group"><span class="rz-ticker-lead">The debut album streaming on</span>` +
          names.map((n) => `<span class="rz-ticker-sep"></span><span class="rz-ticker-item">${esc(n)}</span>`).join('') +
          `<span class="rz-ticker-sep"></span></div>`;

        const wall = platforms
          .map((p) => {
            const logo = `<span class="rz-cell-logo">${p.icon ? inlineIcon(p.icon, 'rz-cell-icon') : ''}<span>${esc(p.name)}</span></span>`;
            return p.url
              ? `<a class="rz-cell" href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="Listen to RAÍZ on ${esc(p.name)}">${logo}<span class="rz-cell-tag rz-cell-tag-live">LISTEN →</span></a>`
              : `<div class="rz-cell rz-cell-soon">${logo}<span class="rz-cell-tag">COMING SOON</span></div>`;
          })
          .join('\n');

        const n = tracks.length;
        const pos = (i: number) => `${8 + (i * 84) / Math.max(1, n - 1)}%`;
        const stations = tracks
          .map(
            (t, i) =>
              `<button type="button" class="rz-station${i === 0 ? ' rz-station-on' : ''}" style="left:${pos(i)}" data-i="${i}" aria-label="Tune to ${esc(t.title)}, ${esc(t.freq)} FM">${esc(t.freq)}</button>`,
          )
          .join('');

        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'MusicAlbum',
          name: 'RAÍZ',
          url: site.url,
          image: `${site.url}/assets/img/album-cover-1400.jpg`,
          byArtist: { '@type': 'MusicGroup', name: 'RAÍZ', sameAs: [site.links.instagram, site.links.youtubeChannel] },
          albumProductionType: 'https://schema.org/StudioAlbum',
          albumReleaseType: 'https://schema.org/AlbumRelease',
          recordLabel: { '@type': 'Organization', name: site.labelName, url: site.links.label },
        };
        const live = platforms.filter((p) => p.url).map((p) => p.url);
        if (live.length) Object.assign(jsonLd, { sameAs: live });

        const vars: Record<string, string> = {
          title: esc(site.title),
          description: esc(site.description),
          url: esc(site.url),
          dateLabel: esc(site.releaseDateLabel),
          instagram: esc(site.links.instagram),
          youtubeChannel: esc(site.links.youtubeChannel),
          trailerUrl: esc(site.links.trailer),
          // The label name inside the copyright line links to the label's site.
          copyright: esc(site.copyright).replace(
            esc(site.labelName),
            `<a href="${esc(site.links.label)}" target="_blank" rel="noopener">${esc(site.labelName)}</a>`,
          ),
          tickerLabel: esc(tickerLabel),
          listenUrl: esc(listenUrl),
        // In-page anchors (e.g. "#listen") stay in the tab; external links open a new one.
        listenTarget: listenUrl.startsWith('#') ? '' : ' target="_blank" rel="noopener"',
          trackCount: String(n).padStart(2, '0'),
          firstTitle: esc(tracks[0].title),
          firstFreq: esc(tracks[0].freq),
          firstSrc: esc('/' + tracks[0].src),
        };

        return html
          .replace('<!--@ticker-->', tickerGroup.repeat(TICKER_COPIES))
          .replace('<!--@wall-->', wall)
          .replace('<!--@stations-->', stations)
          .replace('<!--@jsonld-->', `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`)
          .replace(/\{\{(\w+)\}\}/g, (m, k: string) => vars[k] ?? m);
      },
    },
  };
}

export default defineConfig({
  plugins: [siteData()],
  build: {
    // public/assets holds the handoff media; keep Vite's hashed bundles separate.
    assetsDir: 'static',
  },
});
