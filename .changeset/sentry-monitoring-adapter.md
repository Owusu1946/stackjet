---
"@expojet/schemas": minor
"@expojet/adapters": minor
"@expojet/core": patch
"create-expojet": minor
---

Add Sentry error monitoring adapter with full mobile wiring

Introduces a new `monitoring` adapter kind with Sentry as the first option. When selected, the adapter:

- Adds `@sentry/react-native` dependency
- Wires `Sentry.init()` as a side-effect import at the top of the root layout (Expo Router) or App.tsx (React Navigation), ensuring initialization before any component renders
- Registers `@sentry/react-native/expo` as an app.json plugin via `compose-app-config` for native crash handling
- Declares `EXPO_PUBLIC_SENTRY_DSN` (public) and `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` (server-secret) environment variables for runtime and EAS source map uploads
- Generates no-op stub files when monitoring is set to "none", so the navigation adapter's import always resolves

Available via `--monitoring sentry`, `--sentry`, or the interactive prompt.
