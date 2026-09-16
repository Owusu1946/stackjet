# Phase 0 verification ledger

## Environment

| Check | Result |
|---|---|
| Node runtime | 22.14.0; satisfies Expo SDK 57's minimum of 22.13.x |
| Package manager | pnpm 10.33.0 |
| Android Gradle Java toolchain | JDK 17.0.12 |
| Android Debug Bridge | 37.0.0 |
| Expo base | Official `create-expo-app` `default@sdk-57` template |
| iOS native compilation | Requires macOS CI; not claimable from this Windows host |

## Automated checks completed

| Check | Clerk reference | Better Auth reference |
|---|---|---|
| Expo Doctor | 21/21 passed | 21/21 passed |
| TypeScript | Passed | Passed across all three workspace packages |
| Lint | Passed | Passed across all three workspace packages |
| Tests | Command passed; no component tests yet | 2 API tests passed; mobile command passed with no component tests yet |
| Android production JS bundle | Passed | Passed |
| Android prebuild | Passed | Passed |
| Android debug APK | Stopped after dependency resolution exposed the full optional Clerk native stack; not required for hosted auth in Expo Go | Deferred; not required for the Expo Go gate |

## Reference A: Clerk + Uniwind

Implemented:

- hosted Clerk Account Portal via `useHostedAuth`;
- separate sign-in and sign-up launch actions;
- cancellation-safe and recoverable error handling;
- Clerk token cache backed by Expo SecureStore;
- Expo Router `Stack.Protected` route selection;
- local versioned onboarding state;
- Expo app scheme and platform identifiers;
- Uniwind as the outermost Metro wrapper;
- EAS development, preview, and production profiles;
- Maestro smoke flow.

Still requires external evidence:

- Clerk publishable key and Native API dashboard registration;
- real sign-in, sign-up, restore, and sign-out on Android;
- iOS simulator gate on macOS;
- at least one configured social provider if OAuth coverage is required.

## Reference B: Better Auth + Hono + Neon + Drizzle + Uniwind

Implemented:

- pnpm/Turborepo monorepo boundaries;
- Hono Node API with public `/health` and authenticated `/v1/me`;
- Better Auth Expo server/client plugins;
- SecureStore-backed cookie/session cache;
- explicit cookie forwarding for authenticated Hono RPC requests;
- Neon HTTP driver and Drizzle PostgreSQL schema;
- generated, versioned four-table Drizzle migration;
- server-only environment validation;
- separate mobile public environment schema;
- Expo Router protected routes and email/password flows;
- Uniwind Metro composition and monorepo source scanning;
- EAS profiles and Maestro smoke flow.

Still requires external evidence:

- Neon test database URL and applied migration;
- Better Auth test secret;
- Android sign-up, sign-in, restore, authenticated `/v1/me`, and sign-out;
- iOS equivalent gate on macOS;
- one configured OAuth provider with PKCE and validated callback.

Until every device gate passes, Better Auth remains experimental as required by the blueprint.
