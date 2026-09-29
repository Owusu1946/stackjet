---
"@expojet/core": patch
---

Detect conflicting JSON patch and composition operations

`detectPlanConflicts` claimed ownership for `write-file`, `copy-tree`, `add-dependency`,
`add-env` and `add-script`. `patch-json`, `patch-jsonc`, `compose-metro` and
`compose-app-config` fell through to `default: break` and were never claimed, so two adapters
could patch the same `package.json` or `app.json` pointer, or contribute a conflicting Metro
wrapper, without `executePlan` raising `PlanConflictError`.

`patch-json` and `patch-jsonc` are now claimed per file *and* per JSON pointer, so two owners
writing different pointers in the same file still compose while two owners writing the same
pointer with different values are rejected. Metro contributions are claimed per workspace and
contribution id; app config plugins per workspace and plugin name.

Overlapping JSON writes are order-dependent because `jsonc-parser` applies each edit against
the current text, so rejecting them up front is the difference between a clear error and a plan
that renders differently depending on adapter ordering.
