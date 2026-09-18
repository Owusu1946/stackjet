import type { Operation } from "@expojet/core";
import type { BackendAdapter, CreateInput } from "@expojet/schemas";
import { z } from "zod";
import type { Adapter } from "./contract.js";

const noOptions = z.object({}).strict();

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
    }))
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

function makeExpressPackage(auth: CreateInput["auth"]) {
  const authDeps: Record<string, string> = {};
  if (auth === "clerk") authDeps["@clerk/backend"] = "^2.14.0";
  if (auth === "supabase") authDeps["@supabase/supabase-js"] = "^2.49.1";
  if (auth === "firebase") authDeps["firebase-admin"] = "^13.1.0";
  if (auth === "better-auth") {
    authDeps["@better-auth/expo"] = "^1.7.5";
    authDeps["better-auth"] = "^1.7.5";
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
        "@t3-oss/env-core": "^0.13.11",
        cors: "^2.8.5",
        express: "^4.21.2",
        helmet: "^8.0.0",
        zod: "^3.24.2",
        ...authDeps,
      },
      devDependencies: {
        "@types/cors": "^2.8.17",
        "@types/express": "^5.0.0",
        "@types/node": "^24.3.1",
        "@types/supertest": "^6.0.2",
        supertest: "^7.0.0",
        tsx: "^4.20.5",
        typescript: "~6.0.3",
        vitest: "^3.2.4",
      },
    },
    null,
    2,
  )}\n`;
}

function makeExpressAppSource(input: CreateInput) {
  const isClerk = input.auth === "clerk";
  const isSupabase = input.auth === "supabase";
  const isFirebase = input.auth === "firebase";

  let authHeader = "";
  let authHelpers = "";
  let verifyCall = '() => Promise.resolve({ sub: "local-user" })';

  if (isClerk) {
    authHeader = 'import { verifyToken as verifyClerkToken } from "@clerk/backend";\n';
    verifyCall =
      "(token: string) => verifyClerkToken(token, { secretKey: getEnv().CLERK_SECRET_KEY })";
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
    verifyCall = `async (token: string) => {
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
    verifyCall = `async (token: string) => {
    const decoded = await getFirebaseAdmin().auth().verifyIdToken(token);
    return { sub: decoded.uid };
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
    dbImports = `export type Profile = { id: string; clerkUserId: string; displayName: string | null };\n`;
  }

  return `import cors from "cors";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import helmet from "helmet";
${authHeader}${dbImports}import { getEnv } from "./env.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export type Dependencies = {
  verifyToken: (token: string) => Promise<{ sub?: string | null }>;
  findProfile: (userId: string) => Promise<Profile | null>;
};

${authHelpers}const defaults: Dependencies = {
  verifyToken: ${verifyCall},
  async findProfile(userId: string) {
    ${findProfileBody}
  },
};

export function createApp(overrides: Partial<Dependencies> = {}): Express {
  const dependencies = { ...defaults, ...overrides };
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: (process.env.ALLOWED_ORIGINS ?? "http://localhost:8081").split(","),
      credentials: true,
    }),
  );
  app.use(express.json());

  app.use((req: Request, res: Response, next: NextFunction) => {
    const reqId = (req.header("x-request-id") ?? crypto.randomUUID()) as string;
    (req as any).requestId = reqId;
    res.setHeader("x-request-id", reqId);
    next();
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, service: "expojet-api" });
  });

  const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "A bearer token is required" },
      });
    }

    try {
      const claims = await dependencies.verifyToken(header.slice(7));
      if (!claims.sub) throw new Error("Token has no subject");
      req.userId = claims.sub;
      next();
    } catch {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "The bearer token is invalid" },
      });
    }
  };

  app.get("/v1/me", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const profile = await dependencies.findProfile(userId);
    res.json({ user: { id: userId }, profile });
  });

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } });
  });

  return app;
}

export const app = createApp();
export type AppType = typeof app;
`;
}

const expressAppTest = `import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";

const deps = {
  verifyToken: vi.fn(async () => ({ sub: "user_123" })),
  findProfile: vi.fn(async () => null),
};

describe("Express API contract", () => {
  it("reports health", async () => {
    const res = await request(createApp(deps)).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, service: "expojet-api" });
  });

  it("normalizes missing authentication", async () => {
    const res = await request(createApp(deps)).get("/v1/me");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: { code: "UNAUTHORIZED" } });
  });

  it("returns authenticated subject", async () => {
    const res = await request(createApp(deps))
      .get("/v1/me")
      .set("authorization", "Bearer test");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ user: { id: "user_123" } });
  });
});
`;

const expressIndex = `import { app } from "./app.js";
import { getEnv } from "./env.js";

