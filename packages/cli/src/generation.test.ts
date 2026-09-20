import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadProjectContext, materializePlan, runDoctorChecks } from "@expojet/core";
import type { CreateInput } from "@expojet/schemas";
import { describe, expect, it } from "vitest";
import { buildCreatePlan, generateCreatePlan } from "./generation.js";

function input(destination: string): CreateInput {
  return {
    projectName: "generated-app",
    destination,
    structure: "standalone",
    packageManager: "pnpm",
    navigation: "router",
    navigationType: "tabs",
    typescript: true,
    icons: "lucide",
    state: "none",
    liquidGlass: false,
    analytics: "none",
    backend: "none",
    auth: "none",
    style: "stylesheet",
    database: "none",
    orm: "none",
    onboarding: false,
    darkMode: true,
    eas: false,
    install: false,
    git: false,
    sdk: 57,
  };
}

describe("Phase 2 generation", () => {
  it("generates a standalone no-auth fixture", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-generate-")), "generated-app");
    const result = generateCreatePlan(input(destination), false);
    expect(result.committed).toBe(true);
    expect(JSON.parse(readFileSync(join(destination, "package.json"), "utf8"))).toMatchObject({
      name: "generated-app",
      dependencies: { expo: "~57.0.24", "expo-router": "~57.0.22" },
    });
    expect(JSON.parse(readFileSync(join(destination, "app.json"), "utf8"))).toMatchObject({
      expo: { slug: "generated-app", scheme: "generated-app" },
    });
    expect(readFileSync(join(destination, "expojet.jsonc"), "utf8")).not.toContain("secret");
  });

  it("previews the exact plan without creating a target", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-preview-")), "generated-app");
    const result = generateCreatePlan(input(destination), true);
    expect(result.committed).toBe(false);
    expect(result.files).toContain("app/index.tsx");
    expect(existsSync(destination)).toBe(false);
  });

  it("materializes the same bytes shown by the web preview and written by the executor", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-materialize-")), "generated-app");
    const createInput: CreateInput = {
      ...input(destination),
      auth: "clerk" as const,
      socialProviders: ["google", "apple"],
      onboarding: true,
      liquidGlass: true,
      eas: true,
    };
    const preview = materializePlan(buildCreatePlan(createInput));
    const result = generateCreatePlan(createInput, false);

    expect(preview.map((file) => file.path)).toEqual(
      [...result.files].sort((left, right) => left.localeCompare(right)),
    );
    for (const file of preview) {
      expect(readFileSync(join(destination, file.path), "utf8")).toBe(file.content);
    }
  });

  it("plans Clerk hosted authentication", () => {
    const plan = buildCreatePlan({ ...input("unused"), auth: "clerk" });
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "add-dependency", name: "@clerk/expo" }),
        expect.objectContaining({ type: "write-file", path: ".maestro/clerk-auth.yaml" }),
      ]),
    );
  });

  it("plans the typed Hono and Neon monorepo", () => {
    const plan = buildCreatePlan({ ...input("unused"), structure: "monorepo", auth: "clerk" });
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "write-file", path: "apps/api/src/app.ts" }),
        expect.objectContaining({ type: "write-file", path: "apps/mobile/src/data/api.ts" }),
        expect.objectContaining({ type: "write-file", path: "packages/api-contract/src/index.ts" }),
      ]),
    );
  });

  it("plans the full-stack web and mobile monorepo (monorepo-web)", () => {
    const plan = buildCreatePlan({ ...input("unused"), structure: "monorepo-web", auth: "clerk" });
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "write-file", path: "apps/api/src/app.ts" }),
        expect.objectContaining({ type: "write-file", path: "apps/mobile/src/data/api.ts" }),
        expect.objectContaining({ type: "write-file", path: "apps/web/package.json" }),
        expect.objectContaining({ type: "write-file", path: "apps/web/app/layout.tsx" }),
        expect.objectContaining({ type: "write-file", path: "apps/web/app/page.tsx" }),
        expect.objectContaining({ type: "write-file", path: "apps/web/src/api.ts" }),
        expect.objectContaining({ type: "write-file", path: "packages/api-contract/src/index.ts" }),
      ]),
    );
  });

  it("plans the theme engine and dark mode tokens", () => {
    const plan = buildCreatePlan({ ...input("unused"), darkMode: true });
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "write-file", path: "src/theme/tokens.ts" }),
        expect.objectContaining({ type: "write-file", path: "src/theme/provider.tsx" }),
        expect.objectContaining({ type: "write-file", path: "src/components/theme-toggle.tsx" }),
      ]),
    );
  });

  it("keeps server secrets out of mobile operations", () => {
    const plan = buildCreatePlan({ ...input("unused"), structure: "monorepo", auth: "clerk" });
    const mobile = JSON.stringify(
      plan.operations.filter(
        (operation) => "path" in operation && operation.path.startsWith("apps/mobile/"),
      ),
    );
    expect(mobile).not.toMatch(/CLERK_SECRET_KEY|DIRECT_DATABASE_URL|DATABASE_URL/);
  });

  it("applies the Uniwind adapter without direct filesystem writes", () => {
    const plan = buildCreatePlan({ ...input("unused"), style: "uniwind" });
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "compose-metro" }),
        expect.objectContaining({ type: "add-dependency", name: "uniwind" }),
      ]),
    );
  });

  it("applies the NativeWind adapter with Metro composition and tailwind config", () => {
    const plan = buildCreatePlan({ ...input("unused"), style: "nativewind" });
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "compose-metro",
          contribution: expect.objectContaining({
            module: "nativewind/metro",
            exportName: "withNativeWind",
          }),
        }),
        expect.objectContaining({ type: "add-dependency", name: "nativewind" }),
        expect.objectContaining({ type: "add-dependency", name: "tailwindcss" }),
        expect.objectContaining({ type: "write-file", path: "tailwind.config.js" }),
        expect.objectContaining({ type: "write-file", path: "src/global.css" }),
        expect.objectContaining({ type: "write-file", path: "src/nativewind-env.d.ts" }),
      ]),
    );
  });

  it("applies the Unistyles adapter with themes and unistyles configuration", () => {
    const plan = buildCreatePlan({ ...input("unused"), style: "unistyles" });
    expect(plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "add-dependency", name: "react-native-unistyles" }),
        expect.objectContaining({ type: "write-file", path: "src/unistyles.ts" }),
        expect.objectContaining({ type: "write-file", path: "src/style-entry.ts" }),
        expect.objectContaining({ type: "write-file", path: "src/components/brand-card.tsx" }),
      ]),
    );
  });

  it("generates an atomic monorepo-web project that passes doctor checks", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-monorepo-web-")), "web-app");
    const result = generateCreatePlan(
      {
        ...input(destination),
        structure: "monorepo-web",
        auth: "clerk",
        style: "uniwind",
        darkMode: true,
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project).not.toBeNull();
    expect(project?.manifest.structure).toBe("monorepo-web");
    expect(project?.manifest.features?.darkMode).toBe(true);

    const checks = runDoctorChecks(project);
    const workspacesCheck = checks.find((c) => c.name === "Monorepo workspaces");
    expect(workspacesCheck?.status).toBe("pass");

    const secretBoundaryCheck = checks.find((c) => c.name === "Mobile secret boundary");
    expect(secretBoundaryCheck?.status).toBe("pass");

    expect(existsSync(join(destination, "apps/web/package.json"))).toBe(true);
    expect(existsSync(join(destination, "apps/web/app/layout.tsx"))).toBe(true);
    expect(existsSync(join(destination, "apps/web/app/page.tsx"))).toBe(true);
    expect(existsSync(join(destination, "apps/mobile/package.json"))).toBe(true);
    expect(existsSync(join(destination, "apps/mobile/src/theme/tokens.ts"))).toBe(true);
    expect(existsSync(join(destination, "apps/api/package.json"))).toBe(true);
    expect(existsSync(join(destination, "packages/api-contract/package.json"))).toBe(true);
  });

  it("generates a monorepo with Local Postgres and Prisma ORM", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-postgres-prisma-")), "pg-app");
    const result = generateCreatePlan(
      {
        ...input(destination),
        structure: "monorepo",
        auth: "clerk",
        database: "postgres",
        orm: "prisma",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project).not.toBeNull();
    expect(project?.manifest.adapters.database).toBe("postgres");
    expect(project?.manifest.adapters.orm).toBe("prisma");

    const checks = runDoctorChecks(project);
    const secretBoundaryCheck = checks.find((c) => c.name === "Mobile secret boundary");
    expect(secretBoundaryCheck?.status).toBe("pass");

    // Root docker-compose for Postgres
    expect(existsSync(join(destination, "docker-compose.yml"))).toBe(true);
    const composeContent = readFileSync(join(destination, "docker-compose.yml"), "utf8");
    expect(composeContent).toContain("postgres:16-alpine");

    // Prisma files in API
    expect(existsSync(join(destination, "apps/api/prisma/schema.prisma"))).toBe(true);
    const prismaSchema = readFileSync(join(destination, "apps/api/prisma/schema.prisma"), "utf8");
    expect(prismaSchema).toContain('provider  = "postgresql"');
    expect(existsSync(join(destination, "apps/api/src/db/client.ts"))).toBe(true);

    const apiPkg = JSON.parse(readFileSync(join(destination, "apps/api/package.json"), "utf8"));
    expect(apiPkg.dependencies["@prisma/client"]).toBeDefined();
    expect(apiPkg.devDependencies.prisma).toBeDefined();
    expect(apiPkg.scripts["db:generate"]).toBe("prisma generate");
  });

  it("generates a standalone app with SQLite and Drizzle ORM", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-sqlite-drizzle-")), "sqlite-app");
    const result = generateCreatePlan(
      {
        ...input(destination),
        structure: "standalone",
        database: "sqlite",
        orm: "drizzle",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project).not.toBeNull();
    expect(project?.manifest.adapters.database).toBe("sqlite");
    expect(project?.manifest.adapters.orm).toBe("drizzle");

    const pkg = JSON.parse(readFileSync(join(destination, "package.json"), "utf8"));
    expect(pkg.dependencies["expo-sqlite"]).toBeDefined();
    expect(pkg.dependencies["drizzle-orm"]).toBeDefined();
    expect(pkg.devDependencies["drizzle-kit"]).toBeDefined();

    expect(existsSync(join(destination, "src/db/schema.ts"))).toBe(true);
    expect(existsSync(join(destination, "src/db/client.ts"))).toBe(true);
    const clientContent = readFileSync(join(destination, "src/db/client.ts"), "utf8");
    expect(clientContent).toContain("openDatabaseSync");
  });

  it("generates a standalone app with Supabase Auth and Database", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-supabase-")), "supabase-app");
    const result = generateCreatePlan(
      {
        ...input(destination),
        structure: "standalone",
        auth: "supabase",
        database: "supabase",
        orm: "none",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project).not.toBeNull();
    expect(project?.manifest.adapters.auth).toBe("supabase");
    expect(project?.manifest.adapters.database).toBe("supabase");

    const pkg = JSON.parse(readFileSync(join(destination, "package.json"), "utf8"));
    expect(pkg.dependencies["@supabase/supabase-js"]).toBeDefined();
    expect(pkg.dependencies["expo-secure-store"]).toBeDefined();

    expect(existsSync(join(destination, "src/supabase/client.ts"))).toBe(true);
    expect(existsSync(join(destination, "src/session/provider.tsx"))).toBe(true);
    expect(existsSync(join(destination, "app/(public)/sign-in.tsx"))).toBe(true);
    expect(existsSync(join(destination, ".maestro/supabase-auth.yaml"))).toBe(true);

    const envContent = readFileSync(join(destination, "src/env.ts"), "utf8");
    expect(envContent).toContain("EXPO_PUBLIC_SUPABASE_URL");
    expect(envContent).toContain("EXPO_PUBLIC_SUPABASE_ANON_KEY");

    const checks = runDoctorChecks(project);
    expect(checks.find((c) => c.name === "Expo SDK pack")?.status).toBe("pass");
  });

  it("generates a standalone app with Firebase Auth", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-firebase-")), "firebase-app");
    const result = generateCreatePlan(
      {
        ...input(destination),
        structure: "standalone",
        auth: "firebase",
        database: "none",
        orm: "none",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project).not.toBeNull();
    expect(project?.manifest.adapters.auth).toBe("firebase");

    const pkg = JSON.parse(readFileSync(join(destination, "package.json"), "utf8"));
    expect(pkg.dependencies.firebase).toBeDefined();
    expect(pkg.dependencies["@react-native-async-storage/async-storage"]).toBeDefined();

    expect(existsSync(join(destination, "src/firebase/client.ts"))).toBe(true);
    expect(existsSync(join(destination, "src/session/provider.tsx"))).toBe(true);
    expect(existsSync(join(destination, "app/(public)/sign-in.tsx"))).toBe(true);
    expect(existsSync(join(destination, ".maestro/firebase-auth.yaml"))).toBe(true);

    const envContent = readFileSync(join(destination, "src/env.ts"), "utf8");
    expect(envContent).toContain("EXPO_PUBLIC_FIREBASE_API_KEY");
  });

  it("generates a monorepo with Supabase Auth, Supabase Postgres, and Drizzle", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-supabase-monorepo-")), "sb-mono");
    const result = generateCreatePlan(
      {
        ...input(destination),
        structure: "monorepo",
        auth: "supabase",
        database: "supabase",
        orm: "drizzle",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project).not.toBeNull();
    expect(project?.manifest.adapters.auth).toBe("supabase");
    expect(project?.manifest.adapters.database).toBe("supabase");

    const checks = runDoctorChecks(project);
    const secretBoundary = checks.find((c) => c.name === "Mobile secret boundary");
    expect(secretBoundary?.status).toBe("pass");

    // Check API dependencies
    const apiPkg = JSON.parse(readFileSync(join(destination, "apps/api/package.json"), "utf8"));
    expect(apiPkg.dependencies["@supabase/supabase-js"]).toBeDefined();
    expect(apiPkg.dependencies["drizzle-orm"]).toBeDefined();

    // Check API env
    const apiEnv = readFileSync(join(destination, "apps/api/src/env.ts"), "utf8");
    expect(apiEnv).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(apiEnv).toContain("DATABASE_URL");

    // Check mobile files
    expect(existsSync(join(destination, "apps/mobile/src/supabase/client.ts"))).toBe(true);
    expect(existsSync(join(destination, "apps/mobile/src/data/use-me.ts"))).toBe(true);
  });

  it("generates a monorepo with Firebase Auth, Neon, and Drizzle", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-firebase-monorepo-")), "fb-mono");
    const result = generateCreatePlan(
      {
        ...input(destination),
        structure: "monorepo",
        auth: "firebase",
        database: "neon",
        orm: "drizzle",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project).not.toBeNull();
    expect(project?.manifest.adapters.auth).toBe("firebase");

    const checks = runDoctorChecks(project);
    const secretBoundary = checks.find((c) => c.name === "Mobile secret boundary");
    expect(secretBoundary?.status).toBe("pass");

    // Check API dependencies and env
    const apiPkg = JSON.parse(readFileSync(join(destination, "apps/api/package.json"), "utf8"));
    expect(apiPkg.dependencies["firebase-admin"]).toBeDefined();

    const apiEnv = readFileSync(join(destination, "apps/api/src/env.ts"), "utf8");
    expect(apiEnv).toContain("FIREBASE_PROJECT_ID");

    // Check mobile files
    expect(existsSync(join(destination, "apps/mobile/src/firebase/client.ts"))).toBe(true);
    expect(existsSync(join(destination, "apps/mobile/src/data/use-me.ts"))).toBe(true);
  });

  it("generates a monorepo with Express backend", () => {
    const destination = join(
      mkdtempSync(join(tmpdir(), "expojet-express-monorepo-")),
      "express-mono",
    );
    const result = generateCreatePlan(
      {
        ...input(destination),
        structure: "monorepo",
        backend: "express",
        auth: "clerk",
        database: "neon",
        orm: "drizzle",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project).not.toBeNull();
    expect(project?.manifest.adapters.backend).toBe("express");

    const checks = runDoctorChecks(project);
    const expressCheck = checks.find((c) => c.name === "Express application entrypoint");
    expect(expressCheck?.status).toBe("pass");

    const apiPkg = JSON.parse(readFileSync(join(destination, "apps/api/package.json"), "utf8"));
    expect(apiPkg.dependencies.express).toBeDefined();
    expect(apiPkg.dependencies.cors).toBeDefined();
    expect(apiPkg.devDependencies.supertest).toBeDefined();

    const appSource = readFileSync(join(destination, "apps/api/src/app.ts"), "utf8");
    expect(appSource).toContain('app.get("/health"');
    expect(appSource).toContain('app.get("/v1/me"');

    const mobileApi = readFileSync(join(destination, "apps/mobile/src/data/api.ts"), "utf8");
    expect(mobileApi).toContain("createApiClient");
    expect(mobileApi).toContain("fetch");
  });

  it("generates a monorepo with NestJS backend", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-nest-monorepo-")), "nest-mono");
    const result = generateCreatePlan(
      {
        ...input(destination),
        structure: "monorepo",
        backend: "nestjs",
        auth: "clerk",
        database: "neon",
        orm: "drizzle",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project).not.toBeNull();
    expect(project?.manifest.adapters.backend).toBe("nestjs");

    const checks = runDoctorChecks(project);
    const nestCheck = checks.find((c) => c.name === "NestJS application bootstrap");
    expect(nestCheck?.status).toBe("pass");

    const apiPkg = JSON.parse(readFileSync(join(destination, "apps/api/package.json"), "utf8"));
    expect(apiPkg.dependencies["@nestjs/core"]).toBeDefined();
    expect(apiPkg.dependencies["@nestjs/common"]).toBeDefined();
    expect(apiPkg.dependencies["reflect-metadata"]).toBeDefined();

    expect(existsSync(join(destination, "apps/api/src/main.ts"))).toBe(true);
    expect(existsSync(join(destination, "apps/api/src/app.module.ts"))).toBe(true);
    expect(existsSync(join(destination, "apps/api/src/health.controller.ts"))).toBe(true);
    expect(existsSync(join(destination, "apps/api/src/me.controller.ts"))).toBe(true);
  });

  it("generates a standalone app with Convex backend", () => {
    const destination = join(
      mkdtempSync(join(tmpdir(), "expojet-convex-standalone-")),
      "convex-app",
    );
    const result = generateCreatePlan(
      {
        ...input(destination),
        structure: "standalone",
        backend: "convex",
        database: "none",
        orm: "none",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project).not.toBeNull();
    expect(project?.manifest.adapters.backend).toBe("convex");

    const checks = runDoctorChecks(project);
    const convexCheck = checks.find((c) => c.name === "Convex schema");
    expect(convexCheck?.status).toBe("pass");

    expect(existsSync(join(destination, "convex/schema.ts"))).toBe(true);
    expect(existsSync(join(destination, "convex/users.ts"))).toBe(true);

    const provider = readFileSync(join(destination, "src/data/provider.tsx"), "utf8");
    expect(provider).toContain("ConvexProvider");
    expect(provider).toContain("ConvexReactClient");
  });

  it("generates a monorepo with Convex backend", () => {
    const destination = join(
      mkdtempSync(join(tmpdir(), "expojet-convex-monorepo-")),
      "convex-mono",
    );
    const result = generateCreatePlan(
      {
        ...input(destination),
        structure: "monorepo",
        backend: "convex",
        database: "none",
        orm: "none",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project).not.toBeNull();
    expect(project?.manifest.adapters.backend).toBe("convex");

    const checks = runDoctorChecks(project);
    const convexCheck = checks.find((c) => c.name === "Convex schema");
    expect(convexCheck?.status).toBe("pass");

    expect(existsSync(join(destination, "apps/api/convex/schema.ts"))).toBe(true);
    expect(existsSync(join(destination, "apps/api/convex/users.ts"))).toBe(true);

    const apiPkg = JSON.parse(readFileSync(join(destination, "apps/api/package.json"), "utf8"));
    expect(apiPkg.scripts.dev).toBe("convex dev");
  });

  it("generates a standalone app with React Navigation and Uniwind", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-react-nav-")), "react-nav-app");
    const result = generateCreatePlan(
      {
        ...input(destination),
        navigation: "react-navigation",
        style: "uniwind",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project).not.toBeNull();
    expect(project?.manifest.adapters.navigation).toBe("react-navigation");
    expect(project?.manifest.adapters.style).toBe("uniwind");

    const checks = runDoctorChecks(project);
    const navCheck = checks.find((c) => c.name === "React Navigation entrypoint");
    expect(navCheck?.status).toBe("pass");

    expect(existsSync(join(destination, "index.js"))).toBe(true);
    expect(existsSync(join(destination, "src/App.tsx"))).toBe(true);
    expect(existsSync(join(destination, "src/navigation/RootNavigator.tsx"))).toBe(true);
    expect(existsSync(join(destination, "src/navigation/AppNavigator.tsx"))).toBe(true);
    expect(existsSync(join(destination, "src/navigation/AuthNavigator.tsx"))).toBe(true);
    expect(existsSync(join(destination, "src/screens/HomeScreen.tsx"))).toBe(true);
    expect(existsSync(join(destination, "src/screens/ProfileScreen.tsx"))).toBe(true);

    // app/ folder should be omitted in react-navigation mode
    expect(existsSync(join(destination, "app/index.tsx"))).toBe(false);
    expect(existsSync(join(destination, "app/(public)/sign-in.tsx"))).toBe(false);

    const pkg = JSON.parse(readFileSync(join(destination, "package.json"), "utf8"));
    expect(pkg.main).toBe("index.js");
    expect(pkg.dependencies["@react-navigation/native"]).toBeDefined();
    expect(pkg.dependencies["@react-navigation/native-stack"]).toBeDefined();
    expect(pkg.dependencies["@react-navigation/bottom-tabs"]).toBeDefined();
    expect(pkg.dependencies["expo-router"]).toBeUndefined();
    const appConfig = JSON.parse(readFileSync(join(destination, "app.json"), "utf8"));
    expect(appConfig.expo.plugins).not.toContain("expo-router");
    expect(appConfig.expo.experiments?.typedRoutes).toBeUndefined();
  });

  it("generates a standalone app with Custom JWT authentication", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-jwt-")), "jwt-app");
    const result = generateCreatePlan(
      {
        ...input(destination),
        auth: "jwt",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project).not.toBeNull();
    expect(project?.manifest.adapters.auth).toBe("jwt");

    const checks = runDoctorChecks(project);
    const jwtCheck = checks.find((c) => c.name === "JWT auth client");
    expect(jwtCheck?.status).toBe("pass");

    expect(existsSync(join(destination, "src/auth/jwt-client.ts"))).toBe(true);
    expect(existsSync(join(destination, "src/session/provider.tsx"))).toBe(true);
    expect(existsSync(join(destination, "app/(public)/sign-in.tsx"))).toBe(true);
    expect(existsSync(join(destination, "app/(public)/sign-up.tsx"))).toBe(true);
    expect(existsSync(join(destination, ".maestro/jwt-auth.yaml"))).toBe(true);

    const pkg = JSON.parse(readFileSync(join(destination, "package.json"), "utf8"));
    expect(pkg.dependencies["expo-secure-store"]).toBeDefined();
  });

  it("generates a monorepo with React Navigation and Custom JWT Auth on Hono", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-mono-jwt-nav-")), "mono-jwt-nav");
    const result = generateCreatePlan(
      {
        ...input(destination),
        structure: "monorepo",
        navigation: "react-navigation",
        auth: "jwt",
        backend: "hono",
        database: "none",
        orm: "none",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project).not.toBeNull();
    expect(project?.manifest.adapters.navigation).toBe("react-navigation");
    expect(project?.manifest.adapters.auth).toBe("jwt");

    const checks = runDoctorChecks(project);
    const secretCheck = checks.find((c) => c.name === "Mobile secret boundary");
    expect(secretCheck?.status).toBe("pass");
    const navCheck = checks.find((c) => c.name === "React Navigation entrypoint");
    expect(navCheck?.status).toBe("pass");
    const jwtCheck = checks.find((c) => c.name === "JWT auth client");
    expect(jwtCheck?.status).toBe("pass");

    // Check mobile files
    expect(existsSync(join(destination, "apps/mobile/src/App.tsx"))).toBe(true);
    expect(existsSync(join(destination, "apps/mobile/index.js"))).toBe(true);
    expect(existsSync(join(destination, "apps/mobile/src/navigation/RootNavigator.tsx"))).toBe(
      true,
    );
    expect(existsSync(join(destination, "apps/mobile/src/auth/jwt-client.ts"))).toBe(true);
    expect(existsSync(join(destination, "apps/mobile/app/index.tsx"))).toBe(false);

    // Check backend files
    const envFile = readFileSync(join(destination, "apps/api/src/env.ts"), "utf8");
    expect(envFile).toContain("JWT_SECRET");
    expect(envFile).toContain("JWT_REFRESH_SECRET");

    const appFile = readFileSync(join(destination, "apps/api/src/app.ts"), "utf8");
    expect(appFile).toContain("/auth/register");
    expect(appFile).toContain("/auth/login");
    expect(appFile).toContain("/auth/refresh");
  });

  it("generates an Expo Router app with drawer layout", () => {
    const destination = join(
      mkdtempSync(join(tmpdir(), "expojet-router-drawer-")),
      "router-drawer",
    );
    const result = generateCreatePlan(
      {
        ...input(destination),
        navigation: "router",
        navigationType: "drawer",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project).not.toBeNull();
    expect(project?.manifest.adapters.navigationType).toBe("drawer");

    const checks = runDoctorChecks(project);
    const layoutCheck = checks.find((c) => c.name === "Expo Router protected layout");
    expect(layoutCheck?.status).toBe("pass");

    expect(existsSync(join(destination, "app/_layout.tsx"))).toBe(true);
    expect(existsSync(join(destination, "app/(app)/_layout.tsx"))).toBe(true);
    expect(existsSync(join(destination, "app/(app)/index.tsx"))).toBe(true);
    expect(existsSync(join(destination, "app/(app)/profile.tsx"))).toBe(true);

    const rootLayout = readFileSync(join(destination, "app/_layout.tsx"), "utf8");
    expect(rootLayout).toContain("GestureHandlerRootView");

    const appLayout = readFileSync(join(destination, "app/(app)/_layout.tsx"), "utf8");
    expect(appLayout).toContain("<Drawer");

    const pkg = JSON.parse(readFileSync(join(destination, "package.json"), "utf8"));
    expect(pkg.dependencies["@react-navigation/drawer"]).toBeDefined();
    expect(pkg.dependencies["react-native-gesture-handler"]).toBeDefined();
  });

  it("generates an Expo Router app with both (drawer + tabs) layout", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-router-both-")), "router-both");
    const result = generateCreatePlan(
      {
        ...input(destination),
        navigation: "router",
        navigationType: "both",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project).not.toBeNull();
    expect(project?.manifest.adapters.navigationType).toBe("both");

    const checks = runDoctorChecks(project);
    const nestedCheck = checks.find((c) => c.name === "Expo Router nested tabs layout");
    expect(nestedCheck?.status).toBe("pass");

    expect(existsSync(join(destination, "app/_layout.tsx"))).toBe(true);
    expect(existsSync(join(destination, "app/(app)/_layout.tsx"))).toBe(true);
    expect(existsSync(join(destination, "app/(app)/(tabs)/_layout.tsx"))).toBe(true);
    expect(existsSync(join(destination, "app/(app)/(tabs)/index.tsx"))).toBe(true);
    expect(existsSync(join(destination, "app/(app)/(tabs)/profile.tsx"))).toBe(true);
    expect(existsSync(join(destination, "app/(app)/settings.tsx"))).toBe(true);
    expect(existsSync(join(destination, "app/(app)/index.tsx"))).toBe(false);

    const appLayout = readFileSync(join(destination, "app/(app)/_layout.tsx"), "utf8");
    expect(appLayout).toContain('name="(tabs)"');
    expect(appLayout).toContain('name="settings"');
  });

  it("generates an Expo Router app with stack layout", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-router-stack-")), "router-stack");
    const result = generateCreatePlan(
      {
        ...input(destination),
        navigation: "router",
        navigationType: "stack",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project?.manifest.adapters.navigationType).toBe("stack");

    const appLayout = readFileSync(join(destination, "app/(app)/_layout.tsx"), "utf8");
    expect(appLayout).toContain("<Stack");

    const indexContent = readFileSync(join(destination, "app/(app)/index.tsx"), "utf8");
    expect(indexContent).toContain('href="/profile"');

    const pkg = JSON.parse(readFileSync(join(destination, "package.json"), "utf8"));
    expect(pkg.dependencies["@react-navigation/drawer"]).toBeUndefined();
  });

  it("generates a React Navigation app with drawer layout", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-react-nav-drawer-")), "rn-drawer");
    const result = generateCreatePlan(
      {
        ...input(destination),
        navigation: "react-navigation",
        navigationType: "drawer",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project?.manifest.adapters.navigationType).toBe("drawer");

    const checks = runDoctorChecks(project);
    const navCheck = checks.find((c) => c.name === "React Navigation entrypoint");
    expect(navCheck?.status).toBe("pass");

    const appContent = readFileSync(join(destination, "src/App.tsx"), "utf8");
    expect(appContent).toContain("GestureHandlerRootView");

    const appNavContent = readFileSync(
      join(destination, "src/navigation/AppNavigator.tsx"),
      "utf8",
    );
    expect(appNavContent).toContain("createDrawerNavigator");

    const pkg = JSON.parse(readFileSync(join(destination, "package.json"), "utf8"));
    expect(pkg.dependencies["@react-navigation/drawer"]).toBeDefined();
    expect(pkg.dependencies["react-native-gesture-handler"]).toBeDefined();
    expect(pkg.dependencies["@react-navigation/bottom-tabs"]).toBeUndefined();
  });

  it("generates a React Navigation app with both (drawer + tabs) layout", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-react-nav-both-")), "rn-both");
    const result = generateCreatePlan(
      {
        ...input(destination),
        navigation: "react-navigation",
        navigationType: "both",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project?.manifest.adapters.navigationType).toBe("both");

    const checks = runDoctorChecks(project);
    const tabCheck = checks.find((c) => c.name === "React Navigation TabNavigator");
    expect(tabCheck?.status).toBe("pass");

    expect(existsSync(join(destination, "src/navigation/TabNavigator.tsx"))).toBe(true);
    expect(existsSync(join(destination, "src/screens/SettingsScreen.tsx"))).toBe(true);

    const appNavContent = readFileSync(
      join(destination, "src/navigation/AppNavigator.tsx"),
      "utf8",
    );
    expect(appNavContent).toContain("createDrawerNavigator");
    expect(appNavContent).toContain("TabNavigator");

    const pkg = JSON.parse(readFileSync(join(destination, "package.json"), "utf8"));
    expect(pkg.dependencies["@react-navigation/drawer"]).toBeDefined();
    expect(pkg.dependencies["@react-navigation/bottom-tabs"]).toBeDefined();
    expect(pkg.dependencies["react-native-gesture-handler"]).toBeDefined();
  });

  it("generates a React Navigation app with stack layout", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-react-nav-stack-")), "rn-stack");
    const result = generateCreatePlan(
      {
        ...input(destination),
        navigation: "react-navigation",
        navigationType: "stack",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const project = loadProjectContext(destination);
    expect(project?.manifest.adapters.navigationType).toBe("stack");

    const appNavContent = readFileSync(
      join(destination, "src/navigation/AppNavigator.tsx"),
      "utf8",
    );
    expect(appNavContent).toContain("createNativeStackNavigator");

    const homeContent = readFileSync(join(destination, "src/screens/HomeScreen.tsx"), "utf8");
    expect(homeContent).toContain('navigation.navigate("Profile")');

    const pkg = JSON.parse(readFileSync(join(destination, "package.json"), "utf8"));
    expect(pkg.dependencies["@react-navigation/native"]).toBeDefined();
    expect(pkg.dependencies["@react-navigation/native-stack"]).toBeDefined();
    expect(pkg.dependencies["@react-navigation/drawer"]).toBeUndefined();
    expect(pkg.dependencies["@react-navigation/bottom-tabs"]).toBeUndefined();
  });

  it("generates a standalone app with Lucide icons", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-icon-lucide-")), "lucide-app");
    const result = generateCreatePlan(
      {
        ...input(destination),
        icons: "lucide",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const iconFile = join(destination, "src/components/ui/icon.tsx");
    expect(existsSync(iconFile)).toBe(true);
    const content = readFileSync(iconFile, "utf8");
    expect(content).toContain("lucide-react-native");
    expect(content).toContain("export function Icon(");

    const pkg = JSON.parse(readFileSync(join(destination, "package.json"), "utf8"));
    expect(pkg.dependencies["lucide-react-native"]).toBeDefined();
    expect(pkg.dependencies["react-native-svg"]).toBeDefined();

    // Verify tabs layout imports and uses <Icon />
    const layout = readFileSync(join(destination, "app/(app)/_layout.tsx"), "utf8");
    expect(layout).toContain('import { Icon } from "../../src/components/ui/icon"');
    expect(layout).toContain('tabBarIcon: ({ color, size }) => <Icon name="home"');
  });

  it("generates an app with Hugeicons", () => {
    const destination = join(
      mkdtempSync(join(tmpdir(), "expojet-icon-hugeicons-")),
      "hugeicons-app",
    );
    const result = generateCreatePlan(
      {
        ...input(destination),
        icons: "hugeicons",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const iconFile = join(destination, "src/components/ui/icon.tsx");
    expect(existsSync(iconFile)).toBe(true);
    const content = readFileSync(iconFile, "utf8");
    expect(content).toContain("@hugeicons/react-native");
    expect(content).toContain("@hugeicons/core-free-icons");

    const pkg = JSON.parse(readFileSync(join(destination, "package.json"), "utf8"));
    expect(pkg.dependencies["@hugeicons/react-native"]).toBeDefined();
    expect(pkg.dependencies["@hugeicons/core-free-icons"]).toBeDefined();
    expect(pkg.dependencies["react-native-svg"]).toBeDefined();
  });

  it("generates an app with Expo Vector Icons", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-icon-expo-")), "expo-icons-app");
    const result = generateCreatePlan(
      {
        ...input(destination),
        icons: "expo",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const iconFile = join(destination, "src/components/ui/icon.tsx");
    expect(existsSync(iconFile)).toBe(true);
    const content = readFileSync(iconFile, "utf8");
    expect(content).toContain("@expo/vector-icons");
    expect(content).toContain("Ionicons");

    const pkg = JSON.parse(readFileSync(join(destination, "package.json"), "utf8"));
    expect(pkg.dependencies["@expo/vector-icons"]).toBeDefined();
    expect(pkg.dependencies["react-native-svg"]).toBeUndefined();
  });

  it("generates icon component in mobile workspace within monorepo", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-icon-monorepo-")), "monorepo-app");
    const result = generateCreatePlan(
      {
        ...input(destination),
        structure: "monorepo",
        icons: "lucide",
        backend: "hono",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const iconFile = join(destination, "apps/mobile/src/components/ui/icon.tsx");
    expect(existsSync(iconFile)).toBe(true);

    const mobilePkg = JSON.parse(
      readFileSync(join(destination, "apps/mobile/package.json"), "utf8"),
    );
    expect(mobilePkg.dependencies["lucide-react-native"]).toBeDefined();
    expect(mobilePkg.dependencies["react-native-svg"]).toBeDefined();
  });

  it("generates a standalone app with Zustand state management", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-state-zustand-")), "zustand-app");
    const result = generateCreatePlan(
      {
        ...input(destination),
        state: "zustand",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const storeFile = join(destination, "src/store/use-app-store.ts");
    expect(existsSync(storeFile)).toBe(true);
    const storeContent = readFileSync(storeFile, "utf8");
    expect(storeContent).toContain('from "zustand"');
    expect(storeContent).toContain("useAppStore = create<AppState>");

    const counterFile = join(destination, "src/components/counter-card.tsx");
    expect(existsSync(counterFile)).toBe(true);

    // Verify HomeScreen renders CounterCard
    const homeContent = readFileSync(join(destination, "app/(app)/index.tsx"), "utf8");
    expect(homeContent).toContain("CounterCard");
    expect(homeContent).toContain(
      'import { CounterCard } from "../../src/components/counter-card"',
    );

    const pkg = JSON.parse(readFileSync(join(destination, "package.json"), "utf8"));
    expect(pkg.dependencies.zustand).toBeDefined();

    // Verify doctor check
    const project = loadProjectContext(destination);
    expect(project?.manifest.adapters.state).toBe("zustand");
    const checks = runDoctorChecks(project);
    const zustandCheck = checks.find((c) => c.name === "Zustand store");
    expect(zustandCheck?.status).toBe("pass");
  });

  it("generates a standalone app with MobX state management", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-state-mobx-")), "mobx-app");
    const result = generateCreatePlan(
      {
        ...input(destination),
        state: "mobx",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const storeFile = join(destination, "src/store/app-store.ts");
    expect(existsSync(storeFile)).toBe(true);
    const storeContent = readFileSync(storeFile, "utf8");
    expect(storeContent).toContain('from "mobx"');
    expect(storeContent).toContain("makeAutoObservable(this)");

    const providerFile = join(destination, "src/store/provider.tsx");
    expect(existsSync(providerFile)).toBe(true);

    const counterFile = join(destination, "src/components/counter-card.tsx");
    expect(existsSync(counterFile)).toBe(true);
    const counterContent = readFileSync(counterFile, "utf8");
    expect(counterContent).toContain("mobx-react-lite");

    // Verify HomeScreen renders CounterCard
    const homeContent = readFileSync(join(destination, "app/(app)/index.tsx"), "utf8");
    expect(homeContent).toContain("CounterCard");

    const pkg = JSON.parse(readFileSync(join(destination, "package.json"), "utf8"));
    expect(pkg.dependencies.mobx).toBeDefined();
    expect(pkg.dependencies["mobx-react-lite"]).toBeDefined();

    // Verify doctor check
    const project = loadProjectContext(destination);
    expect(project?.manifest.adapters.state).toBe("mobx");
    const checks = runDoctorChecks(project);
    const mobxCheck = checks.find((c) => c.name === "MobX store");
    expect(mobxCheck?.status).toBe("pass");
  });

  it("generates React Navigation app with state counter card", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-rn-state-")), "rn-state");
    const result = generateCreatePlan(
      {
        ...input(destination),
        navigation: "react-navigation",
        state: "zustand",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const homeContent = readFileSync(join(destination, "src/screens/HomeScreen.tsx"), "utf8");
    expect(homeContent).toContain("CounterCard");
    expect(homeContent).toContain('import { CounterCard } from "../components/counter-card"');
  });

  it("generates monorepo app with Zustand store in mobile workspace", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-monorepo-state-")), "mono-state");
    const result = generateCreatePlan(
      {
        ...input(destination),
        structure: "monorepo",
        backend: "hono",
        state: "zustand",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const storeFile = join(destination, "apps/mobile/src/store/use-app-store.ts");
    expect(existsSync(storeFile)).toBe(true);

    const mobilePkg = JSON.parse(
      readFileSync(join(destination, "apps/mobile/package.json"), "utf8"),
    );
    expect(mobilePkg.dependencies.zustand).toBeDefined();
  });

  it("generates a standalone app with Liquid Glass UI engine enabled", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-liquid-glass-")), "glass-app");
    const result = generateCreatePlan(
      {
        ...input(destination),
        liquidGlass: true,
      },
      false,
    );
    expect(result.committed).toBe(true);

    const glassCardFile = join(destination, "src/components/ui/glass-card.tsx");
    expect(existsSync(glassCardFile)).toBe(true);
    const glassCardContent = readFileSync(glassCardFile, "utf8");
    expect(glassCardContent).toContain('from "expo-glass-effect"');
    expect(glassCardContent).toContain('from "expo-blur"');
    expect(glassCardContent).toContain("isGlassEffectAPIAvailable");

    // Verify the layout uses native platform tabs, which adopt Liquid Glass on iOS 26.
    const layoutContent = readFileSync(join(destination, "app/(app)/_layout.tsx"), "utf8");
    expect(layoutContent).toContain('from "expo-router/unstable-native-tabs"');
    expect(layoutContent).toContain("<NativeTabs");
    expect(layoutContent).not.toContain("GlassTabBarBackground");

    // Verify BrandCard uses GlassCard
    const brandContent = readFileSync(join(destination, "src/components/brand-card.tsx"), "utf8");
    expect(brandContent).toContain("GlassCard");

    const pkg = JSON.parse(readFileSync(join(destination, "package.json"), "utf8"));
    expect(pkg.dependencies["expo-glass-effect"]).toBeDefined();
    expect(pkg.dependencies["expo-blur"]).toBeDefined();

    // Verify doctor check
    const project = loadProjectContext(destination);
    expect(project?.manifest.features?.liquidGlass).toBe(true);
    const checks = runDoctorChecks(project);
    const cardCheck = checks.find((c) => c.name === "Liquid Glass card");
    expect(cardCheck?.status).toBe("pass");
    const tabCheck = checks.find((c) => c.name === "Native Liquid Glass tabs");
    expect(tabCheck?.status).toBe("pass");
  });

  it("rejects React Navigation tabs with Liquid Glass because Expo Go requires Router native tabs", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-rn-glass-")), "rn-glass");
    expect(() =>
      generateCreatePlan(
        {
          ...input(destination),
          navigation: "react-navigation",
          liquidGlass: true,
        },
        false,
      ),
    ).toThrow(
      "Native Liquid Glass tabs in Expo Go require the Expo Router navigation adapter on SDK 57",
    );
  });

  it("generates a monorepo app with Liquid Glass in mobile workspace", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-mono-glass-")), "mono-glass");
    const result = generateCreatePlan(
      {
        ...input(destination),
        structure: "monorepo",
        backend: "hono",
        liquidGlass: true,
      },
      false,
    );
    expect(result.committed).toBe(true);

    const glassCardFile = join(destination, "apps/mobile/src/components/ui/glass-card.tsx");
    expect(existsSync(glassCardFile)).toBe(true);

    const mobilePkg = JSON.parse(
      readFileSync(join(destination, "apps/mobile/package.json"), "utf8"),
    );
    expect(mobilePkg.dependencies["expo-glass-effect"]).toBeDefined();
    expect(mobilePkg.dependencies["expo-blur"]).toBeDefined();
  });

  it("generates a standalone app with PostHog analytics and verifies doctor checks", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-posthog-")), "posthog-app");
    const result = generateCreatePlan(
      {
        ...input(destination),
        analytics: "posthog",
      },
      false,
    );
    expect(result.committed).toBe(true);

    expect(existsSync(join(destination, "src/analytics/posthog.ts"))).toBe(true);
    expect(existsSync(join(destination, "src/analytics/provider.tsx"))).toBe(true);
    expect(existsSync(join(destination, "src/analytics/index.ts"))).toBe(true);

    const pkg = JSON.parse(readFileSync(join(destination, "package.json"), "utf8"));
    expect(pkg.dependencies["posthog-react-native"]).toBeDefined();
    expect(pkg.dependencies["expo-file-system"]).toBeDefined();
    expect(pkg.dependencies["expo-application"]).toBeDefined();

    const envExample = readFileSync(join(destination, ".env.example"), "utf8");
    expect(envExample).toContain("EXPO_PUBLIC_POSTHOG_KEY");
    expect(envExample).toContain("EXPO_PUBLIC_POSTHOG_HOST");

    const project = loadProjectContext(destination);
    expect(project?.manifest.adapters.analytics).toBe("posthog");
    const checks = runDoctorChecks(project);
    const modCheck = checks.find((c) => c.name === "Mobile analytics module");
    expect(modCheck?.status).toBe("pass");
    const provCheck = checks.find((c) => c.name === "Mobile analytics provider");
    expect(provCheck?.status).toBe("pass");
  });

  it("generates a monorepo app with Aptabase analytics in apps/mobile", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-aptabase-")), "aptabase-mono");
    const result = generateCreatePlan(
      {
        ...input(destination),
        structure: "monorepo",
        backend: "hono",
        analytics: "aptabase",
      },
      false,
    );
    expect(result.committed).toBe(true);

    const mobileAnalytics = join(destination, "apps/mobile/src/analytics/aptabase.ts");
    expect(existsSync(mobileAnalytics)).toBe(true);

    const mobilePkg = JSON.parse(
      readFileSync(join(destination, "apps/mobile/package.json"), "utf8"),
    );
    expect(mobilePkg.dependencies["@aptabase/react-native"]).toBeDefined();

    const mobileEnv = readFileSync(join(destination, "apps/mobile/.env.example"), "utf8");
    expect(mobileEnv).toContain("EXPO_PUBLIC_APTABASE_KEY");

    const project = loadProjectContext(destination);
    expect(project?.manifest.adapters.analytics).toBe("aptabase");
    const checks = runDoctorChecks(project);
    const modCheck = checks.find((c) => c.name === "Mobile analytics module");
    expect(modCheck?.status).toBe("pass");
  });

  it("generates an app with none analytics having zero analytics overhead", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-no-analytics-")), "no-analytics");
    const result = generateCreatePlan(
      {
        ...input(destination),
        analytics: "none",
      },
      false,
    );
    expect(result.committed).toBe(true);

    expect(existsSync(join(destination, "src/analytics"))).toBe(false);

    const pkg = JSON.parse(readFileSync(join(destination, "package.json"), "utf8"));
    expect(pkg.dependencies["posthog-react-native"]).toBeUndefined();
    expect(pkg.dependencies["@aptabase/react-native"]).toBeUndefined();
  });

  it("generates a standalone app with EAS Build configuration and passes doctor check", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-eas-")), "eas-standalone");
    const result = generateCreatePlan(
      {
        ...input(destination),
        eas: true,
      },
      false,
    );
    expect(result.committed).toBe(true);

    const easPath = join(destination, "eas.json");
    expect(existsSync(easPath)).toBe(true);

    const easConfig = JSON.parse(readFileSync(easPath, "utf8"));
    expect(easConfig.$schema).toBe("https://json.schemastore.org/eas-json");
    expect(easConfig.cli).toMatchObject({
      version: ">= 16.0.0",
      appVersionSource: "remote",
    });
    expect(easConfig.build.development).toMatchObject({
      developmentClient: true,
      distribution: "internal",
      ios: { simulator: true },
    });
    expect(easConfig.build.preview).toMatchObject({
      distribution: "internal",
      channel: "preview",
    });
    expect(easConfig.build.production).toMatchObject({
      autoIncrement: true,
      channel: "production",
    });
    const appConfig = JSON.parse(readFileSync(join(destination, "app.json"), "utf8"));
    expect(appConfig.expo.ios.bundleIdentifier).toBe("com.expojet.generatedapp");
    expect(appConfig.expo.android.package).toBe("com.expojet.generatedapp");
    expect(appConfig.expo.runtimeVersion).toEqual({ policy: "appVersion" });

    const project = loadProjectContext(destination);
    expect(project?.manifest.features?.eas).toBe(true);

    const checks = runDoctorChecks(project);
    const easCheck = checks.find((c) => c.name === "EAS Build configuration");
    expect(easCheck?.status).toBe("pass");
    expect(easCheck?.message).toContain("development, preview, and production");
  });

  it("generates a monorepo app with EAS in apps/mobile and passes doctor check", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-eas-mono-")), "eas-monorepo");
    const result = generateCreatePlan(
      {
        ...input(destination),
        structure: "monorepo",
        backend: "hono",
        eas: true,
      },
      false,
    );
    expect(result.committed).toBe(true);

    const easPath = join(destination, "apps/mobile/eas.json");
    expect(existsSync(easPath)).toBe(true);

    const project = loadProjectContext(destination);
    expect(project?.manifest.features?.eas).toBe(true);

    const checks = runDoctorChecks(project);
    const easCheck = checks.find((c) => c.name === "EAS Build configuration");
    expect(easCheck?.status).toBe("pass");
  });

  it("omits eas.json and skips EAS doctor check when eas is false", () => {
    const destination = join(mkdtempSync(join(tmpdir(), "expojet-no-eas-")), "no-eas");
    const result = generateCreatePlan(
      {
        ...input(destination),
        eas: false,
      },
      false,
    );
    expect(result.committed).toBe(true);

    expect(existsSync(join(destination, "eas.json"))).toBe(false);

    const project = loadProjectContext(destination);
    expect(project?.manifest.features?.eas).toBe(false);

    const checks = runDoctorChecks(project);
    const easCheck = checks.find((c) => c.name === "EAS Build configuration");
    expect(easCheck).toBeUndefined();
  });
});
