import type { Operation } from "@expojet/core";
import { z } from "zod";
import type { Adapter } from "./contract.js";

const noOptions = z.object({}).strict();

function makeRootPackage(packageManager: "pnpm" | "npm" | "bun") {
  const dbGenerate =
    packageManager === "npm"
      ? "npm run db:generate --workspace=@expojet/api"
      : `${packageManager} --filter @expojet/api db:generate`;
  const dbMigrate =
    packageManager === "npm"
      ? "npm run db:migrate --workspace=@expojet/api"
      : `${packageManager} --filter @expojet/api db:migrate`;

  const packageManagerVersion =
    packageManager === "pnpm"
      ? "pnpm@10.33.0"
      : packageManager === "npm"
        ? "npm@10.9.2"
        : "bun@1.2.0";

  return `${JSON.stringify(
    {
      name: "expojet-workspace",
      private: true,
      packageManager: packageManagerVersion,
      workspaces: ["apps/*", "packages/*"],
      scripts: {
        dev: "turbo dev",
        build: "turbo build",
        typecheck: "turbo typecheck",
        test: "turbo test",
        "db:generate": dbGenerate,
        "db:migrate": dbMigrate,
      },
      devDependencies: { turbo: "^2.5.6", typescript: "~6.0.3" },
    },
    null,
    2,
  )}\n`;
}

function makeWebPackage(packageManager: "pnpm" | "npm" | "bun") {
  const contractVersion = packageManager === "npm" ? "*" : "workspace:*";
  return `${JSON.stringify(
    {
      name: "@expojet/web",
      private: true,
      type: "module",
      scripts: {
        dev: "next dev --turbopack",
        build: "next build",
        start: "next start",
        typecheck: "tsc --noEmit",
        test: "vitest run",
      },
      dependencies: {
        "@expojet/api-contract": contractVersion,
        "@tanstack/react-query": "^5.87.1",
        hono: "^4.9.8",
        next: "^15.1.7",
        react: "19.2.3",
        "react-dom": "19.2.3",
      },
      devDependencies: {
        "@types/node": "^24.3.1",
        "@types/react": "19.2.18",
        "@types/react-dom": "19.2.18",
        typescript: "~6.0.3",
        vitest: "^3.2.4",
      },
    },
    null,
    2,
  )}\n`;
}

const webTsConfig = `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@/app/*": ["./app/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;

const webNextConfig = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@expojet/api-contract"],
};

export default nextConfig;
`;

const webNextEnv = `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`;

const webProviders = `"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";

export function Providers({ children }: PropsWithChildren) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
`;

const webLayout = `import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers.js";

export const metadata: Metadata = {
  title: "Stackjet Web",
  description: "Next.js web application powered by Stackjet monorepo",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
`;

const webPage = `export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0b0f19",
        color: "#f8fafc",
        padding: "2rem",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "36rem",
          width: "100%",
          backgroundColor: "#131b2e",
          borderRadius: "1.5rem",
          padding: "2.5rem",
          border: "1px solid #1e293b",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        <span
          style={{
            color: "#38bdf8",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          STACKJET MONOREPO
        </span>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            margin: "0.75rem 0 0.5rem 0",
            letterSpacing: "-0.025em",
          }}
        >
          Expo + Web + API
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: 1.6, margin: "0 0 1.5rem 0" }}>
          Your full-stack web and mobile workspace is active. The Next.js client and Expo mobile
          app share typed API contracts with the Hono backend.
        </p>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            paddingTop: "1rem",
            borderTop: "1px solid #1e293b",
          }}
        >
          <span
            style={{
              backgroundColor: "#1e293b",
              color: "#cbd5e1",
              fontSize: "0.8125rem",
              padding: "0.375rem 0.75rem",
              borderRadius: "0.5rem",
            }}
          >
            Next.js 15 App Router
          </span>
          <span
            style={{
              backgroundColor: "#1e293b",
              color: "#cbd5e1",
              fontSize: "0.8125rem",
              padding: "0.375rem 0.75rem",
              borderRadius: "0.5rem",
            }}
          >
            Hono RPC
          </span>
          <span
            style={{
              backgroundColor: "#1e293b",
              color: "#cbd5e1",
              fontSize: "0.8125rem",
              padding: "0.375rem 0.75rem",
              borderRadius: "0.5rem",
            }}
          >
            Expo SDK 57
          </span>
        </div>
      </div>
    </main>
  );
}
`;

