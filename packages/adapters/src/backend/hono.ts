import type { CreateInput } from "@expojet/schemas";
import type { Adapter } from "../contract.js";
import { noOptions } from "../shared/adapter-kit.js";
import { apiTsConfig, contractPackageHono, contractTsConfig } from "./contract.js";

// ---------------------------------------------------------------------------
// Shared Environment Template
// ---------------------------------------------------------------------------

export function makeApiEnv(input: CreateInput) {
  const hasPostgres =
    input.database === "neon" || input.database === "postgres" || input.database === "supabase";
  const hasSqlite = input.database === "sqlite";
  const hasBetterAuth = input.auth === "better-auth";
  const hasClerk = input.auth === "clerk";
  const hasSupabase = input.auth === "supabase";
  const hasFirebase = input.auth === "firebase";
  const hasJwt = input.auth === "jwt";

  const lines: string[] = [];
  if (hasPostgres) {
    lines.push("DATABASE_URL: z.string().url(),");
    lines.push("DIRECT_DATABASE_URL: z.string().url(),");
  } else if (hasSqlite) {
    lines.push("DATABASE_URL: z.string().min(1),");
  }

  if (hasBetterAuth) {
    lines.push("BETTER_AUTH_SECRET: z.string().min(32),");
    lines.push("BETTER_AUTH_URL: z.string().url(),");
  } else if (hasClerk) {
    lines.push("CLERK_SECRET_KEY: z.string().min(1),");
  } else if (hasSupabase) {
    lines.push("SUPABASE_URL: z.string().url(),");
    lines.push("SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),");
  } else if (hasFirebase) {
    lines.push("FIREBASE_PROJECT_ID: z.string().min(1),");
  } else if (hasJwt) {
    lines.push("JWT_SECRET: z.string().min(32),");
    lines.push("JWT_REFRESH_SECRET: z.string().min(32),");
  }

  lines.push("PORT: z.coerce.number().int().positive().default(3000),");
  lines.push('ALLOWED_ORIGINS: z.string().default("http://localhost:8081"),');

  return `import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export function getEnv() {
  return createEnv({
    server: {
      ${lines.join("\n      ")}
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
  });
}
`;
}

// ---------------------------------------------------------------------------
// Hono Templates
// ---------------------------------------------------------------------------

function makeHonoPackage(auth: CreateInput["auth"]) {
  const better = auth === "better-auth";
  const supabase = auth === "supabase";
  const firebase = auth === "firebase";

  const authDeps: Record<string, string> = {};
  if (better) {
    authDeps["@better-auth/expo"] = "^1.7.5";
    authDeps["better-auth"] = "^1.7.5";
  } else if (supabase) {
    authDeps["@supabase/supabase-js"] = "^2.49.1";
  } else if (firebase) {
    authDeps["firebase-admin"] = "^13.1.0";
  } else if (auth === "clerk") {
    authDeps["@clerk/backend"] = "^2.14.0";
  }

  return `${JSON.stringify(
    {
      name: "@expojet/api",
      private: true,
      type: "module",
      exports: { ".": "./src/index.ts", "./app": "./src/app.ts" },
      scripts: {
        dev: "tsx watch src/index.ts",
        start: "tsx src/index.ts",
        typecheck: "tsc --noEmit",
        test: "vitest run",
      },
      dependencies: {
        "@hono/node-server": "^1.19.1",
        "@t3-oss/env-core": "^0.13.11",
        hono: "^4.9.8",
        zod: "^4.1.5",
        ...authDeps,
      },
      devDependencies: {
        "@types/node": "^24.3.1",
        tsx: "^4.20.5",
        typescript: "~6.0.3",
        vitest: "^3.2.4",
      },
    },
    null,
    2,
  )}\n`;
}