const env = getEnv();
app.listen(env.PORT, () => {
  console.log("Express API listening on http://localhost:" + env.PORT);
});
`;

// ---------------------------------------------------------------------------
// NestJS Templates
// ---------------------------------------------------------------------------

function makeNestPackage(auth: CreateInput["auth"]) {
  const authDeps: Record<string, string> = {};
  if (auth === "clerk") authDeps["@clerk/backend"] = "^2.14.0";
  if (auth === "supabase") authDeps["@supabase/supabase-js"] = "^2.49.1";
  if (auth === "firebase") authDeps["firebase-admin"] = "^13.1.0";

  return `${JSON.stringify(
    {
      name: "@expojet/api",
      private: true,
      type: "module",
      exports: { ".": "./src/main.ts", "./app": "./src/app.module.ts" },
      scripts: {
        dev: "tsx watch src/main.ts",
        start: "tsx src/main.ts",
        typecheck: "tsc --noEmit",
        test: "vitest run",
      },
      dependencies: {
        "@nestjs/common": "^11.0.11",
        "@nestjs/core": "^11.0.11",
        "@nestjs/platform-express": "^11.0.11",
        "@t3-oss/env-core": "^0.13.11",
        "reflect-metadata": "^0.2.2",
        rxjs: "^7.8.2",
        zod: "^3.24.2",
        ...authDeps,
      },
      devDependencies: {
        "@nestjs/testing": "^11.0.11",
        "@types/node": "^24.3.1",
        "@types/supertest": "^6.0.2",
        supertest: "^7.0.0",
        tsx: "^4.20.5",
        typescript: "~6.0.3",
        vitest: "^3.2.4",
      },
    },
    null,
    2,
  )}\n`;
}

const nestTsConfig = `{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "drizzle.config.ts"]
}
`;

const nestMain = `import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { getEnv } from "./env.js";

async function bootstrap() {
  const env = getEnv();
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (process.env.ALLOWED_ORIGINS ?? "http://localhost:8081").split(","),
    credentials: true,
  });
  await app.listen(env.PORT);
  console.log("NestJS API listening on http://localhost:" + env.PORT);
}

bootstrap();
`;

const nestAppModule = `import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller.js";
import { MeController } from "./me.controller.js";
import { AuthService } from "./auth.service.js";

@Module({
  controllers: [HealthController, MeController],
  providers: [AuthService],
})
export class AppModule {}
`;

const nestHealthController = `import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  getHealth() {
    return { ok: true, service: "expojet-api" };
  }
}
`;

const nestMeController = `import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "./auth.guard.js";
import { AuthService } from "./auth.service.js";

@Controller("v1/me")
@UseGuards(AuthGuard)
export class MeController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  async getMe(@Req() req: any) {
    const userId = req.user.sub;
    const profile = await this.authService.findProfile(userId);
    return { user: { id: userId }, profile };
  }
}
`;

const nestAuthGuard = `import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service.js";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedException({ error: { code: "UNAUTHORIZED", message: "A bearer token is required" } });
    }

    try {
      const claims = await this.authService.verifyToken(header.slice(7));
      if (!claims.sub) throw new Error("No subject");
      req.user = claims;
      return true;
    } catch {
      throw new UnauthorizedException({ error: { code: "UNAUTHORIZED", message: "Invalid bearer token" } });
    }
  }
}
`;

function makeNestAuthService(input: CreateInput) {
  const isClerk = input.auth === "clerk";
  const isSupabase = input.auth === "supabase";
  const isFirebase = input.auth === "firebase";

  let authImport = "";
  let verifyBody = 'return { sub: "local-user" };';

  if (isClerk) {
    authImport = 'import { verifyToken as verifyClerkToken } from "@clerk/backend";\n';
    verifyBody = "return verifyClerkToken(token, { secretKey: getEnv().CLERK_SECRET_KEY });";
  } else if (isSupabase) {
    authImport = 'import { createClient } from "@supabase/supabase-js";\n';
    verifyBody = `const env = getEnv();
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) throw new Error("Invalid Supabase token");
    return { sub: user.id };`;
  } else if (isFirebase) {
    authImport = 'import admin from "firebase-admin";\n';
    verifyBody = `if (!admin.apps.length) admin.initializeApp({ projectId: getEnv().FIREBASE_PROJECT_ID });
    const decoded = await admin.auth().verifyIdToken(token);
    return { sub: decoded.uid };`;
  }

  let dbImport = "";
  let profileBody = "return null;";

  if (input.orm === "drizzle") {
    dbImport = `import { eq } from "drizzle-orm";\nimport { getDb } from "./db/client.js";\nimport { profiles } from "./db/schema.js";\n`;
    profileBody =
      "return (await getDb().select().from(profiles).where(eq(profiles.clerkUserId, userId)).limit(1))[0] ?? null;";
  } else if (input.orm === "prisma") {
    dbImport = `import { getDb } from "./db/client.js";\n`;
    profileBody =
      "return (await getDb().profile.findUnique({ where: { clerkUserId: userId } })) ?? null;";
  }

  return `import { Injectable } from "@nestjs/common";
