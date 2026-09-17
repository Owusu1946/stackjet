# Contributing to Stackjet

Thank you for your interest in contributing to **Stackjet**! Stackjet is an open-source, Expo-first application generator and full-stack monorepo scaffolding system built on strict architectural boundaries, verified compatibility, and deterministic generation.

This guide will help you get started with contributing, whether you're reporting bugs, improving documentation, or adding new adapters.

---

## Code of Conduct

All contributors and participants agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any unacceptable behavior to the maintainers.

---

## Repository Architecture & Invariants

Stackjet is organized as a strict pnpm monorepo managed by Turborepo:

```text
stackjet/
├── packages/
│   ├── cli/         # Binary entrypoint (`create-stackjet`), CLI flags, and interactive Clack prompts
│   ├── core/        # Plan executor, atomic staging, conflict detection, and doctor checks
│   ├── adapters/    # First-party adapters (auth, styling, platform backends, theme engine)
│   ├── sdk-packs/   # Immutable Expo SDK 57 pack, template tree, SHA-256 checksums
│   ├── schemas/     # Shared Zod schemas for input validation, configs, and manifests
│   └── brand/       # Centralized product branding and replaceable strings
├── fixtures/        # Certified reference projects tested in CI
├── docs/            # Verification ledgers, ADRs, and guides
└── scripts/         # SDK pack sync (`sync-sdk-pack.mjs`), smoke tests
```

### Golden Invariants
1. **Strict Dependency Hierarchy**:
   - `cli -> core -> schemas`
   - `cli -> adapters -> core`
   - `sdk-packs -> schemas`
   - `core` must **never** import `cli`.
2. **Declarative Operations Only**:
   - Adapters must **never** write directly to the filesystem. They return declarative `Operation` objects executed atomically by `packages/core/src/executor.ts`.
3. **Strict Secret Boundary**:
   - Mobile application code (`apps/mobile/`) must **never** bundle or import server secrets (`DATABASE_URL`, `CLERK_SECRET_KEY`, `BETTER_AUTH_SECRET`, etc.).
   - All mobile-accessible environment variables must be explicitly prefixed with `EXPO_PUBLIC_`.
4. **Deterministic Staging**:
   - All generation renders into a sibling staging directory (`.<name>-staging-...`), validates static integrity and secret checks, and commits atomically via rename.
5. **Brand Isolation**:
   - Product name strings must be referenced from `@stackjet/brand` rather than hardcoded in templates.

---

## Development Setup

### Prerequisites
- **Node.js**: `>= 22.12.0` (LTS recommended)
- **pnpm**: `>= 10.33.0`
- **Git**: Required for repository checks

### Installation
```bash
# Clone the repository
git clone https://github.com/Owusu1946/stackjet.git
cd stackjet

# Install all workspace dependencies
pnpm install

# Build all packages with Turborepo
pnpm build
```

---

## Development Loop & Commands

| Command | Description |
|---|---|
| `pnpm check` | **Full repository health check**: Biome lint, SDK checksums, typechecks, and test suites |
| `pnpm build` | Compiles all packages using Turborepo and `tsup` |
| `pnpm test` | Runs unit and integration test suites via Vitest |
| `pnpm sdk:check` | Verifies SHA-256 integrity checksums of the immutable SDK 57 pack |
| `pnpm smoke:pack` | Validates public CLI tarball integrity and entrypoint |
| `node packages/cli/dist/cli.js doctor` | Runs repository and project diagnostics |

### Testing the CLI Locally

You can run the compiled CLI locally against any target path:

```bash
# Interactive mode
node packages/cli/dist/cli.js my-test-app

# Dry-run validation (no files written to disk)
node packages/cli/dist/cli.js test-app --dry-run --yes --style nativewind --auth clerk

# Monorepo with full web stack
node packages/cli/dist/cli.js test-web --structure monorepo-web --style unistyles --dry-run --yes
```

---

## Submitting a Pull Request

1. **Create a branch**:
   ```bash
   git checkout -b feature/my-cool-feature
   ```
2. **Make your changes**:
   - Adhere to the strict dependency hierarchy and declarative operation model.
   - Maintain Biome code formatting (`pnpm biome check --write .`).
3. **Write tests**:
   - Add unit tests for schema changes in `packages/schemas/src/*.test.ts`.
   - Add adapter operation assertions in `packages/adapters/src/*.test.ts`.
   - Add plan generation checks in `packages/cli/src/*.test.ts`.
4. **Verify everything passes**:
   ```bash
   pnpm check
   ```
5. **Commit with conventional commits**:
   - `feat: add support for ...`
   - `fix: resolve issue with ...`
   - `docs: update ...`
6. **Open a PR**: Describe what your change accomplishes, why it is needed, and any architectural implications.

---

## Questions or Need Help?

- Read the [Architecture Decision Records (ADRs)](docs/decisions/).
- Check the [Evidence & Verification Ledgers](docs/).
- Open a GitHub Issue for bug reports or feature discussions.
