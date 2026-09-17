# ADR 0004: Hono, Neon, and Drizzle Monorepo Architecture

## Status
Accepted

## Context
Full-stack Expo applications require high-performance, lightweight API backends with type-safe database queries. Directly accessing databases from mobile applications exposes connection credentials, bypasses business authorization rules, and creates severe security vulnerabilities.

## Decision
1. Scaffolding for full-stack projects uses a Turborepo monorepo structure:
   - `apps/mobile`: Expo mobile application
   - `apps/api`: Node.js-hosted Hono API server
   - `packages/api-contract`: Pure TypeScript type exports
2. Database layer uses Neon Serverless PostgreSQL with Drizzle ORM:
   - Queries use `@neondatabase/serverless` with the HTTP driver
   - Schema defined in `apps/api/src/db/schema.ts`
   - Migrations handled exclusively on the backend via Drizzle Kit
3. Mobile client connects via Hono RPC (`hc<AppType>`) wrapped with TanStack Query.
4. Static checks enforce that mobile code cannot import backend environment files or database drivers.

## Consequences
- 100% end-to-end type safety between API routes and mobile hooks without code generation steps.
- Server credentials and database connection strings remain strictly contained inside `apps/api`.
- Low-latency query execution via serverless HTTP connections without connection pool exhaustion.
