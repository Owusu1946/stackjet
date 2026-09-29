---
"@expojet/docs": patch
---

Stop every docs page except `/changelog` from declaring the site root as canonical

`src/app/layout.tsx` set `alternates: { canonical: "/" }` at the root. Every route that did not
override it inherited it, so `/builder` and all 30 docs pages told search engines they were
duplicates of the homepage. The root layout no longer sets a canonical; the home page, `/builder`,
`/changelog`, and the docs page's `generateMetadata` each declare their own.

Also in this change:

- `icons.apple` pointed at an SVG, which iOS ignores for a home-screen icon. Added a real
  180×180 `apple-touch-icon.png` and a 512×512 `icon-512.png`, both rasterised from the existing
  `site-icon.svg`.
- Added a `viewport` export with light and dark `theme-color`, so the browser chrome follows the
  colour scheme instead of only picking up `theme_color` from the web manifest.
- Added a `twitter.title` template and per-page Twitter blocks, so doc cards no longer all share
  the flat root title and the site-wide OG image.
- `og:title` on `/builder` was the root default; it now reads "Stack Builder".
- `sitemap.ts` used `new Date()` per request, marking the whole site freshly modified on every
  rebuild. It is now a module-scope build timestamp.
- The web manifest listed only an SVG icon, so Android had no PNG candidate. Added the 512 PNG.
- "View source on GitHub" linked to `content/docs/...` at the repo root; the MDX collection lives
  at `apps/docs/content/docs/...`, so the link 404'd on every docs page.
