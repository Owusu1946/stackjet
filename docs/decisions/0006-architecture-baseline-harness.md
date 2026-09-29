# ADR 0006: A hashed architecture baseline as the generator's safety net

## Status
Accepted

## Context

Expojet's safety story rests on two things: per-adapter unit tests, and the SDK pack checksum.
Both are necessary and neither is sufficient.

- Unit tests assert that *an adapter* returns the operations it should. They do not assert that
  `auth.ts` and the Better Auth branch still emit byte-identical session code after either was
  moved.
- The SDK checksum proves the base template was not edited by hand. It says nothing about the ~8,000
  lines of template literals in `packages/adapters/src` that overlay it.
- A successful `tsc` on generated output proves the generated code typechecks. It does not prove the
  generated *architecture* is unchanged, and a refactor that silently drops a `DataProvider` or
  flips a plugin order passes every existing check.

This was felt directly. While restructuring `packages/adapters`, the question "did this change any
generated file?" could not be answered cheaply and confidently by hand across 64 configurations.

## Decision

1. `scripts/architecture-harness.mjs` plans every supported configuration, renders each plan in
   memory, and records a SHA-256 tree hash per scenario in `architecture.baseline.json`.
2. `pnpm architecture:check` compares against that baseline and exits non-zero on any drift. It runs
   as the last step of `pnpm check`, so CI enforces it.
3. Scenarios are built from the axes — every structure, SDK, navigation type, styling adapter, icon
   library, state library, analytics, monitoring, backend, database/ORM pair, auth provider, package
   manager, and feature toggle — rather than hand-listing combinations.
4. A scenario the create schema rejects is a harness failure, not a tolerated skip. The harness and
   the schema are two statements about the same architecture and must agree.
5. The baseline is regenerated deliberately, with the diff reviewed, when a change to generated
   output is intended.

## Consequences

- Refactors of `core`, `adapters` and `cli` become safe to review: the reviewer asks "does the
  baseline change?" rather than auditing thousands of lines of template literals.
- A behavioural regression in generated output fails CI with the name of the affected scenario
  rather than a mystery in a downstream project.
- The harness is a second thing to keep in sync when a new adapter or option is added. That is a
  real cost, and it is paid at the moment a feature is introduced rather than during an incident.
- It fingerprints *content*, so a change to generated code always shows up, including a change the
  author considered cosmetic. That is the intent: "cosmetic" in generated output is still a diff a
  user receives.
EOF