const webPageTest = `import { describe, expect, it } from "vitest";
import HomePage from "./page.js";

describe("Web HomePage", () => {
  it("renders the component", () => {
    const element = HomePage();
    expect(element).toBeDefined();
  });
});
`;

const webApiClient = `import type { AppType } from "@expojet/api-contract";
import { hc } from "hono/client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export function createWebApiClient(getToken?: () => Promise<string | null>) {
  return hc<AppType>(apiUrl, {
    fetch: async (input: string | Request | URL, init?: RequestInit) => {
      const token = getToken ? await getToken() : null;
      const headers = new Headers(init?.headers);
      if (token) headers.set("authorization", "Bearer " + token);
      return fetch(input instanceof URL ? input.toString() : input, { ...init, headers });
    },
  });
}
`;

const apiPackage = `{
  "name": "@expojet/api",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts", "./app": "./src/app.ts" },
  "scripts": { "dev": "tsx watch src/index.ts", "start": "tsx src/index.ts", "typecheck": "tsc --noEmit", "test": "vitest run", "db:generate": "drizzle-kit generate", "db:migrate": "drizzle-kit migrate" },
  "dependencies": { "@clerk/backend": "^2.14.0", "@hono/node-server": "^1.19.1", "@neondatabase/serverless": "^1.0.1", "@t3-oss/env-core": "^0.13.11", "drizzle-orm": "^0.45.2", "hono": "^4.9.8", "zod": "^4.1.5" },
  "devDependencies": { "@types/node": "^24.3.1", "drizzle-kit": "^0.31.4", "tsx": "^4.20.5", "typescript": "~6.0.3", "vitest": "^3.2.4" }
}
`;

const envSource = `import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
export function getEnv() { return createEnv({ server: {
  DATABASE_URL: z.string().url(), DIRECT_DATABASE_URL: z.string().url(), CLERK_SECRET_KEY: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000), ALLOWED_ORIGINS: z.string().default("http://localhost:8081"),
}, runtimeEnv: process.env, emptyStringAsUndefined: true }); }
`;

const schemaSource = `import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(), clerkUserId: text("clerk_user_id").notNull().unique(),
  displayName: text("display_name"), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("profiles_clerk_user_id_idx").on(table.clerkUserId)]);
export type Profile = typeof profiles.$inferSelect;
`;
const betterSchemaSuffix = `
export const user = pgTable("user", { id: text("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull().unique(), emailVerified: boolean("email_verified").notNull().default(false), image: text("image"), createdAt: timestamp("created_at").notNull().defaultNow(), updatedAt: timestamp("updated_at").notNull().defaultNow() });
export const session = pgTable("session", { id: text("id").primaryKey(), expiresAt: timestamp("expires_at").notNull(), token: text("token").notNull().unique(), createdAt: timestamp("created_at").notNull().defaultNow(), updatedAt: timestamp("updated_at").notNull().defaultNow(), ipAddress: text("ip_address"), userAgent: text("user_agent"), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }) }, (table) => [index("session_user_id_idx").on(table.userId)]);
export const account = pgTable("account", { id: text("id").primaryKey(), accountId: text("account_id").notNull(), providerId: text("provider_id").notNull(), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }), accessToken: text("access_token"), refreshToken: text("refresh_token"), idToken: text("id_token"), accessTokenExpiresAt: timestamp("access_token_expires_at"), refreshTokenExpiresAt: timestamp("refresh_token_expires_at"), scope: text("scope"), password: text("password"), createdAt: timestamp("created_at").notNull().defaultNow(), updatedAt: timestamp("updated_at").notNull().defaultNow() }, (table) => [index("account_user_id_idx").on(table.userId)]);
export const verification = pgTable("verification", { id: text("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(), expiresAt: timestamp("expires_at").notNull(), createdAt: timestamp("created_at").defaultNow(), updatedAt: timestamp("updated_at").defaultNow() }, (table) => [index("verification_identifier_idx").on(table.identifier)]);
`;

const dbSource = `import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getEnv } from "../env.js";
import * as schema from "./schema.js";
let database: ReturnType<typeof drizzle<typeof schema>> | undefined;
export function getDb() { database ??= drizzle(neon(getEnv().DATABASE_URL), { schema }); return database; }
`;

