---
"@expojet/core": patch
---

Render a plan through one implementation, not two

`executePlan` (disk) and `materializePlan` (in-memory, used by the docs Stack Builder) each
implemented all nine operation cases independently, along with duplicated `updateJsonText`,
`writeJson` and package.json helpers. Nothing kept them in step.

Both now go through `applyPlan`, so divergence is structurally impossible rather than a review
check. The in-memory preview is what people see on the builder page; a divergence meant the builder
could show a project the generator would not produce.

Also reorganised the package so related things live together: `doctor/` (checks, env, and the mobile
secret boundary), `apply/` (the plan applier). `index.ts` lists the public surface explicitly
instead of `export *`, so an internal helper no longer silently widens what `adapters` and `cli`
compile against. The preset store's sync and async variants now share pure parse/serialise helpers
instead of two copies of the rules.
