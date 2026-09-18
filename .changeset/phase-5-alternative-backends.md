---
"create-expojet": minor
---

Phase 5: Alternative API Backends (Express, NestJS & Convex)

- Add Express backend adapter with Helmet, CORS, Supertest tests, and typed fetch client.
- Add NestJS backend adapter with modular architecture (`AppModule`, `HealthController`, `MeController`, auth guard, services, and tests).
- Add Convex reactive backend adapter supporting both standalone Expo apps and full-stack monorepos with `ConvexProvider`, reactive hooks, and `convex dev` workflow.
- Add `--backend` CLI flag and interactive framework selector with validation rules.
- Add doctor diagnostics for Express, NestJS, and Convex entrypoints and schemas.
- Maintain 100% backwards compatibility with existing Hono RPC workflows.