export function makeHonoAppSource(input: CreateInput) {
  const isBetterAuth = input.auth === "better-auth";
  if (isBetterAuth) {
    return `import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { auth } from "./auth/index.js";

type Variables = { requestId: string };
const failure = (code: string, message: string, requestId: string) => ({ error: { code, message, requestId } });

export function createApp() {
  return new Hono<{ Variables: Variables }>()
    .use("*", async (c, next) => { c.set("requestId", c.req.header("x-request-id") ?? crypto.randomUUID()); await next(); c.header("x-request-id", c.get("requestId")); })
    .use("*", secureHeaders())
    .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
    .get("/health", (c) => c.json({ ok: true, service: "expojet-api", auth: "better-auth-experimental" }))
    .get("/v1/me", async (c) => { const session = await auth.api.getSession({ headers: c.req.raw.headers }); if (!session) return c.json(failure("UNAUTHORIZED", "Authentication is required", c.get("requestId")), 401); return c.json({ user: session.user }); })
    .notFound((c) => c.json(failure("NOT_FOUND", "Route not found", c.get("requestId")), 404))
    .onError((error, c) => { console.error(error); return c.json(failure("INTERNAL_ERROR", "An unexpected error occurred", c.get("requestId")), 500); });
}

export const app = createApp();
export type AppType = ReturnType<typeof createApp>;
`;
  }

  const isClerk = input.auth === "clerk";
  const isSupabase = input.auth === "supabase";
  const isFirebase = input.auth === "firebase";
  const isJwt = input.auth === "jwt";

  let authHeader = "";
  let authHelpers = "";
  let verifyCall = '() => Promise.resolve({ sub: "local-user" })';

  if (isClerk) {
    authHeader = 'import { verifyToken as verifyClerkToken } from "@clerk/backend";\n';
    verifyCall = "(token) => verifyClerkToken(token, { secretKey: getEnv().CLERK_SECRET_KEY })";
  } else if (isSupabase) {
    authHeader = 'import { createClient } from "@supabase/supabase-js";\n';
    authHelpers = `let supabaseAdmin: ReturnType<typeof createClient> | undefined;
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const env = getEnv();
    supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return supabaseAdmin;
}
`;
    verifyCall = `async (token) => {
    const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !user) throw new Error("Invalid Supabase token");
    return { sub: user.id };
  }`;
  } else if (isFirebase) {
    authHeader = 'import admin from "firebase-admin";\n';
    authHelpers = `function getFirebaseAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: getEnv().FIREBASE_PROJECT_ID });
  }
  return admin;
}
`;
    verifyCall = `async (token) => {
    const decoded = await getFirebaseAdmin().auth().verifyIdToken(token);
    return { sub: decoded.uid };
  }`;
  } else if (isJwt) {
    authHeader = 'import { sign, verify } from "hono/jwt";\n';
    verifyCall = `async (token) => {
    const payload = await verify(token, getEnv().JWT_SECRET, "HS256");
    return { sub: payload.sub as string };
  }`;
  }

  let dbImports = "";
  let findProfileBody = "return null;";

  if (input.orm === "drizzle") {
    dbImports = `import { eq } from "drizzle-orm";
import { getDb } from "./db/client.js";
import { profiles, type Profile } from "./db/schema.js";
`;
    findProfileBody = `return (await getDb().select().from(profiles).where(eq(profiles.clerkUserId, userId)).limit(1))[0] ?? null;`;
  } else if (input.orm === "prisma") {
    dbImports = `import { getDb, type Profile } from "./db/client.js";
`;
    findProfileBody = `return (await getDb().profile.findUnique({ where: { clerkUserId: userId } })) ?? null;`;
  } else {
    dbImports = `type Profile = { id: string; clerkUserId: string; displayName: string | null };\n`;
  }

  const jwtRoutes = isJwt
    ? `\n    .post("/auth/register", async (c) => {
      const body = await c.req.json().catch(() => ({}));
      const email = body.email || "user@example.com";
      const name = body.name || email.split("@")[0];
      const userId = "jwt_user_" + Math.random().toString(36).substring(2, 9);
      const accessToken = await sign({ sub: userId, email, name, exp: Math.floor(Date.now() / 1000) + 60 * 15 }, getEnv().JWT_SECRET, "HS256");
      const refreshToken = await sign({ sub: userId, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, getEnv().JWT_REFRESH_SECRET, "HS256");
      return c.json({ user: { id: userId, email, displayName: name }, accessToken, refreshToken });
    })
    .post("/auth/login", async (c) => {
      const body = await c.req.json().catch(() => ({}));
      const email = body.email || "user@example.com";
      const userId = "jwt_user_1";
      const accessToken = await sign({ sub: userId, email, exp: Math.floor(Date.now() / 1000) + 60 * 15 }, getEnv().JWT_SECRET, "HS256");
      const refreshToken = await sign({ sub: userId, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, getEnv().JWT_REFRESH_SECRET, "HS256");
      return c.json({ user: { id: userId, email, displayName: email.split("@")[0] }, accessToken, refreshToken });
    })
    .post("/auth/refresh", async (c) => {
      const body = await c.req.json().catch(() => ({}));
      if (!body.refreshToken) return c.json(failure("BAD_REQUEST", "Missing refresh token", c.get("requestId")), 400);
      try {
        const payload = await verify(body.refreshToken, getEnv().JWT_REFRESH_SECRET, "HS256");
        const userId = (payload.sub as string) || "jwt_user_1";
        const accessToken = await sign({ sub: userId, exp: Math.floor(Date.now() / 1000) + 60 * 15 }, getEnv().JWT_SECRET, "HS256");
        const refreshToken = await sign({ sub: userId, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, getEnv().JWT_REFRESH_SECRET, "HS256");
        return c.json({ accessToken, refreshToken });
      } catch {
        return c.json(failure("UNAUTHORIZED", "Invalid refresh token", c.get("requestId")), 401);
      }
    })`
    : "";

  return `${authHeader}${dbImports}import { Hono } from "hono";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import { secureHeaders } from "hono/secure-headers";
import { getEnv } from "./env.js";

type Variables = { requestId: string; userId: string };
type Dependencies = {
  verifyToken(token: string): Promise<{ sub?: string | null }>;
  findProfile(userId: string): Promise<Profile | null>;
};

${authHelpers}const defaults: Dependencies = {
  verifyToken: ${verifyCall},
  async findProfile(userId) {
    ${findProfileBody}
  },
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
      c.set("userId", claims.sub);
      await next();
    } catch {
      return c.json(failure("UNAUTHORIZED", "The bearer token is invalid", c.get("requestId")), 401);
    }
  });

  return new Hono<{ Variables: Variables }>()
    .use("*", async (c, next) => {
      c.set("requestId", c.req.header("x-request-id") ?? crypto.randomUUID());
      await next();
      c.header("x-request-id", c.get("requestId"));
    })
    .use("*", secureHeaders())
    .use("/v1/*", cors({
      origin: (origin) => {
        const allowed = (process.env.ALLOWED_ORIGINS ?? "http://localhost:8081").split(",");
        return allowed.includes(origin) ? origin : allowed[0]!;
      },
      credentials: true,
    }))${jwtRoutes}
    .get("/health", (c) => c.json({ ok: true, service: "expojet-api" }))
    .get("/v1/me", auth, async (c) => {
      const userId = c.get("userId");
      return c.json({ user: { id: userId }, profile: await dependencies.findProfile(userId) });
    })
    .notFound((c) => c.json(failure("NOT_FOUND", "Route not found", c.get("requestId")), 404))
    .onError((error, c) => {
      console.error(error);
      return c.json(failure("INTERNAL_ERROR", "An unexpected error occurred", c.get("requestId")), 500);
    });
}

export const app = createApp();
export type AppType = ReturnType<typeof createApp>;
`;
}