const appSource = `import { verifyToken as verifyClerkToken } from "@clerk/backend";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import { secureHeaders } from "hono/secure-headers";
import { getDb } from "./db/client.js";
import { profiles, type Profile } from "./db/schema.js";
import { getEnv } from "./env.js";

type Variables = { requestId: string; userId: string };
type Dependencies = { verifyToken(token: string): Promise<{ sub?: string | null }>; findProfile(userId: string): Promise<Profile | null> };
const defaults: Dependencies = {
  verifyToken: (token) => verifyClerkToken(token, { secretKey: getEnv().CLERK_SECRET_KEY }),
  async findProfile(userId) { return (await getDb().select().from(profiles).where(eq(profiles.clerkUserId, userId)).limit(1))[0] ?? null; },
};
const failure = (code: string, message: string, requestId: string) => ({ error: { code, message, requestId } });
export function createApp(overrides: Partial<Dependencies> = {}) {
  const dependencies = { ...defaults, ...overrides };
  const auth = createMiddleware<{ Variables: Variables }>(async (c, next) => {
    const header = c.req.header("authorization");
    if (!header?.startsWith("Bearer ")) return c.json(failure("UNAUTHORIZED", "A bearer token is required", c.get("requestId")), 401);
    try {
      const claims = await dependencies.verifyToken(header.slice(7));
      if (!claims.sub) throw new Error("Token has no subject");
      c.set("userId", claims.sub); await next();
    } catch { return c.json(failure("UNAUTHORIZED", "The bearer token is invalid", c.get("requestId")), 401); }
  });
  return new Hono<{ Variables: Variables }>()
    .use("*", async (c, next) => { c.set("requestId", c.req.header("x-request-id") ?? crypto.randomUUID()); await next(); c.header("x-request-id", c.get("requestId")); })
    .use("*", secureHeaders())
    .use("/v1/*", cors({ origin: (origin) => { const allowed = (process.env.ALLOWED_ORIGINS ?? "http://localhost:8081").split(","); return allowed.includes(origin) ? origin : allowed[0]!; }, credentials: true }))
    .get("/health", (c) => c.json({ ok: true, service: "expojet-api" }))
    .get("/v1/me", auth, async (c) => { const userId = c.get("userId"); return c.json({ user: { id: userId }, profile: await dependencies.findProfile(userId) }); })
    .notFound((c) => c.json(failure("NOT_FOUND", "Route not found", c.get("requestId")), 404))
    .onError((error, c) => { console.error(error); return c.json(failure("INTERNAL_ERROR", "An unexpected error occurred", c.get("requestId")), 500); });
}
export const app = createApp();
export type AppType = ReturnType<typeof createApp>;
`;

const appTest = `import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";
const deps = { verifyToken: vi.fn(async () => ({ sub: "user_123" })), findProfile: vi.fn(async () => null) };
describe("API contract", () => {
  it("reports health", async () => { const response = await createApp(deps).request("/health"); expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ ok: true }); });
  it("normalizes missing authentication", async () => { const response = await createApp(deps).request("/v1/me"); expect(response.status).toBe(401); expect(await response.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } }); });
  it("returns the Clerk subject", async () => { const response = await createApp(deps).request("/v1/me", { headers: { authorization: "Bearer test" } }); expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ user: { id: "user_123" } }); });
});
`;

const betterAuthSource = `import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "../db/client.js";
import * as schema from "../db/schema.js";
import { getEnv } from "../env.js";
const env = getEnv();
export const auth = betterAuth({ baseURL: env.BETTER_AUTH_URL, secret: env.BETTER_AUTH_SECRET, database: drizzleAdapter(getDb(), { provider: "pg", schema }), emailAndPassword: { enabled: true }, trustedOrigins: env.ALLOWED_ORIGINS.split(","), plugins: [expo()] });
`;
const betterAppSource = `import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { auth } from "./auth/index.js";
type Variables = { requestId: string };
const failure = (code: string, message: string, requestId: string) => ({ error: { code, message, requestId } });
export function createApp() { return new Hono<{ Variables: Variables }>()
  .use("*", async (c, next) => { c.set("requestId", c.req.header("x-request-id") ?? crypto.randomUUID()); await next(); c.header("x-request-id", c.get("requestId")); })
  .use("*", secureHeaders())
  .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .get("/health", (c) => c.json({ ok: true, service: "expojet-api", auth: "better-auth-experimental" }))
  .get("/v1/me", async (c) => { const session = await auth.api.getSession({ headers: c.req.raw.headers }); if (!session) return c.json(failure("UNAUTHORIZED", "Authentication is required", c.get("requestId")), 401); return c.json({ user: session.user }); })
  .notFound((c) => c.json(failure("NOT_FOUND", "Route not found", c.get("requestId")), 404))
  .onError((error, c) => { console.error(error); return c.json(failure("INTERNAL_ERROR", "An unexpected error occurred", c.get("requestId")), 500); }); }
export const app = createApp();
export type AppType = ReturnType<typeof createApp>;
`;
const betterAppTest = `import { describe, expect, it } from "vitest";
process.env.DATABASE_URL = "postgresql://test:test@localhost/test"; process.env.DIRECT_DATABASE_URL = process.env.DATABASE_URL; process.env.BETTER_AUTH_SECRET = "test-secret-that-is-at-least-32-characters"; process.env.BETTER_AUTH_URL = "http://localhost:3000";
describe("experimental Better Auth API", () => { it("reports experimental status", async () => { const { createApp } = await import("./app.js"); const response = await createApp().request("/health"); expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ ok: true, auth: "better-auth-experimental" }); }, 20_000); });
`;

