# create-expojet

## 0.2.0

### Minor Changes

- 861fac3: Phase 3: Database & ORM Matrix
  
  - Support Neon (Serverless Postgres), PostgreSQL (Local Docker Compose), SQLite (LibSQL / expo-sqlite), and None.
  - Support Drizzle ORM and Prisma ORM.
  - Add `--database` and `--orm` CLI flags and interactive selection prompts.
  - Add PostgreSQL Docker compose and ORM migration doctor diagnostics.
  - Ensure strict mobile secret boundary across all database and ORM combinations.
- b60641a: Phase 4: Managed Cloud Ecosystems (Supabase & Firebase)
  
  - Add Supabase Auth and Firebase Auth adapters with native secure storage persistence.
  - Add Supabase Postgres database adapter with pooled and direct connection handling.
  - Support both standalone Expo SDK 57 mobile apps and full-stack Hono monorepos with Supabase and Firebase.
  - Add server-side token verification for Supabase JWTs and Firebase Admin ID tokens in `apps/api`.
  - Add typed React Query hooks (`useMe`) connecting mobile auth state with the Hono backend.
  - Enforce strict mobile secret isolation preventing `SUPABASE_SERVICE_ROLE_KEY` and server secrets from leaking into mobile bundles.
  - Add Maestro flows for Supabase and Firebase authentication.
- 40b08b5: Phase 5: Alternative API Backends (Express, NestJS & Convex)
  
  - Add Express backend adapter with Helmet, CORS, Supertest tests, and typed fetch client.
  - Add NestJS backend adapter with modular architecture (`AppModule`, `HealthController`, `MeController`, auth guard, services, and tests).
  - Add Convex reactive backend adapter supporting both standalone Expo apps and full-stack monorepos with `ConvexProvider`, reactive hooks, and `convex dev` workflow.
  - Add `--backend` CLI flag and interactive framework selector with validation rules.
  - Add doctor diagnostics for Express, NestJS, and Convex entrypoints and schemas.
  - Maintain 100% backwards compatibility with existing Hono RPC workflows.
- ce5cafc: Phase 6: React Navigation & Custom JWT Authentication
  
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