${authImport}${dbImport}import { getEnv } from "./env.js";

@Injectable()
export class AuthService {
  async verifyToken(token: string): Promise<{ sub?: string | null }> {
    ${verifyBody}
  }

  async findProfile(userId: string): Promise<any> {
    ${profileBody}
  }
}
`;
}

const nestAppTest = `import { Test } from "@nestjs/testing";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { AppModule } from "./app.module.js";
import { AuthService } from "./auth.service.js";

describe("NestJS API contract", () => {
  it("reports health", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, service: "expojet-api" });
    await app.close();
  });

  it("normalizes missing authentication", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer()).get("/v1/me");
    expect(res.status).toBe(401);
    await app.close();
  });

  it("returns authenticated subject", async () => {
    const mockAuth = {
      verifyToken: vi.fn(async () => ({ sub: "user_123" })),
      findProfile: vi.fn(async () => null),
    };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AuthService)
      .useValue(mockAuth)
      .compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer())
      .get("/v1/me")
      .set("authorization", "Bearer test");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ user: { id: "user_123" } });
    await app.close();
  });
});
`;

// ---------------------------------------------------------------------------
// Shared Fetch API Client for Express & NestJS
// ---------------------------------------------------------------------------

const typedApiClientSource = `import type { HealthResponse, MeResponse } from "@expojet/api-contract";
import { env } from "../env";

export function createApiClient(getToken: () => Promise<string | null>) {
  return {
    v1: {
      me: {
        $get: async () => {
          const token = await getToken();
          const headers = new Headers();
          if (token) headers.set("authorization", "Bearer " + token);
          const response = await fetch(env.EXPO_PUBLIC_API_URL + "/v1/me", { headers });
          return {
            ok: response.ok,
            status: response.status,
            json: () => response.json() as Promise<MeResponse>,
          };
        },
      },
    },
    health: {
      $get: async () => {
        const response = await fetch(env.EXPO_PUBLIC_API_URL + "/health");
        return {
          ok: response.ok,
          status: response.status,
          json: () => response.json() as Promise<HealthResponse>,
        };
      },
    },
  };
}
`;

const sharedContractSource = `export interface HealthResponse {
  ok: boolean;
  service: string;
}

export interface MeResponse {
  user: { id: string };
  profile: { id: string; clerkUserId?: string; displayName: string | null } | null;
}

export type AppType = {
  health: HealthResponse;
  me: MeResponse;
};
`;

const apiTsConfig = `{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "drizzle.config.ts"]
}
`;

const contractTsConfig = `{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"]
}
`;

const contractPackageHono = `{
  "name": "@expojet/api-contract",
  "private": true,
  "type": "module",
  "types": "./src/index.ts",
  "dependencies": {
    "@expojet/api": "workspace:*"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "node --test"
  },
  "devDependencies": {
    "@types/node": "^24.3.1",
    "typescript": "~6.0.3"
  }
}
`;

const contractPackageShared = `{
  "name": "@expojet/api-contract",
  "private": true,
  "type": "module",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "node --test"
  },
  "devDependencies": {
    "@types/node": "^24.3.1",
    "typescript": "~6.0.3"
  }
}
`;

// ---------------------------------------------------------------------------
// Convex Templates
// ---------------------------------------------------------------------------

const convexSchema = `import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),
});
`;

const convexUsers = `import { v } from "convex/values";
import { query } from "./_generated/server";

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
  },
});

