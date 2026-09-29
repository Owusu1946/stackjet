---
"@expojet/docs": patch
---

Make the Stack Builder usable with a screen reader and a keyboard

`/builder` rendered no `<h1>` at all: sixteen `<h2>` section headings and no page heading. The
Configure/Preview and Files/Code switches declared `role="tablist"`/`role="tab"` without
`aria-controls`, a `tabpanel`, or arrow-key roving tabindex, so the markup promised a keyboard
contract it did not implement. The package-manager and category controls carried state only as
`data-active`, which assistive technology cannot read. File-tree folders toggled with no
`aria-expanded`. The project-name and preset fields wrapped their hint text inside the `<label>`,
so the input was announced as "Project name Folder: my-app". Most controls set
`border: 0; background: transparent` and relied on the UA default focus ring, which disappears
against the tinted active state.

Now: a real `<h1>`, `aria-pressed` on every toggle, `aria-expanded` on folders,
`aria-labelledby`-style `<label for>` for the two fields, a `<legend>` for the package-manager
fieldset, and one shared `:focus-visible` ring across the builder.

The reduced-motion block named two classes that do not exist anywhere in the repo
(`.site-menu-backdrop`, `.site-menu-drawer`), so nothing it targeted was ever disabled. It is now
a single global `*` override.
