# ADR 0005: Gating Better Auth Behind Experimental Flag

## Status
Accepted

## Context
Better Auth offers an open-source, self-hosted authentication solution. While the server-side Hono integration and Expo client plugin compile and pass unit tests, cross-origin cookie handling and native scheme redirection in Expo SDK 57 have varying behaviors across mobile platforms.

## Decision
1. Implement the Better Auth adapter as `1.0.0-experimental`.
2. Restrict project generation with Better Auth behind the explicit `--experimental` CLI flag.
3. Keep Clerk as the single default stable authentication provider for v1.
4. Better Auth will be promoted to stable only after passing formal physical-device verification gates on both Android and iOS hardware.

## Consequences
- Protects users from generating uncertified authentication configurations in production.
- Enables developer experimentation and contributor testing without compromising the core product promise.
- Establishes an empirical, evidence-based promotion lifecycle for third-party adapters.
