---
"@expojet/docs": patch
---

Stop the Stack Builder from emitting a command the generator rejects

Switching the Builder from a monorepo back to standalone cleared the database but left the ORM
selected, producing `--database none --orm drizzle`. The generator rejects that combination
("Cannot select an ORM when database is 'none'"), so the copied command failed and the Preview
tab was replaced by a dead-end panel reading only "Invalid builder configuration".

`select()`, `removeChoice()` and `applyPreset()` now share one `normalize()` step that keeps a
configuration inside the combinations the create schema accepts. `applyPreset()` previously
wrote the preset straight into state, bypassing normalisation entirely.

Also in this change:

- Removing the Sentry chip did nothing, because `removeChoice()` had no `monitoring` branch and
  `canRemoveChoice("monitoring")` returns true, so the button rendered and silently failed.
- The preview request already received Zod `issues` from the API route but discarded them. They
  are now surfaced, so a rejected configuration names the offending field.
- A failed refresh no longer replaces the whole preview with an error page. The last good tree
  stays on screen and the message appears inline in the toolbar.
