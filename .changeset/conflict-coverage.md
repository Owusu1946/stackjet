---
"create-expojet": patch
---

Reject conflicting JSON patch and composition operations

`detectPlanConflicts` claimed ownership for `write-file`, `copy-tree`, `add-dependency`,
`add-env` and `add-script`. `patch-json`, `patch-jsonc`, `compose-metro` and
`compose-app-config` fell through to `default: break` and were never claimed, so two adapters
could patch the same `package.json` or `app.json` pointer, or contribute a conflicting Metro
wrapper, without `executePlan` raising `PlanConflictError`.

`patch-json` and `patch-jsonc` are now claimed per file *and* per JSON pointer, so two owners
writing different pointers in the same file still compose while two owners writing the same
pointer with different values are rejected. Metro contributions are claimed per workspace and
contribution id; app config plugins per workspace and plugin name.

A pointer also collides with anything nested inside it. Replacing `expo` wholesale and then
setting `expo.name` is order-dependent for the same reason, because each edit is applied against
the current text, and a key built from flattened segment text cannot see that. `add-dependency`
and `add-script` now claim their `package.json` pointer too, so a second owner replacing the
whole `dependencies` or `scripts` section is rejected rather than silently winning or losing
depending on adapter order.