const honoAppTest = `import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";

const deps = { verifyToken: vi.fn(async () => ({ sub: "user_123" })), findProfile: vi.fn(async () => null) };

describe("API contract", () => {
  it("reports health", async () => {
    const response = await createApp(deps).request("/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true });
  });

  it("normalizes missing authentication", async () => {
    const response = await createApp(deps).request("/v1/me");
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } });
  });

  it("returns the authenticated subject", async () => {
    const response = await createApp(deps).request("/v1/me", {
      headers: { authorization: "Bearer test" },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ user: { id: "user_123" } });
  });
});
`;

const betterAppTest = `import { describe, expect, it } from "vitest";

process.env.DATABASE_URL = "postgresql://test:test@localhost/test";
process.env.DIRECT_DATABASE_URL = process.env.DATABASE_URL;
process.env.BETTER_AUTH_SECRET = "test-secret-that-is-at-least-32-characters";
process.env.BETTER_AUTH_URL = "http://localhost:3000";

describe("experimental Better Auth API", () => {
  it("reports experimental status", async () => {
    const { createApp } = await import("./app.js");
    const response = await createApp().request("/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, auth: "better-auth-experimental" });
  }, 20_000);
});
`;

const honoIndex = `import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { getEnv } from "./env.js";

const env = getEnv();
serve({ fetch: app.fetch, port: env.PORT }, ({ port }) => console.log("API listening on http://localhost:" + port));
`;

const honoApiClient = `import type { AppType } from "@expojet/api-contract";
import { hc } from "hono/client";
import { env } from "../env";

export function createApiClient(getToken: () => Promise<string | null>) {
  return hc<AppType>(env.EXPO_PUBLIC_API_URL, {
    fetch: async (input: string | Request | URL, init?: RequestInit) => {
      const token = await getToken();
      const headers = new Headers(init?.headers);
      if (token) headers.set("authorization", "Bearer " + token);
      return fetch(input instanceof URL ? input.toString() : input, { ...init, headers });
    },
  });
}
`;

// ---------------------------------------------------------------------------
// Express Templates
// ---------------------------------------------------------------------------

export const honoBackendAdapter: Adapter = {
  id: "backend:hono",
  version: "1.0.0",
  kind: "api",
  displayName: "Hono Platform",
  capabilities: () => ({ sdk: [57, 58], requires: ["monorepo"], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    if (input.structure === "standalone") return [];

    const better = input.auth === "better-auth";

    return [
      {
        type: "write-file",
        path: "apps/mobile/src/data/api.ts",
        content: honoApiClient,
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
        name: "hono",
        version: "^4.9.8",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/package.json",
        content: makeHonoPackage(input.auth),
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/tsconfig.json",
        content: apiTsConfig,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/src/env.ts",
        content: makeApiEnv(input),
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/src/app.ts",
        content: makeHonoAppSource(input),
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/src/app.test.ts",
        content: better ? betterAppTest : honoAppTest,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/src/index.ts",
        content: honoIndex,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "packages/api-contract/package.json",
        content: contractPackageHono,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "packages/api-contract/tsconfig.json",
        content: contractTsConfig,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "packages/api-contract/src/index.ts",
        content: 'export type { AppType } from "@expojet/api/app";\n',
        owner: this.id,
      },
    ];
  },
};
