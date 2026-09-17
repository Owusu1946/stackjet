<div align="center">

# ⚡️ Expojet

### The production-ready, Expo-first full-stack TypeScript application generator.

[![CI](https://github.com/Owusu1946/stackjet/actions/workflows/ci.yml/badge.svg)](https://github.com/Owusu1946/stackjet/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Expo SDK 57](https://img.shields.io/badge/Expo_SDK-57-000020.svg)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB.svg)](https://reactnative.dev)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict-3178C6.svg)](https://www.typescriptlang.org)

Scaffold battle-tested Expo SDK 57 mobile apps, type-safe Hono backends, and Next.js 15 web monorepos in seconds.

[Quick Start](#-quick-start) • [Why Expojet?](#-why-expojet) • [Feature Matrix](#-feature-matrix) • [CLI Flags](#-cli-options--flags) • [Architecture](#-project-architectures) • [Contributing](#-contributing)

</div>

---

## 🚀 Quick Start

Create a new project interactively:

```bash
npx create-expojet@latest
```

Or using your favorite package manager:

```bash
# Using pnpm
pnpm dlx create-expojet@latest

# Using bun
bunx create-expojet@latest
```

You can also run with the `expojet` command:
```bash
npx expojet my-app
```

### Non-Interactive Quickstarts

Generate a standalone Expo app with NativeWind:
```bash
npx create-expojet my-app --style nativewind --auth clerk --yes
```

Generate a full-stack Expo + Next.js 15 + Hono API monorepo with Unistyles 3.0:
```bash
npx create-expojet my-monorepo --structure monorepo-web --style unistyles --auth clerk --yes
```

---

## 💡 Why Expojet?

Setting up a modern, production-grade Expo mobile app or full-stack monorepo is notoriously complex:
- **Version Hell**: Mismatched versions of React Native, React 19, Expo Router, and Tailwind often fail silently or crash in release builds.
- **Leaky Secrets**: Many generators inadvertently bundle server database URLs (`DATABASE_URL`) or API secret keys directly into client mobile JS bundles.
- **Corrupted Scaffolding**: Failed installations or network hiccups often leave directories half-written and dirty.

### The Expojet Guarantees:
1. **Verified Compatibility**: Every combination is locked against **Expo SDK 57**, React Native 0.86, and React 19.
2. **Strict Secret Isolation**: Mobile bundles are statically scanned and forbidden from containing server secrets. All client variables require the `EXPO_PUBLIC_` prefix.
3. **Atomic Generation**: Scaffolding always executes in an isolated sibling staging sandbox. Files commit to the destination path only after passing static integrity checks.
4. **Declarative Architecture**: Adapters never write directly to disk; they emit typed declarative operations executed atomically by the core engine.

---

## 🧩 Feature Matrix

| Category | Supported Options | Highlights |
|---|---|---|
| **Project Structure** | `standalone`<br>`monorepo`<br>`monorepo-web` | • Standalone Expo app<br>• Expo + Hono API backend monorepo<br>• Full-stack Expo + Next.js 15 App Router + shared Hono API |
| **Styling** | `uniwind`<br>`nativewind`<br>`unistyles`<br>`stylesheet` | • **Uniwind**: Tailwind CSS v4 with Metro integration<br>• **NativeWind v4**: Tailwind CSS with `withNativeWind`<br>• **Unistyles 3.0**: Nitro C++ JSI engine with reactive theme tokens<br>• **StyleSheet**: Zero-runtime vanilla React Native |
| **Authentication** | `clerk`<br>`better-auth`<br>`none` | • **Clerk**: Hosted auth, session provider, token caching via `expo-secure-store`, Maestro E2E flows<br>• **Better Auth**: Full-stack auth with Drizzle schema<br>• **None**: Clean, unopinionated base |
| **Theme Engine** | Dynamic Dark Mode | • System / manual toggle (`ThemeProvider`, `ThemeToggle`, `useTheme`)<br>• Secure token persistence via `expo-secure-store` |
| **Navigation** | Expo Router | • File-based routing with typed route groups (`(app)`, `(public)`, `(onboarding)`) |
| **Full-Stack Sharing** | `@expojet/api-contract` | • End-to-end type safety between backend and mobile/web clients using Hono RPC and TanStack React Query |
| **Deployment & Ops** | EAS & Doctor | • Preconfigured `eas.json` profiles for development, preview, and production<br>• Built-in `doctor` command for project health diagnostics |

---

## 🛠 Project Architectures

### 1. Single Expo App (`standalone`)
Ideal for focused mobile apps without a dedicated custom backend:
```text
my-app/
├── app/
│   ├── (app)/index.tsx         # Authenticated / main screens
│   ├── (onboarding)/index.tsx  # First-time user onboarding
│   ├── (public)/sign-in.tsx    # Authentication screens
│   ├── _layout.tsx             # Root layout with providers
│   └── index.tsx               # Auth & onboarding router gate
├── src/
│   ├── components/             # Reusable UI components (BrandCard, ThemeToggle)
│   ├── session/                # Session provider & token storage
│   ├── theme/                  # Theme tokens & Dark Mode engine
│   └── env.ts                  # T3-env client environment validation
├── app.json                    # Expo configuration
├── eas.json                    # EAS build profiles
├── metro.config.js             # Composed Metro styling configuration
└── expojet.jsonc               # Expojet project manifest
```

### 2. Full-Stack Monorepo (`monorepo-web`)
Ideal for teams sharing domain logic, API contracts, and types between mobile, web, and server:
```text
my-monorepo/
├── apps/
│   ├── mobile/                 # Expo SDK 57 mobile application
│   ├── web/                    # Next.js 15 App Router web application
│   └── api/                    # Hono serverless backend with Drizzle ORM
├── packages/
│   └── api-contract/           # Shared Zod schemas, Hono RPC types, and models
├── turbo.json                  # Turborepo task pipeline
├── package.json                # Workspace root with packageManager
└── expojet.jsonc               # Monorepo manifest
```

---

## ⚙️ CLI Options & Flags

The `create-expojet` command supports rich interactive prompts or fully scriptable CLI flags:

```bash
create-expojet [project-name] [options]
```

### Available Flags

| Flag | Description | Default | Choices |
|---|---|---|---|
| `--structure <type>` | Project architecture | `standalone` | `standalone`, `monorepo`, `monorepo-web` |
| `--package-manager <name>` | Package manager to configure | `pnpm` | `pnpm`, `npm`, `bun` |
| `--auth <adapter>` | Authentication provider | `clerk` | `clerk`, `better-auth`, `none` |
| `--style <adapter>` | Styling system | `uniwind` | `uniwind`, `nativewind`, `unistyles`, `stylesheet` |
| `--dark-mode` / `--no-dark-mode` | Include theme toggle engine | `true` | Boolean flag |
| `--onboarding` / `--no-onboarding` | Include onboarding flow gate | `true` | Boolean flag |
| `--eas` / `--no-eas` | Generate EAS build profiles | `true` | Boolean flag |
| `--install` / `--no-install` | Automatically install dependencies | `true` | Boolean flag |
| `--git` / `--no-git` | Initialize a Git repository | `true` | Boolean flag |
| `--dry-run` | Preview file plan without writing disk | `false` | Boolean flag |
| `--yes` | Accept defaults / skip prompts | `false` | Boolean flag |
| `--config <path>` | Load options from a JSON config file | - | File path |

---

## 🩺 Built-in Diagnostics (`doctor`)

Expojet includes built-in diagnostics to audit your environment and project health:

```bash
# Audit the current project
npx expojet doctor

# Validate environment variables against .env.example
npx expojet env check

# Inspect system info, package managers, and SDK support
npx expojet info
```

---

## 💻 Local Development

Expojet is developed as an open-source monorepo. To contribute or inspect the codebase:

```bash
# 1. Clone the repo
git clone https://github.com/Owusu1946/stackjet.git
cd stackjet

# 2. Install dependencies
pnpm install

# 3. Full repository health check (lint, checksums, typechecks, tests)
pnpm check

# 4. Build all packages
pnpm build

# 5. Run the local CLI
node packages/cli/dist/cli.js --help
```

---

## 🤝 Contributing

Contributions are warmly welcomed! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before opening a pull request or submitting an issue.

- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Architecture Decisions (ADRs)](docs/decisions/)

---

## 📄 License

Expojet is open-source software licensed under the [MIT License](LICENSE).
