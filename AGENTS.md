# Expojet

This repository is named `stackjet`. The product, CLI, packages, generated manifest, and user-facing copy use the Expojet name. Keep that distinction clear. Do not reintroduce `StackJET` or `Stackjet` as product branding.

Expojet is an Expo-first project generator. It turns one validated configuration into either an Expo SDK 57 app or a full-stack TypeScript workspace. The generator combines a checksum-verified base pack with declarative adapters, checks the rendered tree, then moves it into place atomically.

## What must stay true

These constraints matter more than local convenience.

### Generation is deterministic

The same input and SDK pack must produce the same files. Do not fetch templates or dependency versions while building a generation plan. Do not make generated output depend on machine-specific state, timestamps, or network responses.

The SDK 57 template in `packages/sdk-packs/sdk-57/template` is the canonical base. Changes to it must go through `pnpm sdk:sync`, which updates the generated TypeScript module and SHA-256 checksum. Never edit `template.generated.ts` by hand.

### Adapters describe changes

Adapters return typed `Operation[]` values. They do not write files, run package managers, prompt users, or mutate shared state. `packages/core/src/executor.ts` owns filesystem writes and applies the completed plan.

If an integration cannot fit the current operation model, improve the operation model first. Do not hide imperative work inside an adapter.

### Generation is atomic

Render into the unique sibling staging directory created by the executor. Validate there, then commit with a rename. On failure or dry run, remove only that staging directory. Never leave a target half-generated and never clean an existing target to make generation succeed.

All plan paths must pass through the core path guards. Generated trees cannot contain symlinks or unresolved Expojet template tokens.

### Mobile code never receives server secrets

Code under a generated mobile workspace cannot contain database URLs, service-role keys, auth secrets, or backend-only environment modules. Variables intentionally exposed to Expo code must start with `EXPO_PUBLIC_`.

Keep database drivers, migrations, and server credentials inside `apps/api` for generated monorepos. Shared packages may contain types, not backend runtime imports.

### Branding has one owner

Product names, commands, manifest filenames, package names, and taglines come from `@expojet/brand`. Do not hardcode Expojet identity in generator logic or adapter output when the brand package already owns the value.

## A note on taste

Prefer the smallest model that makes correct output unsurprising. Expojet already has many combinations. A new abstraction has to remove more branching than it adds.

Generated code is the product. A tidy adapter that emits awkward app code is still a bad change. Read the generated files as if you had just started a real project with them. Dependencies should make sense, setup should be visible, and unsupported combinations should fail before any files are written.

Do not preserve complexity because it exists. Do not add a framework-shaped layer for one integration. Make the constraint explicit, put it in the narrowest package that can own it, and keep the rest of the pipeline boring.

## Shared language

Use these terms consistently in code, docs, and reviews:

- **input** is the validated `CreateInput` that describes one requested project.
- **SDK pack** is a versioned, checksum-verified Expo base template.
- **adapter** is a declarative integration for auth, styling, navigation, backend, database, or another project choice.
- **operation** is one typed file, JSON, dependency, environment, Metro, or app-config change.
- **plan** is the destination plus the complete ordered list of operations.
- **executor** detects conflicts, renders a plan, validates the result, and commits it.
- **staging directory** is the temporary sibling directory used before the atomic rename.
- **manifest** is the generated `expojet.jsonc` record of SDK, structure, adapters, and feature choices.
- **fixture** is a checked-in reference project for a supported configuration.
- **stable adapter** is available through the normal CLI flow.
- **experimental adapter** requires explicit opt-in and has an incomplete promotion gate.

## The easiest ways to break Expojet

1. **Write from an adapter.** Direct filesystem access bypasses conflict detection, dry-run behavior, path guards, and atomic cleanup.
2. **Change one layer of a choice.** Adding a schema enum without CLI flags, prompts, adapter dispatch, doctor checks, fixtures, and docs produces a choice that only partly exists.
3. **Patch generated files from several owners.** Overlapping writes become order-dependent. Use the JSON, dependency, Metro, and app-config composition operations. Let conflict detection reject ambiguous ownership.
4. **Leak a backend value into mobile code.** An environment variable name alone can become public bundle content. Keep the boundary explicit and run the doctor checks against generated output.
5. **Edit SDK pack artifacts by hand.** The template, generated source, manifest checksum, and tests must agree. Change the template, then run `pnpm sdk:sync`.
6. **Test only the default combination.** Navigation, structure, auth, backend, database, ORM, styling, and optional features interact. Check the combinations touched by the change, including invalid ones.

## Follow a change through the pipeline

Before calling generator work complete, check every applicable layer:

- **Schema.** `packages/schemas` owns accepted values, defaults, manifest shapes, and invalid combinations.
- **CLI.** `packages/cli` owns flags, prompts, config precedence, experimental gates, dry runs, installation, and Git initialization.
- **Adapter.** `packages/adapters` turns the choice into operations and declares capabilities.
- **Core.** `packages/core` owns operation semantics, conflicts, paths, staging, validation, diagnostics, and redaction.
- **SDK pack.** `packages/sdk-packs/sdk-57` owns files every SDK 57 project starts with.
- **Generated structures.** Decide whether the change applies to `standalone`, `monorepo`, `monorepo-web`, or a subset. Mobile roots differ between standalone and monorepo output.
- **Navigation.** Expo Router and React Navigation have different entrypoints and file layouts. Navigation-shaped work needs an explicit answer for both.
- **Diagnostics.** If `expojet doctor` can detect a broken setup, add or update the relevant check.
- **Fixtures.** Update a certified project only when it represents a configuration changed by the work. Do not hand-edit a fixture into a state the generator cannot produce.
- **Docs.** Update user docs when flags, defaults, setup, support status, or generated structure changes.
- **Packaging.** Public CLI changes must still work without private workspace packages leaking into the published tarball.

