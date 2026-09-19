# Expojet app

Expo SDK 57 mobile app with Clerk hosted authentication and a typed Hono + Neon API.

## Run

1. Copy apps/mobile/.env.example to apps/mobile/.env and add the public Clerk key and reachable API URL.
2. Copy apps/api/.env.example to apps/api/.env; use the pooled Neon URL for DATABASE_URL and direct URL for DIRECT_DATABASE_URL.
3. Run pnpm install, pnpm db:migrate, then pnpm dev.

Never put Clerk secret or Neon URLs in the mobile environment. See docs/deployment.md.
