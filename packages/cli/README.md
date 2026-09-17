# create-expojet

> A production-ready Expo stack in one command.

Scaffold battle-tested Expo SDK 57 mobile apps, type-safe Hono backends, and Next.js 15 web monorepos in seconds.

## Quick Start

Run interactively:

```bash
# Using npm
npx create-expojet@latest

# Using pnpm
pnpm dlx create-expojet@latest

# Using bun
bunx create-expojet@latest
```

You can also use the binary command `expojet`:

```bash
npx expojet my-app
```

## Non-Interactive Scaffolding

Generate a standalone Expo app with NativeWind & Clerk:
```bash
npx create-expojet my-app --style nativewind --auth clerk --yes
```

Generate a full-stack Expo + Next.js 15 + Hono API monorepo with Unistyles:
```bash
npx create-expojet my-monorepo --structure monorepo-web --style unistyles --auth clerk --yes
```

## Options & Flags

| Flag | Description | Values | Default |
|---|---|---|---|
| `--structure` | Monorepo or standalone layout | `standalone`, `monorepo`, `monorepo-web` | `standalone` |
| `--style` | Styling engine | `uniwind`, `nativewind`, `unistyles`, `stylesheet` | `uniwind` |
| `--auth` | Authentication adapter | `clerk`, `better-auth`, `none` | `clerk` |
| `--package-manager` | Package manager | `pnpm`, `npm`, `bun` | `pnpm` |
| `--no-dark-mode` | Disable dynamic dark mode | boolean | `false` |
| `--no-onboarding` | Disable onboarding flow | boolean | `false` |
| `--no-eas` | Disable EAS configuration | boolean | `false` |
| `--no-install` | Skip dependency installation | boolean | `false` |
| `--no-git` | Skip git repository initialization | boolean | `false` |
| `--dry-run` | Preview generation without disk writes | boolean | `false` |
| `--yes` | Non-interactive mode using defaults | boolean | `false` |

## Diagnostic Commands

Run diagnostics in any generated project:

```bash
expojet doctor
expojet env check
expojet info
```

## License

MIT
