---
"create-expojet": minor
---

Phase 6: React Navigation & Custom JWT Authentication

- Add React Navigation adapter (`--navigation <router|react-navigation>`, default `"router"`) supporting component-based navigation.
  - Generates `index.js`, `src/App.tsx`, `src/navigation/RootNavigator.tsx`, `src/navigation/AppNavigator.tsx` (bottom tabs), `src/navigation/AuthNavigator.tsx` (stack), and screens under `src/screens/`.
  - Automatically omits `app/` file-based routing directory when React Navigation is chosen.
  - Installs `@react-navigation/native`, `@react-navigation/native-stack`, and `@react-navigation/bottom-tabs`.
- Add Custom JWT Authentication adapter (`--auth jwt`) with self-hosted token lifecycle.
  - Implements SecureStore token storage (`expo-secure-store`) with auto-refresh fetch interceptor (`src/auth/jwt-client.ts`).
  - Provides `SessionProvider` (`src/session/provider.tsx`) with `signIn`, `signUp`, and `signOut` methods.
  - Generates sign-in and sign-up UI screens and Maestro E2E test flows (`.maestro/jwt-auth.yaml`).
  - Integrates backend JWT token generation, verification, and rotation endpoints (`POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, and protected `/v1/me`) across Hono, Express, and NestJS.
- Add Doctor diagnostics:
  - Validates React Navigation entrypoint integrity (`src/App.tsx` and `src/navigation/RootNavigator.tsx`).
  - Validates JWT auth client presence (`src/auth/jwt-client.ts`).
  - Enforces strict isolation check verifying `JWT_SECRET` and `JWT_REFRESH_SECRET` never leak into mobile client bundles.
- Add CLI flag `--navigation` and interactive prompts with full backwards compatibility.