const dataProvider = `import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";
export function DataProvider({ children }: PropsWithChildren) { const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } })); return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }
`;
const noDataProvider = `import type { PropsWithChildren } from "react";
export function DataProvider({ children }: PropsWithChildren) { return children; }
`;
const apiClient = `import type { AppType } from "@expojet/api-contract";
import { hc } from "hono/client";
import { env } from "../env";
export function createApiClient(getToken: () => Promise<string | null>) {
  return hc<AppType>(env.EXPO_PUBLIC_API_URL, { fetch: async (input: string | Request | URL, init?: RequestInit) => {
    const token = await getToken(); const headers = new Headers(init?.headers); if (token) headers.set("authorization", "Bearer " + token);
    return fetch(input instanceof URL ? input.toString() : input, { ...init, headers });
  } });
}
`;
const useMe = `import { useAuth } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { createApiClient } from "./api";
export function useMe() { const { getToken, isSignedIn } = useAuth(); return useQuery({ queryKey: ["me"], enabled: Boolean(isSignedIn), queryFn: async () => { const response = await createApiClient(getToken).v1.me.$get(); if (!response.ok) throw new Error("Unable to load profile"); return response.json(); } }); }
`;

const readme = `# Stackjet app\n\nExpo SDK 57 mobile app with Clerk hosted authentication and a typed Hono + Neon API.\n\n## Run\n\n1. Copy apps/mobile/.env.example to apps/mobile/.env and add the public Clerk key and reachable API URL.\n2. Copy apps/api/.env.example to apps/api/.env; use the pooled Neon URL for DATABASE_URL and direct URL for DIRECT_DATABASE_URL.\n3. Run pnpm install, pnpm db:migrate, then pnpm dev.\n\nNever put Clerk secret or Neon URLs in the mobile environment. See docs/deployment.md.\n`;
const deployment = `# Deployment\n\nDeploy apps/api to a Node 22 host. Set CLERK_SECRET_KEY, pooled DATABASE_URL, direct DIRECT_DATABASE_URL, and ALLOWED_ORIGINS there. Run pnpm db:migrate as a release job, not from the mobile app. Point EXPO_PUBLIC_API_URL at the HTTPS API before EAS builds. Configure the generated app scheme as an allowed Clerk redirect.\n\nPhysical-device gate: start the API on a LAN-reachable address, set the mobile API URL to that address, open the project in Expo Go, complete sign-up/sign-in in the hosted browser, confirm return to the app and a successful authenticated GET /v1/me, then sign out and confirm protected-route redirection.\n`;

