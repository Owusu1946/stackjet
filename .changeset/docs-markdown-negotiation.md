---
"@expojet/docs": patch
---

Restore the markdown representations of the documentation

`proxy.ts` sat at the package root. Next only registers the proxy when the file is at the same
level as `app`, which for this project is `src/proxy.ts`, so neither the `/docs/*.md` rewrite nor
the `Accept: text/markdown` content negotiation was ever active and every docs request was served
the HTML page.

Moved to `src/proxy.ts`. `/docs/<slug>` now answers with `text/markdown` when the request prefers
it and sends `Vary: Accept`, and `/docs/<slug>.md` returns the markdown source.