export const health = query({
  args: {},
  handler: async () => {
    return { ok: true, service: "convex-backend" };
  },
});
`;

const convexTsConfig = `{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["ESNext"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["./**/*.ts"]
}
`;

const convexProvider = `import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { PropsWithChildren } from "react";
import { env } from "../env";

const convex = new ConvexReactClient(env.EXPO_PUBLIC_CONVEX_URL, {
  unsavedChangesWarning: false,
});

export function DataProvider({ children }: PropsWithChildren) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
`;

// ---------------------------------------------------------------------------
// Adapter Implementations
// ---------------------------------------------------------------------------

export const honoBackendAdapter: Adapter = {
  id: "backend:hono",
  version: "1.0.0",
  kind: "api",
  displayName: "Hono Platform",
  capabilities: () => ({ sdk: [57], requires: ["monorepo"], conflicts: [] }),
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

export const expressBackendAdapter: Adapter = {
  id: "backend:express",
  version: "1.0.0",
  kind: "api",
  displayName: "Express REST API",
  capabilities: () => ({ sdk: [57], requires: ["monorepo"], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    if (input.structure === "standalone") return [];

    return [
      {
        type: "write-file",
        path: "apps/mobile/src/data/api.ts",
        content: typedApiClientSource,
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
        type: "write-file",
        path: "apps/api/package.json",
        content: makeExpressPackage(input.auth),
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
        content: makeExpressAppSource(input),
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/src/app.test.ts",
        content: expressAppTest,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/src/index.ts",
        content: expressIndex,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "packages/api-contract/package.json",
        content: contractPackageShared,
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
        content: sharedContractSource,
        owner: this.id,
      },
    ];
  },
};

export const nestjsBackendAdapter: Adapter = {
  id: "backend:nestjs",
  version: "1.0.0",
  kind: "api",
  displayName: "NestJS Modular API",
  capabilities: () => ({ sdk: [57], requires: ["monorepo"], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    if (input.structure === "standalone") return [];

    return [
      {
        type: "write-file",
        path: "apps/mobile/src/data/api.ts",
        content: typedApiClientSource,
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
        type: "write-file",
        path: "apps/api/package.json",
        content: makeNestPackage(input.auth),
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/tsconfig.json",
        content: nestTsConfig,
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
        path: "apps/api/src/main.ts",
        content: nestMain,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/src/app.module.ts",
        content: nestAppModule,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/src/health.controller.ts",
        content: nestHealthController,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/src/me.controller.ts",
        content: nestMeController,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/src/auth.guard.ts",
        content: nestAuthGuard,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/src/auth.service.ts",
        content: makeNestAuthService(input),
        owner: this.id,
      },
      {
        type: "write-file",
        path: "apps/api/src/app.test.ts",
        content: nestAppTest,
        owner: this.id,
      },
      {
        type: "write-file",
        path: "packages/api-contract/package.json",
        content: contractPackageShared,
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
        content: sharedContractSource,
        owner: this.id,
      },
    ];
  },
};

export const convexBackendAdapter: Adapter = {
  id: "backend:convex",
  version: "1.0.0",
  kind: "api",
  displayName: "Convex Reactive Backend",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan(input) {
    const isStandalone = input.structure === "standalone";
    const convexDir = isStandalone ? "convex" : "apps/api/convex";
    const mobileRoot = isStandalone ? "" : "apps/mobile/";
    const workspace = isStandalone ? "." : "apps/mobile";

    const operations: Operation[] = [
      {
        type: "add-dependency",
        workspace,
        name: "convex",
        version: "^1.19.4",
        kind: "dependencies",
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${convexDir}/schema.ts`,
        content: convexSchema,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${convexDir}/users.ts`,
        content: convexUsers,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${convexDir}/tsconfig.json`,
        content: convexTsConfig,
        owner: this.id,
      },
      {
        type: "write-file",
        path: `${mobileRoot}src/data/provider.tsx`,
        content: convexProvider,
        owner: this.id,
      },
      {
        type: "add-env",
        workspace,
        variable: {
          name: "EXPO_PUBLIC_CONVEX_URL",
          classification: "public",
          description: "Convex deployment URL",
        },
        owner: this.id,
      },
      ...(isStandalone
        ? [
            {
              type: "add-script" as const,
              workspace: ".",
              name: "convex:dev",
              command: "convex dev",
              owner: this.id,
            },
          ]
        : []),
    ];

    if (!isStandalone) {
      operations.push(
        {
          type: "write-file",
          path: "apps/api/package.json",
          content: `${JSON.stringify(
            {
              name: "@expojet/api",
              private: true,
              type: "module",
              scripts: {
                dev: "convex dev",
                "convex:dev": "convex dev",
                typecheck: "tsc --noEmit",
              },
              dependencies: {
                convex: "^1.19.4",
              },
              devDependencies: {
                typescript: "~6.0.3",
              },
            },
            null,
            2,
          )}\n`,
          owner: this.id,
        },
        {
          type: "write-file",
          path: "packages/api-contract/package.json",
          content:
            '{"name":"@expojet/api-contract","private":true,"type":"module","types":"./src/index.ts","scripts":{"typecheck":"tsc --noEmit"}}\n',
          owner: this.id,
        },
        {
          type: "write-file",
          path: "packages/api-contract/src/index.ts",
          content: 'export const backend = "convex";\n',
          owner: this.id,
        },
      );
    }

    return operations;
  },
};

export const noneBackendAdapter: Adapter = {
  id: "backend:none",
  version: "1.0.0",
  kind: "api",
  displayName: "No Backend",
  capabilities: () => ({ sdk: [57], requires: [], conflicts: [] }),
  optionsSchema: () => noOptions,
  plan() {
    return [];
  },
};

export function backendAdapter(id: BackendAdapter): Adapter {
  switch (id) {
    case "hono":
      return honoBackendAdapter;
    case "express":
      return expressBackendAdapter;
    case "nestjs":
      return nestjsBackendAdapter;
    case "convex":
      return convexBackendAdapter;
    case "none":
      return noneBackendAdapter;
  }
}