export const monorepoPlatformAdapter: Adapter = {
  id: "platform:hono-neon",
  version: "1.0.0",
  kind: "api",
  displayName: "Hono + Neon + Drizzle",
  capabilities: () => ({ sdk: [57], requires: ["monorepo", "clerk"], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    if (input.structure === "standalone")
      return [
        {
          type: "write-file",
          path: "src/data/provider.tsx",
          content: noDataProvider,
          owner: this.id,
        },
      ];
    const better = input.auth === "better-auth";
    const selectedApiPackage = better
      ? apiPackage.replace(
          '"@clerk/backend": "^2.14.0", ',
          '"@better-auth/expo": "^1.7.5", "better-auth": "^1.7.5", ',
        )
      : apiPackage;
    const selectedEnv = better
      ? envSource.replace(
          "CLERK_SECRET_KEY: z.string().min(1),",
          "BETTER_AUTH_SECRET: z.string().min(32), BETTER_AUTH_URL: z.string().url(),",
        )
      : envSource;
    const selectedSchema = better
      ? schemaSource.replace("{ index,", "{ boolean, index,") + betterSchemaSuffix
      : schemaSource;
    const operations: Operation[] = [
      {
        type: "write-file",
        path: "package.json",
        content: makeRootPackage(input.packageManager),
        owner: this.id,
      },
      ...(input.packageManager === "pnpm"
        ? [
            {
              type: "write-file" as const,
              path: "pnpm-workspace.yaml",
              content: 'packages:\n  - "apps/*"\n  - "packages/*"\n',
              owner: this.id,
            },
          ]
        : []),
      {
        type: "write-file",
        path: ".gitignore",
        content: "node_modules/\n.turbo/\n.env\n.env.*\n!.env.example\ndist*/\n.expo/\n",
        owner: this.id,
      },
      {
        type: "write-file",
        path: "turbo.json",
        content:
          '{"$schema":"https://turbo.build/schema.json","tasks":{"build":{"dependsOn":["^build"],"outputs":[".next/**","!.next/cache/**","dist/**"]},"dev":{"cache":false,"persistent":true},"typecheck":{"dependsOn":["^typecheck"]},"test":{"dependsOn":["^test"]}}}\n',
        owner: this.id,
      },
      { type: "write-file", path: "README.md", content: readme, owner: this.id },
      {
        type: "write-file",
        path: "AGENTS.md",
        content:
          "# Agent notes\n\nKeep server secrets in apps/api only. Preserve the typed Hono contract and run pnpm typecheck && pnpm test after changes.\n",
        owner: this.id,
      },
      { type: "write-file", path: "docs/deployment.md", content: deployment, owner: this.id },
      {
        type: "write-file",
        path: "apps/mobile/src/data/provider.tsx",
        content: dataProvider,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/mobile/src/data/api.ts",
        content: apiClient,
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace: "apps/mobile",
        name: "@expojet/api-contract",
        version: "workspace:*",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace: "apps/mobile",
        name: "@tanstack/react-query",
        version: "^5.87.1",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "add-dependency",
        workspace: "apps/mobile",
        name: "hono",
        version: "^4.9.8",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/package.json",
        content: selectedApiPackage,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/tsconfig.json",
        content:
          '{"compilerOptions":{"target":"ES2023","module":"NodeNext","moduleResolution":"NodeNext","strict":true,"skipLibCheck":true,"noEmit":true,"types":["node"]},"include":["src/**/*.ts","drizzle.config.ts"]}\n',
        owner: this.id,
      },
      { type: "write-file", path: "apps/api/src/env.ts", content: selectedEnv, owner: this.id },
      {
        type: "write-file",
        path: "apps/api/src/db/schema.ts",
        content: selectedSchema,
        owner: this.id,
      },
      { type: "write-file", path: "apps/api/src/db/client.ts", content: dbSource, owner: this.id },
      {
        type: "write-file",
        path: "apps/api/src/app.ts",
        content: better ? betterAppSource : appSource,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/src/app.test.ts",
        content: better ? betterAppTest : appTest,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/src/index.ts",
        content:
          'import { serve } from "@hono/node-server";\nimport { app } from "./app.js";\nimport { getEnv } from "./env.js";\nconst env = getEnv();\nserve({ fetch: app.fetch, port: env.PORT }, ({ port }) => console.log("API listening on http://localhost:" + port));\n',
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/drizzle.config.ts",
        content:
          'import { defineConfig } from "drizzle-kit";\nexport default defineConfig({ schema: "./src/db/schema.ts", out: "./drizzle", dialect: "postgresql", dbCredentials: { url: process.env.DIRECT_DATABASE_URL! } });\n',
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/drizzle/0000_profiles.sql",
        content:
          'CREATE TABLE IF NOT EXISTS "profiles" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,"clerk_user_id" text NOT NULL UNIQUE,"display_name" text,"created_at" timestamptz DEFAULT now() NOT NULL,"updated_at" timestamptz DEFAULT now() NOT NULL);\nCREATE INDEX IF NOT EXISTS "profiles_clerk_user_id_idx" ON "profiles" ("clerk_user_id");\n',
        owner: this.id,
      },
      {
        type: "add-env",
        workspace: "apps/api",
        variable: {
          name: "DATABASE_URL",
          classification: "server-secret",
          description: "Pooled Neon URL for application traffic",
        },
        owner: this.id,
      },
      {
        type: "add-env",
        workspace: "apps/api",
        variable: {
          name: "DIRECT_DATABASE_URL",
          classification: "server-secret",
          description: "Direct Neon URL for migrations",
        },
        owner: this.id,
      },
      {
        type: "add-env",
        workspace: "apps/api",
        variable: {
          name: better ? "BETTER_AUTH_SECRET" : "CLERK_SECRET_KEY",
          classification: "server-secret",
        },
        owner: this.id,
      },
      {
        type: "add-env",
        workspace: "apps/api",
        variable: { name: "ALLOWED_ORIGINS", classification: "server-secret" },
        owner: this.id,
      },
      {
        type: "write-file",
        path: "packages/api-contract/package.json",
        content:
          '{"name":"@expojet/api-contract","private":true,"type":"module","types":"./src/index.ts","dependencies":{"@expojet/api":"workspace:*"},"scripts":{"typecheck":"tsc --noEmit","test":"node --test"},"devDependencies":{"@types/node":"^24.3.1","typescript":"~6.0.3"}}\n',
        owner: this.id,
      },
      {
        type: "write-file",
        path: "packages/api-contract/tsconfig.json",
        content:
          '{"compilerOptions":{"strict":true,"skipLibCheck":true,"module":"NodeNext","moduleResolution":"NodeNext","noEmit":true,"types":["node"]},"include":["src/**/*.ts"]}\n',
        owner: this.id,
      },
      {
        type: "write-file",
        path: "packages/api-contract/src/index.ts",
        content: 'export type { AppType } from "@expojet/api/app";\n',
        owner: this.id,
      },
    ];
    if (better) {
      operations.push(
        {
          type: "add-env",
          workspace: "apps/api",
          variable: { name: "BETTER_AUTH_URL", classification: "server-secret" },
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/api/src/auth/index.ts",
          content: betterAuthSource,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/api/drizzle/0001_better_auth.sql",
          content:
            'CREATE TABLE IF NOT EXISTS "user" ("id" text PRIMARY KEY,"name" text NOT NULL,"email" text NOT NULL UNIQUE,"email_verified" boolean DEFAULT false NOT NULL,"image" text,"created_at" timestamp DEFAULT now() NOT NULL,"updated_at" timestamp DEFAULT now() NOT NULL);\nCREATE TABLE IF NOT EXISTS "session" ("id" text PRIMARY KEY,"expires_at" timestamp NOT NULL,"token" text NOT NULL UNIQUE,"created_at" timestamp DEFAULT now() NOT NULL,"updated_at" timestamp DEFAULT now() NOT NULL,"ip_address" text,"user_agent" text,"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade);\nCREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" ("user_id");\nCREATE TABLE IF NOT EXISTS "account" ("id" text PRIMARY KEY,"account_id" text NOT NULL,"provider_id" text NOT NULL,"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,"access_token" text,"refresh_token" text,"id_token" text,"access_token_expires_at" timestamp,"refresh_token_expires_at" timestamp,"scope" text,"password" text,"created_at" timestamp DEFAULT now() NOT NULL,"updated_at" timestamp DEFAULT now() NOT NULL);\nCREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" ("user_id");\nCREATE TABLE IF NOT EXISTS "verification" ("id" text PRIMARY KEY,"identifier" text NOT NULL,"value" text NOT NULL,"expires_at" timestamp NOT NULL,"created_at" timestamp DEFAULT now(),"updated_at" timestamp DEFAULT now());\nCREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");\n',
          owner: this.id,
        },
      );
    }
    if (input.auth === "clerk")
      operations.push({
        type: "write-file",
        path: "apps/mobile/src/data/use-me.ts",
        content: useMe,
        owner: this.id,
      });
    if (input.structure === "monorepo-web") {
      operations.push(
        {
          type: "write-file",
          path: "apps/web/package.json",
          content: makeWebPackage(input.packageManager),
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/web/tsconfig.json",
          content: webTsConfig,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/web/next.config.ts",
          content: webNextConfig,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/web/next-env.d.ts",
          content: webNextEnv,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/web/src/api.ts",
          content: webApiClient,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/web/app/providers.tsx",
          content: webProviders,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/web/app/layout.tsx",
          content: webLayout,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/web/app/page.tsx",
          content: webPage,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/web/app/page.test.tsx",
          content: webPageTest,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "apps/web/.env.example",
          content: "NEXT_PUBLIC_API_URL=http://localhost:3000\n",
          owner: this.id,
        },
        {
          type: "add-env",
          workspace: "apps/web",
          variable: {
            name: "NEXT_PUBLIC_API_URL",
            classification: "public",
            description: "Hono API base URL",
          },
          owner: this.id,
        },
      );
    }
    return operations;
  },
};
