<div align="center">

# Expojet

### Build the Expo app you meant to build.

Expojet is an Expo-first project generator for composing production-ready mobile apps and full-stack TypeScript workspaces from compatible, declarative adapters.

[![CI](https://github.com/Owusu1946/stackjet/actions/workflows/ci.yml/badge.svg)](https://github.com/Owusu1946/stackjet/actions) [![npm](https://img.shields.io/npm/v/create-expojet?color=cb3837&logo=npm)](https://www.npmjs.com/package/create-expojet) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Expo SDK](https://img.shields.io/badge/Expo%20SDK-57-000020.svg)](https://expo.dev)

[Website](https://www.expojet.dev) · [Documentation](https://docs.expojet.com) · [Changelog](https://www.expojet.dev/changelog) · [Issues](https://github.com/Owusu1946/stackjet/issues)

</div>

## Why Expojet?

Modern Expo projects are rarely just a blank app. Authentication, navigation, styling, persistence, analytics, backend boundaries, environment variables, and deployment profiles need to agree from the first commit.

Expojet turns those decisions into a tested project plan and materializes the result atomically. Choose the pieces you need, generate a clean workspace, and keep the configuration visible in `expojet.jsonc`.

## Quick start

Run the interactive generator:

```bash
npx create-expojet@latest
```

Or provide a project name and options directly:

```bash
npx create-expojet@latest my-app --style nativewind --auth clerk --yes
```

Create a full-stack workspace:

```bash
npx create-expojet@latest my-product \
  --structure monorepo-web \
  --backend hono \
  --database postgres \
  --orm drizzle \
  --auth clerk \
  --yes
```

Supported package managers include npm, pnpm, Bun, and Yarn. The generated project includes the selected adapters, configuration, environment template, diagnostics, and EAS profiles where requested.

## What it can generate

| Area | Options |
| --- | --- |
| Structure | `standalone`, `monorepo`, `monorepo-web` |
| Navigation | Expo Router, React Navigation; tabs, drawer, tabs + drawer, stack |
| Authentication | Clerk, Supabase, Firebase, Better Auth (experimental), JWT (experimental), none |
| Styling | Uniwind, NativeWind, Unistyles, StyleSheet |
| Icons | Lucide, Hugeicons, Expo Icons |
| Backend | Hono, Express, NestJS, Convex |
| Database | Neon, PostgreSQL, SQLite, Supabase |
| ORM | Drizzle, Prisma |
| State | Zustand, MobX, React state |
| Analytics | PostHog, Aptabase |
| Features | Dark mode, onboarding, Liquid Glass, EAS profiles |

Use the [Stack Builder](https://www.expojet.dev/builder) to explore compatible choices before generating a project.

## Design guarantees

Expojet is built around a few project-generation invariants:

- **Compatibility-first:** generated combinations target Expo SDK 57 and are covered by adapter and generation tests.
- **Atomic output:** generation runs in an isolated staging directory and commits to the destination only after validation succeeds.
- **Secret isolation:** mobile-accessible variables must use the `EXPO_PUBLIC_` prefix; server secrets are rejected from mobile output.
- **Declarative adapters:** adapters return typed operations; the core executor owns filesystem writes and applies them atomically.
- **Inspectable output:** every generated project contains a manifest that records the selected structure and adapters.

## CLI examples

```bash
# See all commands and options
npx create-expojet@latest --help

# Generate a minimal client-only app
npx create-expojet@latest my-app \
  --structure standalone \
  --auth none \
  --backend none \
  --database none \
  --orm none \
  --no-onboarding \
  --no-dark-mode \
  --no-eas \
  --yes

# Generate with a saved configuration
npx create-expojet@latest my-app --config ./expojet.config.json --yes

# Inspect a generated project
npx expojet doctor
npx expojet info
npx expojet env check
```

The installed CLI is the authoritative source for available flags. Experimental adapters require `--experimental` when the option is not part of the stable interactive flow.

## Repository layout

```text
stackjet/
├── packages/
│   ├── cli/          # create-expojet command and generation workflow
│   ├── core/         # plans, staging, execution, validation, diagnostics
│   ├── adapters/     # auth, styling, backend, database, and feature adapters
│   ├── schemas/      # shared input, config, and manifest schemas
│   ├── sdk-packs/    # immutable Expo SDK 57 template pack
│   └── brand/        # centralized product and package identity
├── apps/docs/        # Expojet website, docs, changelog, and Stack Builder
├── fixtures/         # certified generated-project fixtures
├── docs/             # ADRs, compatibility records, and verification notes
└── scripts/          # SDK pack and packaging checks
```

## Development

Requirements: Node.js `>=22.12.0` and pnpm `10.33.0`.

```bash
git clone https://github.com/Owusu1946/stackjet.git
cd stackjet
pnpm install

# Full health check: formatting, SDK checksums, typechecks, and tests
pnpm check

# Build every package
pnpm build

# Test the public package tarball
pnpm smoke:pack
```

Useful focused commands:

```bash
pnpm test
pnpm typecheck
pnpm sdk:check
pnpm --filter @expojet/docs dev
```

## Contributing

Issues, documentation improvements, adapter ideas, and pull requests are welcome. Before contributing:

1. Read the [contributing guide](CONTRIBUTING.md).
2. Check existing [issues](https://github.com/Owusu1946/stackjet/issues) and discussions.
3. Keep adapter behavior declarative and preserve the repository invariants.
4. Add or update tests for behavior changes.
5. Run `pnpm check` before opening a pull request.

Please report security issues privately using the instructions in [SECURITY.md](SECURITY.md).

## Project status

Expojet is in active public development. The first public release is `v0.6.2`. APIs and adapter details may evolve while the compatibility surface is established; experimental options are labeled in the documentation and CLI.

## License

Expojet is released under the [MIT License](LICENSE).

## Acknowledgements

Expojet is built on the Expo and React Native ecosystems and integrates with open-source projects including Expo Router, Hono, Drizzle, NativeWind, Unistyles, Clerk, Supabase, Convex, and others. Please see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attribution and license information.
