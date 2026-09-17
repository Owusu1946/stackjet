# Agent Knowledge Map: Expojet

> This document serves as the top-level repository harness for AI coding agents and contributors. Keep it concise, authoritative, and synchronized with repository invariants.

---

## 1. Repository Architecture

Expojet is an Expo-first, compatibility-tested application generator that outputs production-ready Expo SDK 57 mobile apps and full-stack Hono/Neon monorepos.

```text
expojet/
├── packages/
│   ├── cli/         # Binary entrypoint (`create-expojet`), flags, prompts, commands
│   ├── core/        # Plan executor, atomic staging, conflict detection, doctor checks
│   ├── adapters/    # Declarative adapters for auth, styling, and platform backends
│   ├── sdk-packs/   # Immutable Expo SDK 57 pack, template tree, SHA-256 checksums
│   ├── schemas/     # Shared Zod schemas for input validation, configs, and manifests
│   └── brand/       # Centralized product branding and replaceable strings
├── fixtures/        # Certified reference projects tested in CI
├── docs/            # Verification ledgers, ADRs, compatibility records, guides
├── scripts/         # SDK pack sync (`sync-sdk-pack.mjs`), packaging smoke tests
└── .github/         # Multi-OS CI matrix and release automation
```

---

## 2. Invariant Rules & Golden Principles

1. **Strict Dependency Hierarchy**:
   - `cli -> core -> schemas`
   - `cli -> adapters -> core`
   - `sdk-packs -> schemas`
   - `core` must never import `cli`.
2. **Declarative Operations Only**:
   - Adapters must NEVER write to disk directly. They return declarative `Operation` objects executed atomically by `core/src/executor.ts`.
3. **Strict Secret Isolation**:
   - Mobile bundles (`apps/mobile/`) must never contain or import server secrets (`DATABASE_URL`, `DIRECT_DATABASE_URL`, `CLERK_SECRET_KEY`, `BETTER_AUTH_SECRET`).
   - All mobile-accessible environment variables must start with `EXPO_PUBLIC_`.
4. **Deterministic Staging**:
   - All generation renders into a unique sibling staging directory (`.<name>-staging-...`), passes static integrity and secret checks, and commits atomically via rename.
   - On error or dry-run, only the staging directory is deleted. Target directories are never left in a partial state.
5. **Brand Isolation**:
   - Product name strings must be referenced from `@expojet/brand` rather than hardcoded in templates or generator logic.

---

## 3. Key Commands & Verifications

| Command | Description |
|---|---|
| `pnpm check` | Full repository health check: Biome lint, SDK checksums, typechecks, and tests |
| `pnpm build` | Compiles all packages using Turborepo and `tsup` |
| `pnpm test` | Runs unit and integration test suites via Vitest |
| `pnpm smoke:pack` | Validates public CLI tarball integrity and entrypoint |
| `pnpm sdk:check` | Verifies SHA-256 checksums of the immutable SDK 57 pack |
| `node packages/cli/dist/cli.js doctor` | Runs local repository and project diagnostics |

---

## 4. Key Documentation Links

- [Blueprint Specification](file:///c:/Users/HP/Desktop/stackjet/stackjet-researched-implementation-blueprint.md)
- [Architecture Decisions (ADRs)](file:///c:/Users/HP/Desktop/stackjet/docs/decisions/)
- [Phase Verifications](file:///c:/Users/HP/Desktop/stackjet/docs/)
- [Compatibility Ledger](file:///c:/Users/HP/Desktop/stackjet/docs/compatibility/v1.0.0-alpha.1.md)
- [Contributor Guide](file:///c:/Users/HP/Desktop/stackjet/docs/contributing/guide.md)
- [Third-Party Notices](file:///c:/Users/HP/Desktop/stackjet/THIRD_PARTY_NOTICES.md)
