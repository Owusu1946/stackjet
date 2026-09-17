---
"create-expojet": minor
---

Phase 4: Managed Cloud Ecosystems (Supabase & Firebase)

- Add Supabase Auth and Firebase Auth adapters with native secure storage persistence.
- Add Supabase Postgres database adapter with pooled and direct connection handling.
- Support both standalone Expo SDK 57 mobile apps and full-stack Hono monorepos with Supabase and Firebase.
- Add server-side token verification for Supabase JWTs and Firebase Admin ID tokens in `apps/api`.
- Add typed React Query hooks (`useMe`) connecting mobile auth state with the Hono backend.
- Enforce strict mobile secret isolation preventing `SUPABASE_SERVICE_ROLE_KEY` and server secrets from leaking into mobile bundles.
- Add Maestro flows for Supabase and Firebase authentication.
