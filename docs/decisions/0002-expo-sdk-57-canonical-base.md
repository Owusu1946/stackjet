# ADR 0002: Expo SDK 57 Canonical Base and Immutable Packs

## Status
Accepted

## Context
Expo SDK releases feature tightly coupled React Native and React versions. Fetching upstream templates dynamically at user execution time introduces indeterminism, network flakiness, and silent upstream breakage. Handcrafting custom React Native dependency tables frequently violates Expo’s peer-dependency requirements.

## Decision
1. Treat official `create-expo-app` `default@sdk-57` as the canonical upstream source.
2. Maintain SDK support as a versioned, immutable compatibility pack located at `packages/sdk-packs/sdk-57`.
3. Include a pinned, verified lockfile and pre-computed SHA-256 integrity checksums.
4. Verify the pack via `scripts/sync-sdk-pack.mjs --check` in continuous integration.

## Consequences
- Guaranteed deterministic project generation independent of upstream registry changes.
- Every generated application inherits tested native dependencies and configuration plugins verified by Expo Doctor.
- Future SDK upgrades (e.g., SDK 58) are introduced as independent packs without mutating legacy versions.
