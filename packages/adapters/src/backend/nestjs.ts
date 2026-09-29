import type { CreateInput } from "@expojet/schemas";
import type { Adapter } from "../contract.js";
import { noOptions } from "../shared/adapter-kit.js";
import {
  contractPackageShared,
  contractTsConfig,
  sharedContractSource,
  typedApiClientSource,
} from "./contract.js";
import { makeApiEnv } from "./hono.js";

// ---------------------------------------------------------------------------
// Shared Environment Template
// ---------------------------------------------------------------------------

function makeNestPackage(auth: CreateInput["auth"]) {
  const authDeps: Record<string, string> = {};
  if (auth === "clerk") authDeps["@clerk/backend"] = "^2.14.0";
  if (auth === "supabase") authDeps["@supabase/supabase-js"] = "^2.49.1";
  if (auth === "firebase") authDeps["firebase-admin"] = "^13.1.0";
  if (auth === "jwt") authDeps.jsonwebtoken = "^9.0.2";

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
  const isJwt = input.auth === "jwt";

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
  } else if (isJwt) {
    authImport = 'import jwt from "jsonwebtoken";\n';
    verifyBody = `const decoded = jwt.verify(token, getEnv().JWT_SECRET) as { sub?: string };
    return { sub: decoded.sub ?? "jwt-user" };`;
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

export const nestjsBackendAdapter: Adapter = {
  id: "backend:nestjs",
  version: "1.0.0",
  kind: "api",
  displayName: "NestJS Modular API",
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
