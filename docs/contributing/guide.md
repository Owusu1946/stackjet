# Stackjet Contributor Guide

Welcome to the Stackjet repository! This guide provides an overview of our architecture, dependency rules, testing workflows, and release processes.

---

## 1. Repository Architecture & Dependency Flow

Stackjet is organized as a strict pnpm workspace managed by Turborepo:

```text
packages/
├── cli/         # CLI binary, commander setup, interactive Clack prompts
├── core/        # Plan executor, staging directories, conflict resolution, diagnostics
├── adapters/    # First-party adapters (auth: clerk/better-auth, style: uniwind/stylesheet, platform: hono-neon)
├── sdk-packs/   # Immutable Expo SDK 57 template and pack checksums
├── schemas/     # Zod schemas for CLI inputs, configs, and manifests
└── brand/       # Isolated product identity strings and taglines
```

### Strict Dependency Direction
```text
cli -> core -> schemas
cli -> adapters -> core
sdk-packs -> schemas
```
- `core` must never import `cli`.
- `adapters` must not write to disk directly; they return declarative `Operation` objects executed by `core`.
- Server secrets must never be exposed or declared in mobile public environments.

---

## 2. Development Setup

### Prerequisites
- Node.js `>= 22.12.0` (LTS recommended)
- `pnpm` `>= 10.33.0`

### Quick Start
```bash
# Install all workspace dependencies
pnpm install

# Run formatting, linting, SDK checksum check, typechecks, and tests
pnpm check

# Build all packages with Turborepo
pnpm build
```

---

## 3. Testing Workflows

### Running Package Tests
```bash
pnpm test
```

### Testing Generated Fixtures
Fixtures in `fixtures/` represent certified configurations and must pass all static and runtime tests:
```bash
pnpm --dir fixtures/standalone-no-auth test
pnpm --dir fixtures/standalone-no-auth-uniwind test
pnpm --dir fixtures/monorepo-clerk test
pnpm --dir fixtures/monorepo-better-auth-experimental test
```

### Packaging & Smoke Preflight
Validate that no private workspace packages leak into public binary dependencies:
```bash
pnpm smoke:pack
```

---

## 4. Submitting Changes & Releases

1. **Architecture Decision Records**: If altering an architectural invariant, create a new ADR under `docs/decisions/`.
2. **Changesets**: When adding user-facing or breaking changes, generate a changeset:
   ```bash
   pnpm changeset
   ```
3. **CI Matrix**: Ensure all pull request checks pass on Windows, macOS, and Linux runners.
