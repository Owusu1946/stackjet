---
"create-expojet": minor
---

Phase 3: Database & ORM Matrix

- Support Neon (Serverless Postgres), PostgreSQL (Local Docker Compose), SQLite (LibSQL / expo-sqlite), and None.
- Support Drizzle ORM and Prisma ORM.
- Add `--database` and `--orm` CLI flags and interactive selection prompts.
- Add PostgreSQL Docker compose and ORM migration doctor diagnostics.
- Ensure strict mobile secret boundary across all database and ORM combinations.
