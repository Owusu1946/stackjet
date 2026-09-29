import type { CreateInput } from "@expojet/schemas";
import type { Adapter } from "../contract.js";
import { noOptions } from "../shared/adapter-kit.js";
import {
  apiTsConfig,
  contractPackageShared,
  contractTsConfig,
  sharedContractSource,
  typedApiClientSource,
} from "./contract.js";
import { makeApiEnv } from "./hono.js";

// ---------------------------------------------------------------------------
// Shared Environment Template
// ---------------------------------------------------------------------------

function makeExpressPackage(auth: CreateInput["auth"]) {
  const authDeps: Record<string, string> = {};
  const authDevDeps: Record<string, string> = {};
  if (auth === "clerk") authDeps["@clerk/backend"] = "^2.14.0";
  if (auth === "supabase") authDeps["@supabase/supabase-js"] = "^2.49.1";
  if (auth === "firebase") authDeps["firebase-admin"] = "^13.1.0";
  if (auth === "better-auth") {
    authDeps["@better-auth/expo"] = "^1.7.5";
    authDeps["better-auth"] = "^1.7.5";
  }
  if (auth === "jwt") {
    authDeps.jsonwebtoken = "^9.0.2";
    authDevDeps["@types/jsonwebtoken"] = "^9.0.8";
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
        ...authDevDeps,
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
  const isJwt = input.auth === "jwt";

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
  } else if (isJwt) {
    authHeader = 'import jwt from "jsonwebtoken";\n';
    verifyCall = `(token: string) => {
    try {
      const decoded = jwt.verify(token, getEnv().JWT_SECRET) as { sub?: string };
      return Promise.resolve({ sub: decoded.sub ?? "jwt-user" });
    } catch {
      return Promise.reject(new Error("Invalid token"));
    }
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

  const expressJwtRoutes = isJwt
    ? `
  app.post("/auth/register", (req: Request, res: Response) => {
    const email = req.body?.email || "user@example.com";
    const name = req.body?.name || email.split("@")[0];
    const userId = "jwt_user_" + Math.random().toString(36).substring(2, 9);
    const accessToken = jwt.sign({ sub: userId, email, name }, getEnv().JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ sub: userId }, getEnv().JWT_REFRESH_SECRET, { expiresIn: "7d" });
    res.json({ user: { id: userId, email, displayName: name }, accessToken, refreshToken });
  });

  app.post("/auth/login", (req: Request, res: Response) => {
    const email = req.body?.email || "user@example.com";
    const userId = "jwt_user_1";
    const accessToken = jwt.sign({ sub: userId, email }, getEnv().JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ sub: userId }, getEnv().JWT_REFRESH_SECRET, { expiresIn: "7d" });
    res.json({ user: { id: userId, email, displayName: email.split("@")[0] }, accessToken, refreshToken });
  });

  app.post("/auth/refresh", (req: Request, res: Response) => {
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken) return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Missing refresh token" } });
    try {
      const decoded = jwt.verify(refreshToken, getEnv().JWT_REFRESH_SECRET) as { sub?: string };
      const userId = decoded.sub || "jwt_user_1";
      const accessToken = jwt.sign({ sub: userId }, getEnv().JWT_SECRET, { expiresIn: "15m" });
      const newRefreshToken = jwt.sign({ sub: userId }, getEnv().JWT_REFRESH_SECRET, { expiresIn: "7d" });
      res.json({ accessToken, refreshToken: newRefreshToken });
    } catch {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid refresh token" } });
    }
  });
`
    : "";

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
  });${expressJwtRoutes}

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

export const expressBackendAdapter: Adapter = {
  id: "backend:express",
  version: "1.0.0",
  kind: "api",
  displayName: "Express REST API",
  capabilities: () => ({ sdk: [57, 58], requires: ["monorepo"], conflicts: [] }),
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