## Dependency direction

Keep package imports flowing in this direction:

```text
brand       schemas
  \          /  \
   \        /    sdk-57
    core
      \
     adapters
        \
         cli
```

More precisely:

- `core` may depend on `brand` and `schemas`.
- `adapters` may depend on `brand`, `core`, and `schemas`.
- `sdk-57` may depend on `schemas`.
- `cli` composes `brand`, `schemas`, `core`, `adapters`, and `sdk-57`.
- `core`, `adapters`, and `schemas` must never import `cli`.

Keep package exports explicit. Do not reach into another package's private source files.

## Where code lives

- `packages/cli` contains Commander setup, Clack prompts, command behavior, plan assembly, installs, and Git setup.
- `packages/core` contains operations, conflict detection, plan execution, safe paths, project discovery, presets, doctor checks, and redaction.
- `packages/adapters` contains first-party integration plans. Split them by the user-facing choice they implement.
- `packages/schemas` contains Zod schemas and shared TypeScript types for input, manifests, and SDK packs.
- `packages/sdk-packs/sdk-57` contains the canonical Expo SDK 57 template and generated pack source.
- `packages/brand` owns replaceable product identity.
- `packages/expojet` is the thin public alias package. Keep logic in `create-expojet`.
- `apps/docs` is the Next.js documentation site and Stack Builder.
- `fixtures` contains generated reference projects. Treat them as outputs, not alternate templates.
- `docs/decisions` records durable architecture decisions and their reasons.
- `scripts` contains SDK synchronization and public-package smoke checks.

## Local workflow

Requirements are Node.js `>=22.12.0` and pnpm `10.33.0`.

```bash
pnpm install
pnpm build
```

Useful checks:

```bash
pnpm --filter @expojet/schemas typecheck
pnpm --filter @expojet/core test
pnpm --filter @expojet/adapters test
pnpm --filter create-expojet test
pnpm sdk:check
pnpm smoke:pack
pnpm --filter @expojet/docs typecheck
```

`pnpm check` runs Biome, the SDK checksum check, all typechecks, and all tests. Use focused checks while working. Run the full command when the task or release scope warrants it.

Build the CLI before invoking its compiled entrypoint:

```bash
pnpm --filter create-expojet build
node packages/cli/dist/cli.js demo-app --dry-run --yes
node packages/cli/dist/cli.js doctor
```

Generate disposable projects only into a known empty temporary directory. Never point local verification at an existing app or a directory with user files. Disable install and Git initialization when they are irrelevant to the behavior under test.

## Verification

Use the smallest check that proves the changed behavior. A schema change usually needs the schema package typecheck and its existing focused suite. An adapter change needs its operation output checked and at least one representative plan rendered. A packaging change needs `pnpm smoke:pack`.

Do not add tests unless the task asks for them. If a behavior change cannot be checked safely without a new test, explain why and ask before adding one. Running existing tests is fine.

For generated output, inspect the files that users will receive. Check both the presence of required files and the absence of incompatible dependencies, stale routes, secret names, and unresolved placeholders. A successful TypeScript compile does not prove that the generated architecture is correct.

Do not rewrite fixtures or snapshots just to make a failure disappear. First confirm that the new output is intentional and that the generator can reproduce it.

## Documentation

Most code changes do not need a new document.

- Put user instructions in `apps/docs/content/docs`. Explain what the choice does, how to select it, required setup, and any real limitation.
- Put lasting architecture decisions in `docs/decisions`. Write an ADR when a package boundary, generation invariant, compatibility policy, or support gate changes.
- Keep local implementation details near the code as short comments.
- Update existing pages instead of appending a second account of the behavior.
- Do not commit implementation plans, research notes, verification transcripts, or agent scratch files.

Use relative repository links in checked-in Markdown. Do not add machine-specific `file://` URLs.

## Commits and pull requests

Make small atomic commits using conventional commit syntax, such as `fix(core): reject paths outside staging` or `feat(adapters): add aptabase analytics`.

Add a changeset for a user-visible change to a published package. Skip it for internal refactors, tests, and repository-only docs unless the release process needs one.

Do not open a pull request unless the developer asks. Keep one concern per pull request. Describe the user-visible problem, the implementation, the combinations checked, and any known support limit. UI changes to the docs site should include before and after images when the visual difference matters.

## Code style

- Prefer inferred types. Add annotations at package boundaries or when inference hides intent.
- Avoid `any`. Parse unknown input with Zod or narrow it directly.
- Keep adapters declarative and functions small enough to read without jumping through helpers.
- Comments should explain a constraint, an ownership rule, or how a function is used. Do not narrate each line.
- Use Biome for formatting. TypeScript uses double quotes, semicolons, two spaces, and a 100-character line width.
- Preserve user files and unrelated worktree changes. Never use destructive Git commands to make a local problem disappear.

If a rule here conflicts with the requested change, stop and explain the conflict before breaking the rule.
