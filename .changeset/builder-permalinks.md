---
"@expojet/docs": patch
---

Put the Stack Builder's configuration in the URL

`/builder` kept every choice in `useState`. Reloading the page lost the whole configuration, and
there was no way to bookmark, share, or open a configured stack on a phone — even though the page's
entire output is something you take away and use elsewhere.

State now lives in the query string via `nuqs`, so each configuration has a permanent link. Only
non-default values are written, so the default stack stays at a clean `/builder`. A "Copy link"
button copies the readable form, alongside the existing "copy the command".

Parameter names are short (`layout`, `db`, `glass`, `dark`) and readable, and they are the keys of
the parser map itself rather than a renaming layer, so reading and writing share one spelling.
Every literal parser also validates, so a hand-edited `?auth=admin` or `?sdk=99` falls back to the
default instead of reaching the generator as an unsupported value.
