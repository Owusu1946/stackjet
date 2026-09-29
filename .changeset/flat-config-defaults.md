---
"@expojet/schemas": patch
"create-expojet": patch
---

Keep `--config` files and saved presets partial instead of filling in every default

`createConfigSchema` was derived from the defaulted create schema with `.partial()`. Zod wraps a
field in `ZodOptional` but leaves the inner default in place, so parsing a config file produced a
fully-populated configuration. Every omitted key then outranked both `--preset` and the CLI
fallbacks, and the interactive prompts stopped appearing whenever `--config` was used.

A one-line config file now behaves as documented:

```json
{ "structure": "monorepo" }
```

```console
# before: Database: none, ORM: none
# after:  Database: neon, ORM: drizzle
```
