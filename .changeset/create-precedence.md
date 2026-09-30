---
"create-expojet": patch
---

Resolve every create choice once, and stop treating an aborted prompt as an answer

`create.ts` resolved each configuration value twice, once for `--yes` and once for the interactive
prompts, and the two copies had drifted: a boolean shorthand such as `--lucide` beat a config file
value under `--yes` but lost to it interactively. Both paths now share one `resolveChoice`, so the
precedence is stated once — an explicit flag, then a shorthand, then the config file, then the
default, and only an unanswered value reaches a prompt.

Clack signals an abort by resolving to a symbol rather than rejecting. Coercing that symbol to a
boolean, reading its length, or branching on it sees a truthy value and carries on, so cancelling
was not always observable:

- Aborting the Liquid Glass question continued to the plan confirmation and created the project with
  exit code 0 instead of exiting 5.
- Aborting the preset-name question saved a preset literally named `Symbol(clack:cancel)`.

The raw prompt check now has one owner, so no call site can forget it. An interactively saved preset
also keeps `socialProviders` and `analytics` now, which it previously dropped while `--save-preset`
kept them.
