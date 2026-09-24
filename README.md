# raiz-www
Official Website for RAÍZ — https://raizband.com

## Hosting

Deployed on Vercel from the `main` branch (every other branch gets a preview URL).
Right now the site is a static placeholder served from `public/`; this will be
replaced when the design package lands.

- `vercel.json` — clean URLs, `www.raizband.com` → `raizband.com` (301), basic security headers.
- `public/` — static output directory (Vercel serves it as-is, no build step).

## Domain / DNS (raizband.com)

Canonical host is the apex `raizband.com`; `www` redirects to it.

1. In Vercel: **Add New → Project**, import `charliehinojosa/raiz-www`,
   Framework Preset **Other**, leave build/output settings empty, deploy.
2. Project → **Settings → Domains**: add `raizband.com` and `www.raizband.com`.
3. At the registrar, set the records Vercel shows on that page. Typically:

   | Type  | Name  | Value                  |
   |-------|-------|------------------------|
   | A     | `@`   | `76.76.21.21`          |
   | CNAME | `www` | `cname.vercel-dns.com` |

   Vercel may display newer project-specific values — if so, use those.
4. Remove any registrar parking/forwarding records on `@` and `www` (conflicting
   A/AAAA/CNAME records block verification). Leave MX/TXT records alone if the
   domain will be used for email. If there are CAA records, one must allow
   `letsencrypt.org`.
5. Wait for both domains to show **Valid Configuration**; Vercel issues the SSL
   certificate automatically.
